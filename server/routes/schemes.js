/**
 * Scheme Discovery Routes — Match citizens to government schemes
 * Integrates with real government APIs:
 * - data.gov.in (Open Government Data)
 * - MyScheme portal (myscheme.gov.in)
 * - PM-KISAN, PMJAY status check APIs
 */

import { Router } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractFeatures, violatesHardFilter, predict } from '../lib/schemeMatch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Trained relevance model + TF-IDF idf weights (see scripts/trainRelevanceModel.js)
const dataDir = path.join(__dirname, '..', 'data');
const { idf } = JSON.parse(fs.readFileSync(path.join(dataDir, 'tfidf.json'), 'utf8'));
const relevanceModel = JSON.parse(fs.readFileSync(path.join(dataDir, 'relevanceModel.json'), 'utf8'));

function toApiScheme(scheme, match) {
  return {
    id: scheme.id,
    name: scheme.name,
    ministry: scheme.level,
    description: scheme.description,
    eligibility: JSON.parse(scheme.eligibility || '[]'),
    benefit: scheme.benefit,
    match,
    category: scheme.category,
    status: scheme.status,
  };
}

// POST /api/schemes/discover
router.post('/discover', (req, res) => {
  const profile = req.body; // { ageGroup, gender, state, income, category, occupation }

  const db = req.app.locals.db;
  const allSchemes = db.prepare('SELECT * FROM schemes WHERE status = ?').all('Active');

  const results = allSchemes
    .filter(scheme => !violatesHardFilter(profile, scheme))
    .map(scheme => {
      // Scheme already passed the hard eligibility filter, so it's a baseline 50%+ fit;
      // the trained model's probability scales the rest based on occupation/category text fit.
      const features = extractFeatures(profile, scheme, idf);
      const probability = predict(features, relevanceModel);
      const match = Math.max(50, Math.min(99, Math.round(50 + probability * 49)));
      return toApiScheme(scheme, match);
    });

  results.sort((a, b) => b.match - a.match);

  return res.json({ success: true, schemes: results.slice(0, 30) });
});

// GET /api/schemes — list all schemes
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const schemes = db.prepare('SELECT * FROM schemes ORDER BY name').all();

  return res.json({
    success: true,
    schemes: schemes.map(s => toApiScheme(s, null)),
  });
});

// ══════════════════════════════════════════════════════════════
// Real Government Scheme API Integrations
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/schemes/gov/data-portal
 * Fetches scheme data from data.gov.in Open Government Data Platform
 * API: https://data.gov.in/backend/dmspublic/v1/resources
 */
router.get('/gov/data-portal', async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    
    // data.gov.in public catalog API
    const response = await axios.get('https://data.gov.in/backend/dmspublic/v1/resources', {
      params: {
        'filters[sector]': category || 'Social Development',
        'offset': 0,
        'limit': limit,
        'sort[updated]': 'desc',
      },
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      },
    });

    const resources = response.data?.resources || response.data?.data || [];
    
    return res.json({
      success: true,
      source: 'data.gov.in',
      count: resources.length,
      schemes: resources.map(r => ({
        id: r.resource_id || r.id,
        name: r.title || r.resource_title,
        ministry: r.org?.[0]?.title || r.department || 'Government of India',
        description: r.description || r.notes || '',
        category: r.sector || category || 'Government',
        url: r.url || `https://data.gov.in/resource/${r.resource_id || r.id}`,
        lastUpdated: r.updated || r.created,
        format: r.format,
      })),
    });
  } catch (err) {
    console.error('[Gov Data Portal Error]', err.message);
    return res.json({
      success: false,
      error: 'Could not fetch from data.gov.in',
      fallback: true,
      schemes: [],
    });
  }
});

/**
 * GET /api/schemes/gov/myscheme
 * Search schemes from MyScheme.gov.in (National Portal for Government Schemes)
 */
router.get('/gov/myscheme', async (req, res) => {
  try {
    const { category, state, beneficiary } = req.query;
    
    // MyScheme API endpoint
    const response = await axios.get('https://www.myscheme.gov.in/api/search/schemes', {
      params: {
        category: category || '',
        state: state || '',
        beneficiary: beneficiary || '',
        page: 1,
        per_page: 30,
      },
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SUVIDHA-Kiosk/2026',
      },
    });

    const schemes = response.data?.schemes || response.data?.data || [];
    
    return res.json({
      success: true,
      source: 'myscheme.gov.in',
      count: schemes.length,
      schemes: schemes.map(s => ({
        id: s.id || s.scheme_id,
        name: s.name || s.scheme_name || s.title,
        nameHi: s.name_hi || s.scheme_name_hi || null,
        ministry: s.ministry || s.department || s.nodal_ministry,
        description: s.description || s.brief || s.scheme_description,
        category: s.category || s.scheme_category,
        benefit: s.benefit || s.scheme_benefit,
        eligibility: s.eligibility || [],
        url: s.url || `https://www.myscheme.gov.in/schemes/${s.slug || s.id}`,
        applicationUrl: s.application_url || null,
        status: 'Active',
      })),
    });
  } catch (err) {
    console.error('[MyScheme API Error]', err.message);
    return res.json({
      success: false,
      error: 'Could not fetch from myscheme.gov.in',
      fallback: true,
      schemes: [],
    });
  }
});

/**
 * POST /api/schemes/gov/pm-kisan/status
 * Check PM-KISAN beneficiary status
 */
router.post('/gov/pm-kisan/status', async (req, res) => {
  try {
    const { aadhaar, mobile, accountNumber } = req.body;
    
    if (!aadhaar && !mobile && !accountNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provide Aadhaar, mobile, or account number' 
      });
    }

    // PM-KISAN official API
    const response = await axios.post('https://pmkisan.gov.in/api/beneficiarystatus', {
      aadhaar_number: aadhaar,
      mobile_number: mobile,
      account_number: accountNumber,
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    return res.json({
      success: true,
      source: 'pmkisan.gov.in',
      status: response.data?.status || response.data,
      beneficiaryDetails: response.data?.beneficiary || null,
      installments: response.data?.installments || [],
    });
  } catch (err) {
    console.error('[PM-KISAN Status Error]', err.message);
    // Return mock data for demo
    return res.json({
      success: true,
      source: 'mock',
      note: 'Live API unavailable — showing demo data',
      status: 'Registered',
      beneficiaryDetails: {
        name: req.body.aadhaar ? 'Demo Beneficiary' : null,
        state: 'Demo State',
        district: 'Demo District',
      },
      installments: [
        { installment: 1, amount: 2000, date: '2024-04-01', status: 'Credited' },
        { installment: 2, amount: 2000, date: '2024-08-01', status: 'Credited' },
        { installment: 3, amount: 2000, date: '2024-12-01', status: 'Pending' },
      ],
    });
  }
});

/**
 * POST /api/schemes/gov/pmjay/check
 * Check Ayushman Bharat (PMJAY) eligibility
 */
router.post('/gov/pmjay/check', async (req, res) => {
  try {
    const { aadhaar, hhd_number, mobile, state } = req.body;

    const response = await axios.post('https://mera.pmjay.gov.in/search/login', {
      aadhaar_number: aadhaar,
      hhd_number,
      mobile_number: mobile,
      state_code: state,
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    return res.json({
      success: true,
      source: 'pmjay.gov.in',
      eligible: response.data?.eligible || false,
      details: response.data,
    });
  } catch (err) {
    console.error('[PMJAY Check Error]', err.message);
    return res.json({
      success: true,
      source: 'mock',
      note: 'Live API unavailable — showing demo data',
      eligible: true,
      details: {
        scheme: 'Ayushman Bharat - PMJAY',
        coverage: '₹5,00,000 per family per year',
        empanelledHospitals: 23000,
        status: 'Eligible (demo)',
      },
    });
  }
});

/**
 * GET /api/schemes/gov/scholarship
 * Fetch scholarship data from National Scholarship Portal API
 */
router.get('/gov/scholarship', async (req, res) => {
  try {
    const { category, level, state } = req.query;

    const response = await axios.get('https://scholarships.gov.in/public/schemeList', {
      params: {
        category: category || 'all',
        level: level || 'all',
        state: state || 'all',
      },
      timeout: 10000,
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'SUVIDHA-Kiosk/2026',
      },
    });

    const scholarships = response.data?.schemes || response.data?.scholarships || [];
    
    return res.json({
      success: true,
      source: 'scholarships.gov.in',
      count: scholarships.length,
      schemes: scholarships.map(s => ({
        id: s.id || s.scheme_id,
        name: s.name || s.scheme_name,
        ministry: s.ministry || 'Ministry of Education',
        description: s.description || s.details,
        amount: s.amount || s.scholarship_amount,
        eligibility: s.eligibility || s.criteria,
        deadline: s.deadline || s.last_date,
        url: s.url || 'https://scholarships.gov.in',
      })),
    });
  } catch (err) {
    console.error('[Scholarship Portal Error]', err.message);
    return res.json({
      success: false,
      error: 'Could not fetch from scholarships.gov.in',
      fallback: true,
      schemes: [],
    });
  }
});

/**
 * GET /api/schemes/gov/search-all
 * Unified search across all government scheme sources
 */
router.get('/gov/search-all', async (req, res) => {
  const { query, category, state } = req.query;
  
  // Fetch from DB + multiple government portals in parallel
  const db = req.app.locals.db;
  const dbSchemes = db.prepare('SELECT * FROM schemes WHERE status = ?').all('Active');

  const govPromises = [
    // Try fetching from data.gov.in
    axios.get('https://data.gov.in/backend/dmspublic/v1/resources', {
      params: { 'filters[sector]': category || 'Social Development', limit: 10 },
      timeout: 8000,
    }).catch(() => ({ data: { resources: [] } })),
    
    // Try fetching from MyScheme
    axios.get('https://www.myscheme.gov.in/api/search/schemes', {
      params: { category, state, page: 1, per_page: 10 },
      timeout: 8000,
    }).catch(() => ({ data: { schemes: [] } })),
  ];

  const [dataGovRes, mySchemeRes] = await Promise.all(govPromises);
  
  // Combine local DB schemes with live data
  const localSchemes = dbSchemes.map(s => ({ ...toApiScheme(s, null), source: 'local' }));

  const liveSchemes = [
    ...(dataGovRes.data?.resources || []).map(r => ({
      id: `datagov-${r.resource_id || r.id}`,
      name: r.title || r.resource_title,
      ministry: r.org?.[0]?.title || 'Government of India',
      description: r.description || r.notes || '',
      category: r.sector || 'Government',
      source: 'data.gov.in',
      url: `https://data.gov.in/resource/${r.resource_id}`,
    })),
    ...(mySchemeRes.data?.schemes || mySchemeRes.data?.data || []).map(s => ({
      id: `myscheme-${s.id || s.scheme_id}`,
      name: s.name || s.scheme_name || s.title,
      ministry: s.ministry || s.department,
      description: s.description || s.brief,
      category: s.category || 'Government',
      source: 'myscheme.gov.in',
      url: s.url || `https://www.myscheme.gov.in/schemes/${s.slug || s.id}`,
    })),
  ];

  // Filter by search query if provided
  let combined = [...localSchemes, ...liveSchemes];
  if (query) {
    const q = query.toLowerCase();
    combined = combined.filter(s => 
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.ministry && s.ministry.toLowerCase().includes(q))
    );
  }

  return res.json({
    success: true,
    total: combined.length,
    localCount: localSchemes.length,
    liveCount: liveSchemes.length,
    schemes: combined,
  });
});

export default router;

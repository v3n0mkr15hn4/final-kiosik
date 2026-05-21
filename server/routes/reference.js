/**
 * Reference Data Routes — States, cities, wards, service categories
 * Serves the same data that was hardcoded in the frontend constants.js
 */

import { Router } from 'express';

const router = Router();

// ── Static reference data (mirrors frontend constants.js) ──

const states = [
  { id: 'MH', name: 'Maharashtra', nameHi: 'महाराष्ट्र', nameTa: 'மகாராஷ்டிரா' },
  { id: 'DL', name: 'Delhi', nameHi: 'दिल्ली', nameTa: 'டெல்லி' },
  { id: 'KA', name: 'Karnataka', nameHi: 'कर्नाटक', nameTa: 'கர்நாடகா' },
  { id: 'TN', name: 'Tamil Nadu', nameHi: 'तमिलनाडु', nameTa: 'தமிழ்நாடு' },
  { id: 'UP', name: 'Uttar Pradesh', nameHi: 'उत्तर प्रदेश', nameTa: 'உத்தரப் பிரதேசம்' },
  { id: 'GJ', name: 'Gujarat', nameHi: 'गुजरात', nameTa: 'குஜராத்' },
  { id: 'RJ', name: 'Rajasthan', nameHi: 'राजस्थान', nameTa: 'ராஜஸ்தான்' },
  { id: 'WB', name: 'West Bengal', nameHi: 'पश्चिम बंगाल', nameTa: 'மேற்கு வங்கம்' },
];

const cities = {
  MH: [
    { id: 'MUM', name: 'Mumbai', nameHi: 'मुंबई', nameTa: 'மும்பை' },
    { id: 'PUN', name: 'Pune', nameHi: 'पुणे', nameTa: 'புனே' },
    { id: 'NAG', name: 'Nagpur', nameHi: 'नागपुर', nameTa: 'நாக்பூர்' },
    { id: 'NAS', name: 'Nashik', nameHi: 'नासिक', nameTa: 'நாசிக்' },
  ],
  DL: [
    { id: 'NDL', name: 'New Delhi', nameHi: 'नई दिल्ली', nameTa: 'புது டெல்லி' },
    { id: 'SDL', name: 'South Delhi', nameHi: 'दक्षिण दिल्ली', nameTa: 'தெற்கு டெல்லி' },
    { id: 'EDL', name: 'East Delhi', nameHi: 'पूर्वी दिल्ली', nameTa: 'கிழக்கு டெல்லி' },
    { id: 'WDL', name: 'West Delhi', nameHi: 'पश्चिम दिल्ली', nameTa: 'மேற்கு டெல்லி' },
  ],
  KA: [
    { id: 'BLR', name: 'Bengaluru', nameHi: 'बेंगलुरु', nameTa: 'பெங்களூர்' },
    { id: 'MYS', name: 'Mysuru', nameHi: 'मैसूर', nameTa: 'மைசூர்' },
    { id: 'HUB', name: 'Hubli', nameHi: 'हुबली', nameTa: 'ஹூப்ளி' },
    { id: 'MNG', name: 'Mangaluru', nameHi: 'मंगलुरु', nameTa: 'மங்களூர்' },
  ],
  TN: [
    { id: 'CHN', name: 'Chennai', nameHi: 'चेन्नई', nameTa: 'சென்னை' },
    { id: 'CBE', name: 'Coimbatore', nameHi: 'कोयंबटूर', nameTa: 'கோயம்புத்தூர்' },
    { id: 'MDU', name: 'Madurai', nameHi: 'मदुरै', nameTa: 'மதுரை' },
    { id: 'TRI', name: 'Tiruchirappalli', nameHi: 'तिरुचिरापल्ली', nameTa: 'திருச்சிராப்பள்ளி' },
  ],
  UP: [
    { id: 'LKO', name: 'Lucknow', nameHi: 'लखनऊ', nameTa: 'லக்னோ' },
    { id: 'KAN', name: 'Kanpur', nameHi: 'कानपुर', nameTa: 'கான்பூர்' },
    { id: 'AGR', name: 'Agra', nameHi: 'आगरा', nameTa: 'ஆக்ரா' },
    { id: 'VNS', name: 'Varanasi', nameHi: 'वाराणसी', nameTa: 'வாரணாசி' },
  ],
  GJ: [
    { id: 'AMD', name: 'Ahmedabad', nameHi: 'अहमदाबाद', nameTa: 'அகமதாபாத்' },
    { id: 'SRT', name: 'Surat', nameHi: 'सूरत', nameTa: 'சூரத்' },
    { id: 'VAD', name: 'Vadodara', nameHi: 'वडोदरा', nameTa: 'வடோதரா' },
    { id: 'RJK', name: 'Rajkot', nameHi: 'राजकोट', nameTa: 'ராஜ்கோட்' },
  ],
  RJ: [
    { id: 'JAI', name: 'Jaipur', nameHi: 'जयपुर', nameTa: 'ஜெய்பூர்' },
    { id: 'JDH', name: 'Jodhpur', nameHi: 'जोधपुर', nameTa: 'ஜோத்பூர்' },
    { id: 'UDR', name: 'Udaipur', nameHi: 'उदयपुर', nameTa: 'உதய்பூர்' },
    { id: 'KOT', name: 'Kota', nameHi: 'कोटा', nameTa: 'கோட்டா' },
  ],
  WB: [
    { id: 'KOL', name: 'Kolkata', nameHi: 'कोलकाता', nameTa: 'கொல்கத்தா' },
    { id: 'HWH', name: 'Howrah', nameHi: 'हावड़ा', nameTa: 'ஹவுரா' },
    { id: 'DRG', name: 'Durgapur', nameHi: 'दुर्गापुर', nameTa: 'துர்காபூர்' },
    { id: 'SLG', name: 'Siliguri', nameHi: 'सिलीगुड़ी', nameTa: 'சிலிகுரி' },
  ],
};

const wards = {
  MUM: [
    { id: 'W1', name: 'Ward A - Colaba' },
    { id: 'W2', name: 'Ward B - Dongri' },
    { id: 'W3', name: 'Ward C - Marine Lines' },
    { id: 'W4', name: 'Ward D - Grant Road' },
    { id: 'W5', name: 'Ward E - Byculla' },
  ],
  PUN: [
    { id: 'W1', name: 'Aundh-Baner' },
    { id: 'W2', name: 'Shivajinagar' },
    { id: 'W3', name: 'Kothrud-Bavdhan' },
    { id: 'W4', name: 'Hadapsar' },
    { id: 'W5', name: 'Kondhwa' },
  ],
  BLR: [
    { id: 'W1', name: 'Koramangala' },
    { id: 'W2', name: 'Indiranagar' },
    { id: 'W3', name: 'Whitefield' },
    { id: 'W4', name: 'Jayanagar' },
    { id: 'W5', name: 'Malleshwaram' },
  ],
  CHN: [
    { id: 'W1', name: 'T. Nagar' },
    { id: 'W2', name: 'Anna Nagar' },
    { id: 'W3', name: 'Adyar' },
    { id: 'W4', name: 'Velachery' },
    { id: 'W5', name: 'Tambaram' },
  ],
  NDL: [
    { id: 'W1', name: 'Connaught Place' },
    { id: 'W2', name: 'Karol Bagh' },
    { id: 'W3', name: 'Chanakyapuri' },
    { id: 'W4', name: 'Lodhi Road' },
    { id: 'W5', name: 'Lajpat Nagar' },
  ],
  default: [
    { id: 'W1', name: 'Ward 1 - Central' },
    { id: 'W2', name: 'Ward 2 - North' },
    { id: 'W3', name: 'Ward 3 - South' },
    { id: 'W4', name: 'Ward 4 - East' },
    { id: 'W5', name: 'Ward 5 - West' },
  ],
};

const serviceCategories = {
  electricity: [
    { id: 'newConnection', key: 'electricity.newConnection' },
    { id: 'meterIssue', key: 'electricity.meterIssue' },
    { id: 'billingIssue', key: 'electricity.billingIssue' },
    { id: 'powerOutage', key: 'electricity.powerOutage' },
    { id: 'loadChange', key: 'electricity.loadChange' },
    { id: 'disconnection', key: 'electricity.disconnection' },
    { id: 'reconnection', key: 'electricity.reconnection' },
    { id: 'otherIssue', key: 'electricity.otherIssue' },
  ],
  gas: [
    { id: 'newConnection', key: 'gas.newConnection' },
    { id: 'cylinderRefill', key: 'gas.cylinderRefill' },
    { id: 'leakageComplaint', key: 'gas.leakageComplaint' },
    { id: 'billingIssue', key: 'gas.billingIssue' },
    { id: 'transferConnection', key: 'gas.transferConnection' },
    { id: 'surrenderConnection', key: 'gas.surrenderConnection' },
    { id: 'otherIssue', key: 'gas.otherIssue' },
  ],
  water: [
    { id: 'newConnection', key: 'water.newConnection' },
    { id: 'leakageRepair', key: 'water.leakageRepair' },
    { id: 'noWaterSupply', key: 'water.noWaterSupply' },
    { id: 'waterQuality', key: 'water.waterQuality' },
    { id: 'billingIssue', key: 'water.billingIssue' },
    { id: 'meterIssue', key: 'water.meterIssue' },
    { id: 'pipelineIssue', key: 'water.pipelineIssue' },
    { id: 'otherIssue', key: 'water.otherIssue' },
  ],
  sanitation: [
    { id: 'wastePickup', key: 'sanitation.wastePickup' },
    { id: 'missedCollection', key: 'sanitation.missedCollection' },
    { id: 'drainageCleaning', key: 'sanitation.drainageCleaning' },
    { id: 'streetCleaning', key: 'sanitation.streetCleaning' },
    { id: 'debrisRemoval', key: 'sanitation.debrisRemoval' },
    { id: 'binRequest', key: 'sanitation.binRequest' },
    { id: 'sewageIssue', key: 'sanitation.sewageIssue' },
    { id: 'otherIssue', key: 'sanitation.otherIssue' },
  ],
  municipal: [
    { id: 'propertyTax', key: 'municipal.propertyTax' },
    { id: 'birthCertificate', key: 'municipal.birthCertificate' },
    { id: 'deathCertificate', key: 'municipal.deathCertificate' },
    { id: 'buildingPermit', key: 'municipal.buildingPermit' },
    { id: 'tradeLicense', key: 'municipal.tradeLicense' },
    { id: 'shopLicense', key: 'municipal.shopLicense' },
    { id: 'advertisingPermit', key: 'municipal.advertisingPermit' },
    { id: 'parkBooking', key: 'municipal.parkBooking' },
    { id: 'otherIssue', key: 'municipal.otherIssue' },
  ],
  transport: [
    { id: 'metroTicket', key: 'transport.metroTicket', booking: true },
    { id: 'busTicket', key: 'transport.busTicket', booking: true },
    { id: 'busPass', key: 'transport.busPass', booking: true },
    { id: 'suburbanTrain', key: 'transport.suburbanTrain', booking: true },
    { id: 'parkingPermit', key: 'transport.parkingPermit' },
    { id: 'roadRepair', key: 'transport.roadRepair' },
    { id: 'trafficSignal', key: 'transport.trafficSignal' },
    { id: 'streetLight', key: 'transport.streetLight' },
    { id: 'footpathRepair', key: 'transport.footpathRepair' },
    { id: 'publicTransport', key: 'transport.publicTransport' },
    { id: 'otherIssue', key: 'transport.otherIssue' },
  ],
  healthcare: [
    { id: 'hospitalAppointment', key: 'healthcare.hospitalAppointment' },
    { id: 'ambulance', key: 'healthcare.ambulance' },
    { id: 'vaccination', key: 'healthcare.vaccination' },
    { id: 'healthCamp', key: 'healthcare.healthCamp' },
    { id: 'bloodBank', key: 'healthcare.bloodBank' },
    { id: 'sanitationInspection', key: 'healthcare.sanitationInspection' },
    { id: 'mosquitoControl', key: 'healthcare.mosquitoControl' },
    { id: 'otherIssue', key: 'healthcare.otherIssue' },
  ],
};

const complaintTypes = [
  { id: 'roadDamage', key: 'complaints.roadDamage' },
  { id: 'streetLight', key: 'complaints.streetLight' },
  { id: 'waterLogging', key: 'complaints.waterLogging' },
  { id: 'encroachment', key: 'complaints.encroachment' },
  { id: 'pollution', key: 'complaints.pollution' },
  { id: 'publicSafety', key: 'complaints.publicSafety' },
  { id: 'other', key: 'complaints.other' },
];

// GET /api/reference/states
router.get('/states', (req, res) => {
  res.json({ success: true, data: states });
});

// GET /api/reference/cities?state=TN
router.get('/cities', (req, res) => {
  const { state } = req.query;
  if (state && cities[state]) {
    return res.json({ success: true, data: cities[state] });
  }
  return res.json({ success: true, data: cities });
});

// GET /api/reference/wards?city=CHN
router.get('/wards', (req, res) => {
  const { city } = req.query;
  if (city && wards[city]) {
    return res.json({ success: true, data: wards[city] });
  }
  if (city) {
    return res.json({ success: true, data: wards.default });
  }
  return res.json({ success: true, data: wards });
});

// GET /api/reference/service-categories?type=electricity
router.get('/service-categories', (req, res) => {
  const { type } = req.query;
  if (type && serviceCategories[type]) {
    return res.json({ success: true, data: serviceCategories[type] });
  }
  return res.json({ success: true, data: serviceCategories });
});

// GET /api/reference/complaint-types
router.get('/complaint-types', (req, res) => {
  res.json({ success: true, data: complaintTypes });
});

export default router;

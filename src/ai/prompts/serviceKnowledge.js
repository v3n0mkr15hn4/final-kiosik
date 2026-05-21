/**
 * serviceKnowledge.js — Government Service Knowledge Base
 *
 * Structured knowledge about every government service available on SUVIDHA.
 * This is injected into the AI context to help it answer service-specific
 * questions accurately without hallucinating.
 */

export const SERVICE_KNOWLEDGE = {
  electricity: {
    department: 'APDCL – Assam Power Distribution Company Limited',
    services: [
      {
        id: 'new_connection',
        name: 'New Electricity Connection',
        path: '/electricity',
        documents: ['Aadhaar card', 'Proof of address', 'Ownership proof / NOC', 'Passport photo'],
        fee: '₹500–₹2000 (depending on load)',
        timeframe: '15–30 working days',
        description: 'Apply for a new domestic or commercial electricity connection.',
      },
      {
        id: 'meter_replacement',
        name: 'Meter Replacement',
        path: '/electricity/complaint',
        documents: ['Consumer number', 'Aadhaar card'],
        fee: 'Free for faulty meters',
        timeframe: '7–14 working days',
        description: 'Report a faulty or damaged electricity meter.',
      },
      {
        id: 'load_extension',
        name: 'Load Extension',
        path: '/electricity',
        documents: ['Consumer number', 'Aadhaar', 'Application form'],
        fee: '₹200 per kW extension',
        timeframe: '15 working days',
        description: 'Increase sanctioned load for your connection.',
      },
      {
        id: 'billing_complaint',
        name: 'Billing Complaint',
        path: '/electricity/complaint',
        documents: ['Consumer number', 'Bill copy'],
        fee: 'Free',
        timeframe: '7 working days',
        description: 'Dispute incorrect electricity bills.',
      },
    ],
    helpline: '1912',
    website: 'apdcl.org',
  },

  gas: {
    department: 'Assam Gas Company Limited (AGCL)',
    services: [
      {
        id: 'new_gas_connection',
        name: 'New LPG Connection',
        path: '/gas',
        documents: ['Aadhaar card', 'Address proof', 'Passport photo', 'Bank account details'],
        fee: 'Security deposit ₹1450 (14.2 kg cylinder)',
        timeframe: '30 working days',
        description: 'Apply for a new domestic LPG gas connection.',
      },
      {
        id: 'cylinder_booking',
        name: 'Cylinder Booking',
        path: '/gas/bills',
        documents: ['Consumer ID'],
        fee: 'Market rate',
        timeframe: '2–5 days delivery',
        description: 'Book your next LPG cylinder refill.',
      },
      {
        id: 'meter_repair',
        name: 'Gas Meter Repair',
        path: '/gas/complaint',
        documents: ['Consumer ID', 'Aadhaar'],
        fee: 'Free',
        timeframe: '5–10 working days',
        description: 'Report gas meter damage or leakage.',
      },
    ],
    helpline: '1906',
    website: 'agcl.co.in',
  },

  water: {
    department: 'PHE (Public Health Engineering) Department, Assam',
    services: [
      {
        id: 'new_water_connection',
        name: 'New Water Connection',
        path: '/water',
        documents: ['Aadhaar', 'Address proof', 'No-dues certificate', 'Site plan'],
        fee: '₹300–₹1000 (based on pipe size)',
        timeframe: '30 working days',
        description: 'Apply for piped water supply connection.',
      },
      {
        id: 'supply_complaint',
        name: 'Water Supply Complaint',
        path: '/water',
        documents: ['Consumer ID'],
        fee: 'Free',
        timeframe: '3–7 working days',
        description: 'Report water supply disruption or low pressure.',
      },
    ],
    helpline: '1800-345-3678',
    scheme: 'Jal Jeevan Mission — Har Ghar Nal Se Jal',
  },

  municipal: {
    department: 'Urban Local Bodies (ULB) / Municipal Corporation',
    services: [
      {
        id: 'property_tax',
        name: 'Property Tax Payment',
        path: '/municipal/property-tax',
        documents: ['Property ID', 'Previous receipt', 'Aadhaar'],
        fee: 'As assessed',
        timeframe: 'Instant online',
        description: 'Pay municipal property tax online.',
      },
      {
        id: 'birth_certificate',
        name: 'Birth Certificate',
        path: '/municipal',
        documents: ['Hospital discharge summary', 'Parents\' Aadhaar', 'Marriage certificate'],
        fee: '₹50',
        timeframe: '7 working days',
        description: 'Apply for birth certificate for newborn.',
      },
      {
        id: 'death_certificate',
        name: 'Death Certificate',
        path: '/municipal',
        documents: ['Hospital death summary', 'Deceased\'s Aadhaar', 'Relative\'s Aadhaar'],
        fee: '₹50',
        timeframe: '7 working days',
        description: 'Apply for death certificate.',
      },
      {
        id: 'grievance',
        name: 'Civic Grievance',
        path: '/municipal/grievance',
        documents: ['Photo of issue (optional)'],
        fee: 'Free',
        timeframe: '15 working days',
        description: 'Report potholes, garbage, streetlight, drain, or other civic issues.',
      },
    ],
    helpline: '1533',
  },

  transport: {
    department: 'ASTC / State Transport Department',
    services: [
      {
        id: 'driving_license',
        name: 'Driving License',
        path: '/transport',
        documents: ['Aadhaar', 'Address proof', 'Age proof', 'Medical fitness', 'Passport photo'],
        fee: 'LL: ₹200, DL: ₹500',
        timeframe: '30 working days after test',
        description: 'Apply for new driving license or renewal.',
      },
      {
        id: 'vehicle_registration',
        name: 'Vehicle Registration',
        path: '/transport',
        documents: ['Invoice', 'Insurance', 'PUC certificate', 'Aadhaar', 'Address proof'],
        fee: 'As per vehicle category',
        timeframe: '7 working days',
        description: 'Register a new vehicle.',
      },
      {
        id: 'bus_pass',
        name: 'Bus Pass',
        path: '/transport',
        documents: ['Aadhaar', 'Passport photo', 'Category proof (student/senior)'],
        fee: '₹150–₹500 (category dependent)',
        timeframe: '3–5 working days',
        description: 'Apply for ASTC bus pass.',
      },
    ],
    helpline: '0361-2234000',
  },

  healthcare: {
    department: 'NHM Assam / State Health Department',
    services: [
      {
        id: 'ayushman_bharat',
        name: 'Ayushman Bharat (PMJAY)',
        path: '/healthcare',
        documents: ['Aadhaar', 'Ration card', 'Income certificate'],
        fee: 'Free (up to ₹5 lakh coverage)',
        timeframe: 'Card issued in 3–5 days',
        description: 'Health insurance scheme for BPL families — covers hospitalisation.',
      },
      {
        id: 'hospital_appointment',
        name: 'Hospital Appointment',
        path: '/healthcare',
        documents: ['Aadhaar'],
        fee: 'Free at government hospitals',
        timeframe: 'Appointment in 1–3 days',
        description: 'Book outpatient appointment at government hospital.',
      },
      {
        id: 'vaccination',
        name: 'Vaccination',
        path: '/healthcare',
        documents: ['Aadhaar', 'Previous vaccination record'],
        fee: 'Free for universal immunisation',
        timeframe: 'Walk-in or appointment',
        description: 'Register for COVID, flu, and routine immunisation.',
      },
    ],
    helpline: '104',
    ambulance: '108',
  },

  schemes: {
    department: 'Various — District Collectorate / Block Office',
    list: [
      {
        id: 'pm_kisan',
        name: 'PM-KISAN',
        eligibility: 'Small and marginal farmers with less than 2 hectares land',
        benefit: '₹6000/year in 3 instalments',
        documents: ['Aadhaar', 'Land records', 'Bank account'],
        path: '/schemes',
      },
      {
        id: 'pm_awas',
        name: 'PM Awas Yojana (Gramin)',
        eligibility: 'BPL families without pucca house',
        benefit: 'Up to ₹1.2 lakh for house construction',
        documents: ['Aadhaar', 'BPL card', 'Land ownership proof'],
        path: '/schemes',
      },
      {
        id: 'mgnrega',
        name: 'MGNREGA',
        eligibility: 'Any adult rural household member',
        benefit: '100 days guaranteed employment per year',
        documents: ['Aadhaar', 'Job card (issued by Gram Panchayat)'],
        path: '/schemes',
      },
      {
        id: 'orunodoi',
        name: 'Orunodoi Scheme (Assam)',
        eligibility: 'Economically weak families in Assam',
        benefit: '₹1250/month in beneficiary\'s bank account',
        documents: ['Aadhaar', 'BPL card', 'Bank account'],
        path: '/schemes',
      },
      {
        id: 'scholarship',
        name: 'Pre/Post Matric Scholarship (SC/ST/OBC)',
        eligibility: 'SC/ST/OBC students with family income below ₹2.5 lakh',
        benefit: '₹1000–₹10,000/year',
        documents: ['Aadhaar', 'Caste certificate', 'Income certificate', 'School enrollment'],
        path: '/schemes',
      },
      {
        id: 'widow_pension',
        name: 'National Widow Pension Scheme',
        eligibility: 'Widow women aged 40–79, BPL',
        benefit: '₹300/month',
        documents: ['Aadhaar', 'Death certificate of spouse', 'BPL card'],
        path: '/schemes',
      },
      {
        id: 'old_age_pension',
        name: 'National Old Age Pension (NOAP)',
        eligibility: 'Senior citizens 60+ from BPL families',
        benefit: '₹200–₹500/month',
        documents: ['Aadhaar', 'Age proof', 'BPL card'],
        path: '/schemes',
      },
    ],
    path: '/schemes',
    helpline: '14555',
  },

  revenue: {
    department: 'Revenue & Disaster Management, Assam',
    services: [
      {
        id: 'income_certificate',
        name: 'Income Certificate',
        path: '/schemes',
        documents: ['Aadhaar', 'Salary slip or self-declaration', 'Address proof'],
        fee: '₹30',
        timeframe: '10 working days',
        description: 'Certificate of annual family income issued by Revenue Circle.',
      },
      {
        id: 'caste_certificate',
        name: 'Caste / Community Certificate (SC/ST/OBC)',
        path: '/schemes',
        documents: ['Aadhaar', 'Parent\'s caste certificate', 'Birth certificate'],
        fee: '₹30',
        timeframe: '10–15 working days',
        description: 'Official certificate of SC/ST/OBC status for government benefits.',
      },
      {
        id: 'land_records',
        name: 'Land Records (Jamabandi)',
        path: '/schemes',
        documents: ['Aadhaar', 'Land plot number (Dag number)', 'Patta number'],
        fee: '₹20',
        timeframe: 'Available online instantly',
        description: 'Copy of land ownership records from Revenue Department.',
      },
    ],
    helpline: '1800-345-3611',
  },

  aadhaar: {
    department: 'UIDAI – Unique Identification Authority of India',
    services: [
      {
        id: 'aadhaar_enrollment',
        name: 'New Aadhaar Enrollment',
        path: '/office-locator',
        documents: ['POI: PAN/Passport/DL/Voter ID', 'POA: Utility bill/Bank statement/Ration card'],
        fee: 'Free',
        timeframe: '90 days for Aadhaar generation',
        description: 'First-time Aadhaar registration at authorised center.',
      },
      {
        id: 'aadhaar_update',
        name: 'Aadhaar Update (Address/Mobile)',
        path: '/office-locator',
        documents: ['Existing Aadhaar', 'New address proof'],
        fee: '₹50 at Aadhaar center',
        timeframe: '30 days',
        description: 'Update address, mobile number, or other details in Aadhaar.',
      },
    ],
    helpline: '1947',
    website: 'uidai.gov.in',
  },
};

/**
 * Get service info by category and service ID.
 */
export function getServiceInfo(category, serviceId) {
  const cat = SERVICE_KNOWLEDGE[category];
  if (!cat) return null;
  if (!serviceId) return cat;
  const services = cat.services || cat.list || [];
  return services.find(s => s.id === serviceId) || null;
}

/**
 * Build a concise knowledge summary to inject into the AI context.
 * Keeps token count low while giving the AI accurate data.
 */
export function buildKnowledgeSummary(categories = null) {
  const cats = categories || Object.keys(SERVICE_KNOWLEDGE);
  return cats
    .filter(c => SERVICE_KNOWLEDGE[c])
    .map(c => {
      const cat = SERVICE_KNOWLEDGE[c];
      const services = cat.services || cat.list || [];
      const names = services.map(s => s.name).join(', ');
      return `${c.toUpperCase()} (${cat.department}): ${names}. Helpline: ${cat.helpline || 'N/A'}`;
    })
    .join('\n');
}

export default SERVICE_KNOWLEDGE;

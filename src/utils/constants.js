// Mock data for states, cities, and wards
export const states = [
  { id: 'MH', name: 'Maharashtra', nameHi: 'महाराष्ट्र', nameTa: 'மகாராஷ்டிரா', nameAs: 'মহাৰাষ্ট্ৰ' },
  { id: 'DL', name: 'Delhi', nameHi: 'दिल्ली', nameTa: 'டெல்லி', nameAs: 'দিল্লী' },
  { id: 'KA', name: 'Karnataka', nameHi: 'कर्नाटक', nameTa: 'கர்நாடகா', nameAs: 'কৰ্ণাটক' },
  { id: 'TN', name: 'Tamil Nadu', nameHi: 'तमिलनाडु', nameTa: 'தமிழ்நாடு', nameAs: 'তামিলনাডু' },
  { id: 'UP', name: 'Uttar Pradesh', nameHi: 'उत्तर प्रदेश', nameTa: 'உத்தரப் பிரதேசம்', nameAs: 'উত্তৰ প্ৰদেশ' },
  { id: 'GJ', name: 'Gujarat', nameHi: 'गुजरात', nameTa: 'குஜராத்', nameAs: 'গুজৰাট' },
  { id: 'RJ', name: 'Rajasthan', nameHi: 'राजस्थान', nameTa: 'ராஜஸ்தான்', nameAs: 'ৰাজস্থান' },
  { id: 'WB', name: 'West Bengal', nameHi: 'पश्चिम बंगाल', nameTa: 'மேற்கு வங்கம்', nameAs: 'পশ্চিম বংগ' },
  { id: 'AS', name: 'Assam', nameHi: 'असम', nameTa: 'அசாம்', nameAs: 'অসম' },
];

export const cities = {
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
  AS: [
    { id: 'GHY', name: 'Guwahati', nameHi: 'गुवाहाटी', nameTa: 'குவஹாட்டி', nameAs: 'গুৱাহাটী' },
    { id: 'JRH', name: 'Jorhat', nameHi: 'जोरहाट', nameTa: 'ஜோர்ஹாட்', nameAs: 'যোৰহাট' },
    { id: 'DIB', name: 'Dibrugarh', nameHi: 'डिब्रूगढ़', nameTa: 'டிப்ருகர்', nameAs: 'ডিব্ৰুগড়' },
    { id: 'SIL', name: 'Silchar', nameHi: 'सिलचर', nameTa: 'சில்சார்', nameAs: 'শিলচৰ' },
  ],
};

export const wards = {
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
  // Default wards for cities not explicitly defined
  default: [
    { id: 'W1', name: 'Ward 1 - Central' },
    { id: 'W2', name: 'Ward 2 - North' },
    { id: 'W3', name: 'Ward 3 - South' },
    { id: 'W4', name: 'Ward 4 - East' },
    { id: 'W5', name: 'Ward 5 - West' },
  ],
};

// Service categories
export const serviceCategories = {
  electricity: [
    { id: 'newConnection', key: 'electricity.newConnection' },
    { id: 'meterIssue', key: 'electricity.meterIssue' },
    { id: 'meterShifting', key: 'electricity.meterShifting' },
    { id: 'billingIssue', key: 'electricity.billingIssue' },
    { id: 'powerOutage', key: 'electricity.powerOutage' },
    { id: 'loadChange', key: 'electricity.loadChange' },
    { id: 'disconnection', key: 'electricity.disconnection' },
    { id: 'reconnection', key: 'electricity.reconnection' },
    { id: 'otherIssue', key: 'electricity.otherIssue' },
  ],
  gas: [
    { id: 'newConnection', key: 'gas.newConnection' },
    { id: 'meterDamage', key: 'gas.meterDamage' },
    { id: 'meterInstall', key: 'gas.meterInstall' },
    { id: 'reconnect', key: 'gas.reconnect' },
    { id: 'disconnect', key: 'gas.disconnect' },
    { id: 'prepaidConversion', key: 'gas.prepaidConversion' },
    { id: 'pipelineInspection', key: 'gas.pipelineInspection' },
    { id: 'maintenance', key: 'gas.maintenance' },
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
    { id: 'waterConnection', key: 'municipal.waterConnection' },
    { id: 'waterUpgrade', key: 'municipal.waterUpgrade' },
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

// Complaint types
export const complaintTypes = [
  { id: 'roadDamage', key: 'complaints.roadDamage' },
  { id: 'streetLight', key: 'complaints.streetLight' },
  { id: 'waterLogging', key: 'complaints.waterLogging' },
  { id: 'encroachment', key: 'complaints.encroachment' },
  { id: 'pollution', key: 'complaints.pollution' },
  { id: 'publicSafety', key: 'complaints.publicSafety' },
  { id: 'other', key: 'complaints.other' },
];

// Status definitions — includes all PDF-required lifecycle states
export const statusConfig = {
  submitted: { color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  inProgress: { color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  resolved: { color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  escalated: { color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  closed: { color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  rejected: { color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
};

// Mock tracking data — with SLA, assignedOfficer, and department per SRS
export const mockTrackingData = {
  'SVD-TEST-001': {
    requestId: 'SVD-TEST-001',
    ticketId: 'TKT-2026-001',
    citizenName: 'Ramesh Kumar',
    mobile: '9876543210',
    serviceCategory: 'Electricity - New Connection',
    status: 'inProgress',
    sla: '15 working days',
    department: 'Electricity Supply Division',
    assignedOfficer: {
      name: 'Shri Anil Sharma',
      designation: 'Junior Engineer, APDCL',
      contact: 'anil.sharma@apdcl.gov.in',
    },
    submittedAt: '2026-01-15T10:30:00Z',
    lastUpdated: '2026-01-17T14:45:00Z',
    timeline: [
      { status: 'submitted', timestamp: '2026-01-15T10:30:00Z', description: 'Request submitted successfully via SUVIDHA kiosk' },
      { status: 'inProgress', timestamp: '2026-01-16T09:00:00Z', description: 'Assigned to Jr. Engineer Anil Sharma, APDCL Guwahati Division' },
    ],
  },
  'SVD-TEST-002': {
    requestId: 'SVD-TEST-002',
    ticketId: 'TKT-2026-002',
    citizenName: 'Lakshmi Devi',
    mobile: '9876543210',
    serviceCategory: 'Municipal - Water Leakage Repair',
    status: 'resolved',
    sla: '7 working days',
    department: 'Municipal Water Supply',
    assignedOfficer: {
      name: 'Shri Bhaskar Roy',
      designation: 'Assistant Engineer, GMC',
      contact: 'bhaskar.roy@gmc.gov.in',
    },
    submittedAt: '2026-01-10T08:15:00Z',
    lastUpdated: '2026-01-14T16:20:00Z',
    timeline: [
      { status: 'submitted', timestamp: '2026-01-10T08:15:00Z', description: 'Grievance registered at SUVIDHA kiosk, Ward 5' },
      { status: 'inProgress', timestamp: '2026-01-11T10:00:00Z', description: 'Plumber team dispatched by Asst. Engineer Bhaskar Roy' },
      { status: 'resolved', timestamp: '2026-01-14T16:20:00Z', description: 'Leakage repaired successfully. Citizen notified via SMS.' },
    ],
  },
  'SVD-TEST-003': {
    requestId: 'SVD-TEST-003',
    ticketId: 'TKT-2026-003',
    citizenName: 'Mohammed Irfan',
    mobile: '9123456789',
    serviceCategory: 'Municipal - Sewage Overflow',
    status: 'escalated',
    sla: '3 working days (SLA Breached)',
    department: 'Municipal Sanitation Wing',
    assignedOfficer: {
      name: 'Smt. Priya Das',
      designation: 'Executive Engineer, GMC Sanitation',
      contact: 'priya.das@gmc.gov.in',
    },
    submittedAt: '2026-01-05T07:00:00Z',
    lastUpdated: '2026-01-12T11:30:00Z',
    timeline: [
      { status: 'submitted', timestamp: '2026-01-05T07:00:00Z', description: 'Urgent sewage overflow reported via SUVIDHA kiosk' },
      { status: 'inProgress', timestamp: '2026-01-06T08:30:00Z', description: 'Sanitation team dispatched to Ward 12' },
      { status: 'escalated', timestamp: '2026-01-09T10:00:00Z', description: 'SLA breached (3 days). Auto-escalated to Executive Engineer Priya Das' },
    ],
  },
};

mockTrackingData['TKT-2026-001'] = mockTrackingData['SVD-TEST-001'];
mockTrackingData['TKT-2026-002'] = mockTrackingData['SVD-TEST-002'];
mockTrackingData['TKT-2026-003'] = mockTrackingData['SVD-TEST-003'];

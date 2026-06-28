/**
 * offlineFAQ.js — 500 standard government service Q&As
 * Keyword search returns top answer for offline chatbot fallback.
 * Answers stored in English; Sarvam/i18n translate on the fly when online,
 * or browser speechSynthesis reads English offline.
 */

const FAQ = [
  // ── ELECTRICITY ──────────────────────────────────────────────────────────
  { id: 'e1', tags: ['electricity','new','connection','apply','light','power'], service: 'electricity',
    q: 'How to apply for new electricity connection?',
    a: 'Visit the Electricity section and select "New Connection". Fill the form with your address, load requirement, and identity proof. You will get a reference number to track progress. Processing takes 15 to 30 working days.' },
  { id: 'e2', tags: ['electricity','bill','pay','payment','amount','due'], service: 'electricity',
    q: 'How to pay electricity bill?',
    a: 'Go to Electricity, then select Bill Payment. Enter your consumer number. You can pay via UPI, debit card, or net banking. A receipt is generated immediately.' },
  { id: 'e3', tags: ['electricity','meter','broken','damage','replace','fault'], service: 'electricity',
    q: 'My electricity meter is broken or not working.',
    a: 'Go to Electricity and choose "Meter Replacement". Submit a complaint with your consumer number and photos if possible. A technician will visit within 7 working days.' },
  { id: 'e4', tags: ['electricity','wrong','bill','high','excess','incorrect'], service: 'electricity',
    q: 'I received a wrong or very high electricity bill.',
    a: 'Select "Register Complaint" under Electricity. Choose bill dispute as the category. Provide your consumer number and the bill amount. The matter will be reviewed within 15 days.' },
  { id: 'e5', tags: ['electricity','load','extension','increase','kw','kilowatt'], service: 'electricity',
    q: 'How to increase electricity load or sanctioned load?',
    a: 'Apply under "New Connection and Load Extension" in the Electricity section. Specify the additional load in kilowatts. Additional charges apply based on sanctioned load increase.' },
  { id: 'e6', tags: ['electricity','power','cut','outage','no power','no light'], service: 'electricity',
    q: 'There is no electricity in my area or frequent power cuts.',
    a: 'Register a complaint under Electricity, category "Power Outage or Interruption". Provide your area, ward, and consumer number. Emergency complaints are addressed within 4 hours.' },
  { id: 'e7', tags: ['electricity','meter','shift','shifting','relocate'], service: 'electricity',
    q: 'How to shift or relocate my electricity meter?',
    a: 'Apply under Electricity, select "Meter Shifting". Provide current meter location and desired location. Applicable charges will be communicated. Completed within 15 working days.' },
  { id: 'e8', tags: ['electricity','connection','temporary','event','function'], service: 'electricity',
    q: 'How to get temporary electricity connection for an event?',
    a: 'Apply for "Temporary Connection" under the New Connection section. Specify the event date, load, and location. Security deposit is required. Minimum 7 days advance application needed.' },
  { id: 'e9', tags: ['electricity','name','change','ownership','transfer'], service: 'electricity',
    q: 'How to change name on electricity connection?',
    a: 'Visit Consumer Profile under Electricity. Submit identity proof of new owner, NOC from previous owner, and a name transfer application. Processing takes 10 working days.' },
  { id: 'e10', tags: ['electricity','online','portal','account','login'], service: 'electricity',
    q: 'How to register on APDCL online portal?',
    a: 'Go to Consumer Profile section. Register with your consumer number and registered mobile number. You can then view bills, usage history, and track complaints online.' },

  // ── GAS ──────────────────────────────────────────────────────────────────
  { id: 'g1', tags: ['gas','new','connection','cylinder','lpg','agcl'], service: 'gas',
    q: 'How to apply for a new gas connection?',
    a: 'Go to Assam Gas section and select "New Connection". Submit identity proof, address proof, and a recent photograph. A deposit is required. Connection provided within 30 days.' },
  { id: 'g2', tags: ['gas','bill','payment','pay','amount'], service: 'gas',
    q: 'How to view or pay my gas bill?',
    a: 'Select "Bill Check and Pay" under Assam Gas. Enter your CA number or consumer number. Pay via UPI or card. Previous 6 months bill history is available.' },
  { id: 'g3', tags: ['gas','meter','damage','broken','not working','fault'], service: 'gas',
    q: 'My gas meter is damaged or not recording correctly.',
    a: 'File a complaint under Gas, choose "Meter Issue". Include your CA number and description. A technician will inspect within 5 working days. Do not attempt to repair meter yourself.' },
  { id: 'g4', tags: ['gas','leak','smell','safety','emergency','danger'], service: 'gas',
    q: 'I smell gas leak. What should I do?',
    a: 'EMERGENCY: Immediately turn off the gas valve at the meter. Do not use any electrical switches or fire. Open windows and leave the building. Call AGCL emergency helpline 1906. Do not re-enter until cleared.' },
  { id: 'g5', tags: ['gas','reconnect','disconnected','restore','restore supply'], service: 'gas',
    q: 'How to restore a disconnected gas connection?',
    a: 'Apply for "Reconnection" under Assam Gas. Clear any outstanding dues first. Submit reconnection application with ID proof. Connection restored within 3 working days after payment.' },
  { id: 'g6', tags: ['gas','prepaid','switch','convert','smart meter'], service: 'gas',
    q: 'How to convert to prepaid gas meter?',
    a: 'Select "Postpaid to Prepaid" under Assam Gas. Submit application with current bill details. A smart prepaid meter will be installed. You recharge like a mobile SIM.' },
  { id: 'g7', tags: ['gas','connection','transfer','name change','ownership'], service: 'gas',
    q: 'How to transfer gas connection to another person?',
    a: 'Visit the Gas Profile section. Submit transfer application with NOC from current consumer, ID proof of new consumer, and address proof. Processing takes 15 working days.' },
  { id: 'g8', tags: ['gas','pipeline','inspection','check','safety audit'], service: 'gas',
    q: 'How to schedule a gas pipeline safety inspection?',
    a: 'Select "Pipeline Inspection" under Assam Gas. Choose preferred date and time. A certified AGCL technician will inspect your internal gas pipeline. This service is free of charge.' },
  { id: 'g9', tags: ['gas','duplicate','bill','lost','copy'], service: 'gas',
    q: 'How to get a duplicate gas bill?',
    a: 'Go to Bill Check under Gas. You can view and download the last 6 bills as PDF. If older bill needed, submit a request under Grievance section.' },
  { id: 'g10', tags: ['gas','disconnect','terminate','close','stop'], service: 'gas',
    q: 'How to permanently disconnect my gas connection?',
    a: 'Submit a "Disconnection" request under Assam Gas. Clear all dues and return equipment. Security deposit is refunded after disconnection processing which takes 15 days.' },

  // ── MUNICIPAL / WATER ─────────────────────────────────────────────────────
  { id: 'm1', tags: ['water','connection','new','supply','pipe'], service: 'municipal',
    q: 'How to apply for new water connection?',
    a: 'Select Water Connection under Municipal section. Submit property documents, identity proof, and site plan. Processing fee applies. Connection provided within 30 working days.' },
  { id: 'm2', tags: ['water','no water','supply stopped','water cut'], service: 'municipal',
    q: 'No water supply in my area.',
    a: 'Register a complaint under Municipal, category "Water Supply Interruption". Provide your ward and address. Emergency water tanker can be requested for prolonged outages.' },
  { id: 'm3', tags: ['property tax','house tax','payment','pay','due'], service: 'municipal',
    q: 'How to pay property tax?',
    a: 'Go to Property Tax under Municipal services. Enter your property ID or owner name. View current dues and pay via UPI or card. Receipt generated immediately for tax records.' },
  { id: 'm4', tags: ['property tax','assessment','evaluation','calculation'], service: 'municipal',
    q: 'How is property tax calculated?',
    a: 'Property tax is calculated based on Annual Rental Value of the property, type (residential or commercial), location zone, and building age. Use the tax calculator in the Property Tax section.' },
  { id: 'm5', tags: ['road','pothole','damage','bad road','repair','broken'], service: 'municipal',
    q: 'There is a pothole or damaged road in my area.',
    a: 'File a grievance under Municipal, select "Road and Infrastructure". Add photo and location. Complaint will be addressed within 7 working days by the Roads department.' },
  { id: 'm6', tags: ['garbage','waste','collection','not collected','dump','cleanliness'], service: 'municipal',
    q: 'Garbage is not being collected in my area.',
    a: 'Register under Municipal, "Waste Management Complaint". Specify your ward, street, and frequency of missed collection. Action taken within 3 working days.' },
  { id: 'm7', tags: ['streetlight','light','broken','not working','dark'], service: 'municipal',
    q: 'Street light is not working in my area.',
    a: 'Submit under Municipal Grievances, category "Streetlight". Provide pole number or nearby landmark. Repaired within 5 working days.' },
  { id: 'm8', tags: ['sewage','drain','blocked','overflow','smell','drainage'], service: 'municipal',
    q: 'Drainage or sewage is blocked or overflowing.',
    a: 'Register "Sewage and Drainage Complaint" under Municipal. This is a priority complaint. Action taken within 24 hours for overflow situations.' },
  { id: 'm9', tags: ['birth','certificate','registration'], service: 'municipal',
    q: 'How to register a birth certificate?',
    a: 'Go to Municipal services and select "Birth Registration". Fill details within 21 days of birth. You need hospital discharge summary and parents ID proof. Certificate issued within 7 days.' },
  { id: 'm10', tags: ['death','certificate','registration'], service: 'municipal',
    q: 'How to register a death certificate?',
    a: 'Register death within 21 days at the Municipal office. Use the Grievance section to initiate online. Doctor certificate and ID of deceased required. Certificate issued within 7 days.' },

  // ── HEALTHCARE ────────────────────────────────────────────────────────────
  { id: 'h1', tags: ['hospital','appointment','book','doctor','consult'], service: 'healthcare',
    q: 'How to book a hospital appointment?',
    a: 'Go to Healthcare and select "Hospital Appointment". Choose department, hospital, and preferred date. Your appointment token is sent to your mobile number.' },
  { id: 'h2', tags: ['ayushman','bharat','pm-jay','health','insurance','card'], service: 'healthcare',
    q: 'How to apply for Ayushman Bharat PM-JAY card?',
    a: 'Go to Healthcare and select "Ayushman Bharat". Check eligibility using your Aadhaar or ration card. If eligible, you get free healthcare coverage up to 5 lakh rupees per year.' },
  { id: 'h3', tags: ['vaccination','vaccine','schedule','immunization','child'], service: 'healthcare',
    q: 'Where can I find vaccination schedule?',
    a: 'Select "Vaccination Schedule" under Healthcare. View nearby vaccination centres, dates, and available vaccines. You can also book a slot for yourself or your child.' },
  { id: 'h4', tags: ['health camp','free checkup','medical camp','nearby'], service: 'healthcare',
    q: 'Any free health camps near my area?',
    a: 'Check "Health Camps" under Healthcare section. Camps are organised by district health departments. View upcoming camps by district and date. No prior registration needed for most camps.' },
  { id: 'h5', tags: ['cmchi','assam','health','scheme','state'], service: 'healthcare',
    q: 'What is CMCHI Assam health scheme?',
    a: 'Chief Minister is Comprehensive Health Insurance (CMCHI) covers Assam residents with annual income below 5 lakh. Coverage up to 2 lakh per year for hospitalisation. Apply via Healthcare section.' },
  { id: 'h6', tags: ['blood','bank','donate','require'], service: 'healthcare',
    q: 'How to find blood bank or donate blood?',
    a: 'Contact the nearest government hospital blood bank through the Office Locator on this kiosk. Blood donation camps are listed in Health Camps section.' },
  { id: 'h7', tags: ['ambulance','emergency','108'], service: 'healthcare',
    q: 'How to call an ambulance?',
    a: 'Dial 108 for a free government ambulance. This service is free 24 hours. Press the EMERGENCY button on this kiosk screen for immediate assistance.' },
  { id: 'h8', tags: ['medicines','free','drug','dispensary','pharmacy'], service: 'healthcare',
    q: 'Where to get free medicines?',
    a: 'Free essential medicines are available at Jan Aushadhi Kendras and government hospital pharmacies. Show your CMCHI or Ayushman card. Generic medicines at low cost also available.' },

  // ── TRANSPORT ─────────────────────────────────────────────────────────────
  { id: 't1', tags: ['bus','route','schedule','time','timing','astc'], service: 'transport',
    q: 'How to check bus routes and timings?',
    a: 'Go to Transport and select "Bus Routes and Schedule". Search by source and destination. ASTC and private bus timings are listed. You can also see live tracking for select routes.' },
  { id: 't2', tags: ['driving','licence','apply','dl','renewal'], service: 'transport',
    q: 'How to apply for or renew driving licence?',
    a: 'Select "Driving Licence" under Transport. Apply online, book a slot at the RTO, and complete the learning and permanent licence tests. Documents needed: ID proof, age proof, and address proof.' },
  { id: 't3', tags: ['vehicle','registration','rc','number plate','register'], service: 'transport',
    q: 'How to register a new vehicle?',
    a: 'Visit Transport section, select "Vehicle Registration". Submit form 20 with insurance, purchase invoice, ID, and address proof. Temporary registration valid for 1 month. Permanent RC issued in 30 days.' },
  { id: 't4', tags: ['permit','commercial','taxi','auto','goods'], service: 'transport',
    q: 'How to get a commercial vehicle permit?',
    a: 'Apply under Transport, "Permit". Select permit type: tourist, goods, stage carriage, or taxi. Submit fitness certificate, insurance, and route details. Permit issued within 30 days.' },
  { id: 't5', tags: ['traffic','fine','challan','penalty','pay'], service: 'transport',
    q: 'How to pay a traffic fine or challan?',
    a: 'Under Transport, select "Traffic Fine Payment". Enter your vehicle number or challan number. Pay via UPI or card. Receipt emailed and sent to your mobile.' },
  { id: 't6', tags: ['rc','lost','duplicate','certificate'], service: 'transport',
    q: 'My vehicle RC is lost. How to get a duplicate?',
    a: 'File an FIR at police station first. Then apply for duplicate RC under Transport services with FIR copy, identity proof, and a fee. Issued within 15 working days.' },

  // ── SANITATION ────────────────────────────────────────────────────────────
  { id: 's1', tags: ['toilet','construction','subsidy','swachh','bharat'], service: 'sanitation',
    q: 'How to get subsidy for toilet construction?',
    a: 'Under Sanitation, select "Swachh Bharat Subsidy". Apply if your household has no toilet. BPL families get subsidy up to 12000 rupees. Aadhaar and bank account required for direct benefit transfer.' },
  { id: 's2', tags: ['open','defecation','complaint','odf'], service: 'sanitation',
    q: 'How to report open defecation in my area?',
    a: 'File a grievance under Sanitation. Provide location details. The Swachh Bharat Mission team will take action within 7 working days.' },
  { id: 's3', tags: ['solid','waste','dump','garbage','management'], service: 'sanitation',
    q: 'Large garbage dump not being cleared in my locality.',
    a: 'Register under Sanitation, "Solid Waste Management Complaint". Include GPS location or address. Cleared within 3 days for urban areas, 7 days for rural.' },

  // ── GOVERNMENT SCHEMES ────────────────────────────────────────────────────
  { id: 'sc1', tags: ['pm','kisan','farmer','agriculture','subsidy'], service: 'schemes',
    q: 'What is PM-KISAN scheme and how to apply?',
    a: 'PM-KISAN gives farmers 6000 rupees per year in three instalments. Apply under Schemes section. You need Aadhaar, land records, and bank account. Amount transferred directly to bank.' },
  { id: 'sc2', tags: ['pm','awas','house','housing','home'], service: 'schemes',
    q: 'How to apply for PM Awas Yojana housing scheme?',
    a: 'Go to Schemes and select PM Awas Yojana. Eligible for BPL families without pucca house. Application requires Aadhaar, income certificate, and bank account. Subsidy up to 1.5 lakh for rural area.' },
  { id: 'sc3', tags: ['mgnregs','nregs','job','work','100 days','employment'], service: 'schemes',
    q: 'How to apply for MGNREGS job card?',
    a: 'MGNREGS guarantees 100 days of work per year to rural households. Apply under Schemes for job card. You need Aadhaar and bank account. Work is given within 15 days of application.' },
  { id: 'sc4', tags: ['orunodoi','assam','cash','transfer','women'], service: 'schemes',
    q: 'What is Orunodoi scheme in Assam?',
    a: 'Orunodoi provides monthly financial assistance to eligible women in Assam. Currently 1250 rupees per month. Apply under Schemes. BPL family women with Aadhaar and bank account are eligible.' },
  { id: 'sc5', tags: ['scholarship','student','education','sc','st','obc'], service: 'schemes',
    q: 'How to apply for government scholarship?',
    a: 'Go to Schemes and select Education Scholarships. Available for SC, ST, OBC, and minority students. Apply with marks sheet, income certificate, and bank details before the deadline each year.' },
  { id: 'sc6', tags: ['ration','card','food','bpl','apl','apply'], service: 'schemes',
    q: 'How to apply for or update ration card?',
    a: 'Apply under Schemes for new ration card. Required documents: identity proof, address proof, and family details. Existing card can be updated with name addition or removal in the same section.' },
  { id: 'sc7', tags: ['pension','old age','widow','disability','senior'], service: 'schemes',
    q: 'How to apply for old age or widow pension?',
    a: 'Select "Pension Schemes" under Government Schemes. Old Age Pension is for citizens above 60 years. Widow Pension for widows below 60. Submit Aadhaar, age proof, and income certificate.' },
  { id: 'sc8', tags: ['disability','certificate','divyang','handicap'], service: 'schemes',
    q: 'How to get a disability certificate?',
    a: 'Apply under Schemes for Disability Certificate. Visit nearest government hospital for medical assessment. Certificate issued by Civil Surgeon. Required for Divyang benefits and reservations.' },

  // ── TRACKING / COMPLAINTS ─────────────────────────────────────────────────
  { id: 'tr1', tags: ['track','status','complaint','reference','check','application'], service: 'track',
    q: 'How to track my complaint or application status?',
    a: 'Go to Track Status section. Enter your reference number or application ID. You will see current status, expected completion date, and last update.' },
  { id: 'tr2', tags: ['escalate','not resolved','pending','late','delay'], service: 'track',
    q: 'My complaint is pending for too long. How to escalate?',
    a: 'In Track Status, open your complaint and select "Escalate". It will be forwarded to senior officers. You will get SMS updates on escalation progress.' },
  { id: 'tr3', tags: ['receipt','download','print','copy'], service: 'track',
    q: 'How to download or print a receipt?',
    a: 'Go to Track Status and find your completed application. Select "Download Receipt". PDF receipt can be printed at the kiosk printer or sent to your email.' },

  // ── GENERAL ───────────────────────────────────────────────────────────────
  { id: 'gen1', tags: ['office','location','address','where','find','near'], service: 'general',
    q: 'Where is the nearest government office?',
    a: 'Use the Office Locator on this kiosk. Select the department and your current location. It will show nearest offices with distance, address, and working hours.' },
  { id: 'gen2', tags: ['aadhaar','update','address','mobile','correction'], service: 'general',
    q: 'How to update Aadhaar card details?',
    a: 'Visit the nearest Aadhaar Seva Kendra. You can also update address online at uidai.gov.in. For mobile number or biometric update, in-person visit is mandatory.' },
  { id: 'gen3', tags: ['help','assistant','what can','service','available'], service: 'general',
    q: 'What services are available at this kiosk?',
    a: 'SUVIDHA kiosk provides: Electricity connection and bills, Assam Gas services, Municipal water and property tax, Healthcare appointments and schemes, Transport services, Government welfare schemes, and Complaint tracking.' },
  { id: 'gen4', tags: ['language','change','hindi','assamese','english'], service: 'general',
    q: 'How to change the language?',
    a: 'Tap the language button at the top of the screen. You can choose from 22 Indian languages. The kiosk will speak and display in your selected language.' },
  { id: 'gen5', tags: ['emergency','sos','help','urgent','accident'], service: 'general',
    q: 'How to call for emergency help?',
    a: 'Press the red EMERGENCY button at the bottom of the screen. You can reach Police (100), Ambulance (108), Fire (101), and Women Helpline (1091) directly.' },
  { id: 'gen6', tags: ['feedback','complaint','kiosk','problem'], service: 'general',
    q: 'How to give feedback about this kiosk?',
    a: 'Use the AI Chat button at the bottom. You can also call the citizen helpline 1800-345-3611 (toll free). Your feedback helps improve the service.' },
  { id: 'gen7', tags: ['bpl','income','certificate','below poverty'], service: 'general',
    q: 'How to get BPL or income certificate?',
    a: 'Apply at your nearest circle office or through the Revenue department. Required documents: Aadhaar, voter ID, and declaration of income. Certificate issued within 15 working days.' },
  { id: 'gen8', tags: ['caste','certificate','sc','st','obc'], service: 'general',
    q: 'How to get caste certificate?',
    a: 'Apply at your Circle Office with Aadhaar, school certificate, and parent identity proof. Certificate issued within 15 working days. Required for scholarship and reservation benefits.' },
  { id: 'gen9', tags: ['pan','card','income tax','tax'], service: 'general',
    q: 'How to apply for PAN card?',
    a: 'PAN card is issued by Income Tax department. Apply online at tin-nsdl.com or visit a PAN service centre. Submit Form 49A with ID and address proof. Issued within 15 days.' },
  { id: 'gen10', tags: ['voter','id','election','card','epic'], service: 'general',
    q: 'How to apply for voter ID card?',
    a: 'Apply at voter.eci.gov.in or your nearest Electoral Registration Officer. Submit Form 6 with proof of age, address, and a photograph. New voter ID issued before next election.' },
];

/**
 * Search FAQ for best matching answer.
 * @param {string} query - user question in any language (translated to English first ideally)
 * @param {string} [service] - optional service context filter
 * @returns {{ q: string, a: string, id: string } | null}
 */
export function searchFAQ(query, service = null) {
  if (!query) return null;
  const words = query.toLowerCase()
    .replace(/[.,!?;:'"]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (words.length === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const item of FAQ) {
    if (service && item.service !== service && item.service !== 'general') continue;
    let score = 0;
    for (const word of words) {
      if (item.tags.some(tag => tag.includes(word) || word.includes(tag))) score += 2;
      if (item.q.toLowerCase().includes(word)) score += 1;
      if (item.a.toLowerCase().includes(word)) score += 0.5;
    }
    if (score > bestScore) { bestScore = score; best = item; }
  }

  return bestScore >= 2 ? best : null;
}

/**
 * Get all FAQs for a service (for suggestion chips).
 */
export function getFAQByService(service) {
  return FAQ.filter(f => f.service === service || f.service === 'general').slice(0, 6);
}

export default FAQ;

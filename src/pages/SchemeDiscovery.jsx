import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles, Leaf, Home, Heart, BookOpen, Briefcase,
  Search, CheckCircle, IndianRupee, Filter, Star, ArrowRight,
} from 'lucide-react';
import { Button, Input, Select, LoadingSpinner, Modal } from '../components';
import { VK, I, ic } from '../components/kiosk';
import { SchemesIcon } from '../assets/icons';
import { states } from '../utils/constants';
import { schemeAPI, api } from '../utils/apiService';
import { getSarvamLangCode } from '../utils/languageConfig';

const mockSchemes = [
  {
    id: 'PM-KISAN',
    name: 'PM-Kisan Samman Nidhi',
    nameHi: 'पीएम-किसान सम्मान निधि',
    nameTa: 'பிரதமர் கிசான் சம்மான் நிதி',
    ministry: 'Ministry of Agriculture',
    description: 'Income support of ₹6,000/year to farmer families with cultivable land.',
    descHi: 'खेती योग्य भूमि वाले किसान परिवारों को ₹6,000/वर्ष की आय सहायता।',
    descTa: 'விவசாய நிலம் கொண்ட விவசாய குடும்பங்களுக்கு ₹6,000/ஆண்டு வருமான உதவி.',
    eligibility: ['Small/marginal farmer', 'Indian citizen', 'Has cultivable land'],
    benefit: '₹6,000 per year (in 3 installments)',
    match: 95,
    category: 'Agriculture',
    status: 'Active',
  },
  {
    id: 'PMAY',
    name: 'Pradhan Mantri Awas Yojana',
    nameHi: 'प्रधानमंत्री आवास योजना',
    nameTa: 'பிரதமர் வீட்டுவசதி திட்டம்',
    ministry: 'Ministry of Housing & Urban Affairs',
    description: 'Affordable housing for economically weaker sections and LIG households.',
    descHi: 'आर्थिक रूप से कमजोर वर्गों और LIG परिवारों के लिए सस्ती आवास।',
    descTa: 'பொருளாதாரத்தில் நலிந்த பிரிவினர் மற்றும் LIG குடும்பங்களுக்கு மலிவான வீட்டுவசதி.',
    eligibility: ['Annual income < ₹6 lakh', 'No pucca house', 'First-time beneficiary'],
    benefit: 'Subsidy up to ₹2.67 lakh',
    match: 88,
    category: 'Housing',
    status: 'Active',
  },
  {
    id: 'AYUSHMAN',
    name: 'Ayushman Bharat - PMJAY',
    nameHi: 'आयुष्मान भारत - PMJAY',
    nameTa: 'ஆயுஷ்மான் பாரத் - PMJAY',
    ministry: 'Ministry of Health & Family Welfare',
    description: 'Health insurance cover of ₹5 lakh per family per year for secondary & tertiary hospitalization.',
    descHi: 'माध्यमिक और तृतीयक अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष ₹5 लाख का स्वास्थ्य बीमा कवर।',
    descTa: 'இரண்டாம் நிலை மற்றும் மூன்றாம் நிலை மருத்துவமனையில் சேர்க்கைக்கு ஒரு குடும்பத்திற்கு ஆண்டுக்கு ₹5 லட்சம் சுகாதார காப்பீடு.',
    eligibility: ['BPL family or SECC listed', 'No other health insurance', 'Indian citizen'],
    benefit: '₹5,00,000 health cover per family',
    match: 82,
    category: 'Health',
    status: 'Active',
  },
  {
    id: 'DBT-PAHAL',
    name: 'PAHAL (DBTL) - LPG Subsidy',
    nameHi: 'पहल (DBTL) - एलपीजी सब्सिडी',
    nameTa: 'பஹல் (DBTL) - LPG மானியம்',
    ministry: 'Ministry of Petroleum & Natural Gas',
    description: 'Direct benefit transfer of LPG subsidy into bank accounts of consumers.',
    descHi: 'उपभोक्ताओं के बैंक खातों में एलपीजी सब्सिडी का प्रत्यक्ष लाभ हस्तांतरण।',
    descTa: 'நுகர்வோர் வங்கிக் கணக்குகளில் LPG மானியத்தை நேரடி நன்மை பரிமாற்றம்.',
    eligibility: ['Has LPG connection', 'Bank account linked to Aadhaar', 'Indian citizen'],
    benefit: 'LPG subsidy via DBT',
    match: 76,
    category: 'Energy',
    status: 'Active',
  },
  {
    id: 'PM-SVANidhi',
    name: 'PM SVANidhi - Street Vendor Loans',
    nameHi: 'पीएम स्वनिधि - स्ट्रीट वेंडर ऋण',
    nameTa: 'பிரதமர் ஸ்வநிதி - தெரு வியாபாரிகள் கடன்',
    ministry: 'Ministry of Housing & Urban Affairs',
    description: 'Micro-credit facility for street vendors with working capital loan up to ₹50,000.',
    descHi: 'स्ट्रीट वेंडरों के लिए ₹50,000 तक कार्यशील पूंजी ऋण के साथ सूक्ष्म-ऋण सुविधा।',
    descTa: 'தெரு வியாபாரிகளுக்கு ₹50,000 வரை செயல்பாட்டு மூலதன கடனுடன் நுண்-கடன் வசதி.',
    eligibility: ['Registered street vendor', 'Valid identity proof', 'Working in urban area'],
    benefit: 'Loan up to ₹50,000',
    match: 70,
    category: 'Livelihood',
    status: 'Active',
  },
  {
    id: 'SUKANYA',
    name: 'Sukanya Samriddhi Yojana',
    nameHi: 'सुकन्या समृद्धि योजना',
    nameTa: 'சுகன்யா சம்ரிதி யோஜனா',
    ministry: 'Ministry of Finance',
    description: 'Savings scheme for girl child offering high interest rate with tax benefits.',
    descHi: 'बालिकाओं के लिए उच्च ब्याज दर और कर लाभ के साथ बचत योजना।',
    descTa: 'அதிக வட்டி விகிதம் மற்றும் வரிச் சலுகைகளுடன் பெண் குழந்தைக்கான சேமிப்புத் திட்டம்.',
    eligibility: ['Girl child below 10 years', 'Indian resident', 'Only 2 accounts per family'],
    benefit: '7.6% interest rate, tax-free maturity',
    match: 65,
    category: 'Women & Child',
    status: 'Active',
  },
  {
    id: 'MGNREGA',
    name: 'MGNREGA - Rural Employment',
    nameHi: 'मनरेगा - ग्रामीण रोजगार',
    nameTa: 'மகாத்மா காந்தி ஊரக வேலை உறுதி',
    ministry: 'Ministry of Rural Development',
    description: 'Guarantees 100 days of wage employment per year to rural households.',
    descHi: 'ग्रामीण परिवारों को प्रति वर्ष 100 दिन मजदूरी रोजगार की गारंटी।',
    descTa: 'ஊரக குடும்பங்களுக்கு ஆண்டுக்கு 100 நாட்கள் ஊதிய வேலைவாய்ப்பு உறுதி.',
    eligibility: ['Rural household', 'Adult willing to do unskilled manual work', 'Indian citizen'],
    benefit: '100 days guaranteed employment per year',
    match: 80,
    category: 'Employment',
    status: 'Active',
  },
  {
    id: 'PM-UJJWALA',
    name: 'PM Ujjwala Yojana',
    nameHi: 'प्रधानमंत्री उज्ज्वला योजना',
    nameTa: 'பிரதமர் உஜ்வலா திட்டம்',
    ministry: 'Ministry of Petroleum & Natural Gas',
    description: 'Free LPG connections to women from BPL households for clean cooking fuel.',
    descHi: 'BPL परिवारों की महिलाओं को मुफ्त एलपीजी कनेक्शन।',
    descTa: 'BPL குடும்பங்களின் பெண்களுக்கு இலவச LPG இணைப்பு.',
    eligibility: ['BPL household', 'Woman applicant', 'No existing LPG connection'],
    benefit: 'Free LPG connection + first refill',
    match: 78,
    category: 'Energy',
    status: 'Active',
  },
  {
    id: 'JAN-DHAN',
    name: 'PM Jan Dhan Yojana',
    nameHi: 'प्रधानमंत्री जन धन योजना',
    nameTa: 'பிரதமர் ஜன் தன் திட்டம்',
    ministry: 'Ministry of Finance',
    description: 'Zero-balance bank account with RuPay debit card, insurance cover and overdraft facility.',
    descHi: 'शून्य-शेष बैंक खाता, RuPay डेबिट कार्ड, बीमा कवर और ओवरड्राफ्ट सुविधा।',
    descTa: 'பூஜ்ஜிய இருப்பு வங்கிக் கணக்கு, RuPay டெபிட் கார்டு, காப்பீடு மற்றும் மேல்வரைப்பற்று வசதி.',
    eligibility: ['Indian citizen', 'No existing bank account', 'Age 10+ years'],
    benefit: 'Zero-balance account + ₹2 lakh accident insurance',
    match: 90,
    category: 'Financial Inclusion',
    status: 'Active',
  },
  {
    id: 'PM-MUDRA',
    name: 'PM MUDRA Yojana',
    nameHi: 'प्रधानमंत्री मुद्रा योजना',
    nameTa: 'பிரதமர் முத்ரா திட்டம்',
    ministry: 'Ministry of Finance',
    description: 'Collateral-free loans up to ₹10 lakh for micro/small enterprises.',
    descHi: 'सूक्ष्म/लघु उद्यमों के लिए ₹10 लाख तक बिना गारंटी के ऋण।',
    descTa: 'நுண்/சிறு நிறுவனங்களுக்கு ₹10 லட்சம் வரை ஈட்டுறுதியில்லா கடன்.',
    eligibility: ['Non-farm small business', 'Indian citizen', 'Valid business plan'],
    benefit: 'Loans: Shishu (₹50K), Kishore (₹5L), Tarun (₹10L)',
    match: 72,
    category: 'Business',
    status: 'Active',
  },
  {
    id: 'ATAL-PENSION',
    name: 'Atal Pension Yojana',
    nameHi: 'अटल पेंशन योजना',
    nameTa: 'அடல் ஓய்வூதியத் திட்டம்',
    ministry: 'Ministry of Finance',
    description: 'Guaranteed pension of ₹1,000 to ₹5,000/month after age 60 for unorganized sector workers.',
    descHi: '60 वर्ष की आयु के बाद असंगठित क्षेत्र के कामगारों को ₹1,000 से ₹5,000/माह गारंटीकृत पेंशन।',
    descTa: '60 வயதிற்குப் பிறகு அமைப்புசாரா துறை தொழிலாளர்களுக்கு ₹1,000 முதல் ₹5,000/மாதம் உத்தரவாத ஓய்வூதியம்.',
    eligibility: ['Age 18-40', 'Bank account with Aadhaar', 'Not income tax payer'],
    benefit: '₹1,000-₹5,000 monthly pension after 60',
    match: 74,
    category: 'Pension',
    status: 'Active',
  },
  {
    id: 'NSP',
    name: 'National Scholarship Portal',
    nameHi: 'राष्ट्रीय छात्रवृत्ति पोर्टल',
    nameTa: 'தேசிய உதவித்தொகை போர்டல்',
    ministry: 'Ministry of Education',
    description: 'Central & state scholarships for students from Class 1 to PhD level.',
    descHi: 'कक्षा 1 से PhD स्तर तक के छात्रों के लिए केंद्रीय और राज्य छात्रवृत्तियां।',
    descTa: 'வகுப்பு 1 முதல் PhD வரை மாணவர்களுக்கான மத்திய & மாநில உதவித்தொகைகள்.',
    eligibility: ['Enrolled student', 'Income criteria vary by scheme', 'Indian citizen'],
    benefit: '₹500 to ₹75,000/year depending on level',
    match: 85,
    category: 'Education',
    status: 'Active',
  },
  {
    id: 'PM-VISHWAKARMA',
    name: 'PM Vishwakarma Yojana',
    nameHi: 'प्रधानमंत्री विश्वकर्मा योजना',
    nameTa: 'பிரதமர் விஸ்வகர்மா திட்டம்',
    ministry: 'Ministry of MSME',
    description: 'Support for traditional artisans and craftspeople — training, toolkit, and credit.',
    descHi: 'पारंपरिक कारीगरों के लिए प्रशिक्षण, टूलकिट और ऋण सहायता।',
    descTa: 'பாரம்பரிய கைவினைஞர்களுக்கு பயிற்சி, கருவித்தொகுப்பு மற்றும் கடன் உதவி.',
    eligibility: ['Traditional artisan/craftsperson', 'Working with hands/tools', 'Indian citizen'],
    benefit: '₹15,000 toolkit + ₹3 lakh loan at 5%',
    match: 71,
    category: 'Livelihood',
    status: 'Active',
  },
  {
    id: 'PMSBY',
    name: 'PM Suraksha Bima Yojana',
    nameHi: 'प्रधानमंत्री सुरक्षा बीमा योजना',
    nameTa: 'பிரதமர் சுரக்ஷா பீமா திட்டம்',
    ministry: 'Ministry of Finance',
    description: 'Accident insurance cover of ₹2 lakh at just ₹20/year premium.',
    descHi: 'केवल ₹20/वर्ष प्रीमियम पर ₹2 लाख का दुर्घटना बीमा कवर।',
    descTa: 'வெறும் ₹20/ஆண்டு பிரீமியத்தில் ₹2 லட்சம் விபத்துக் காப்பீடு.',
    eligibility: ['Age 18-70', 'Bank account', 'Indian citizen'],
    benefit: '₹2 lakh accidental death/disability cover',
    match: 88,
    category: 'Insurance',
    status: 'Active',
  },
  {
    id: 'PMJJBY',
    name: 'PM Jeevan Jyoti Bima Yojana',
    nameHi: 'प्रधानमंत्री जीवन ज्योति बीमा योजना',
    nameTa: 'பிரதமர் ஜீவன் ஜோதி பீமா திட்டம்',
    ministry: 'Ministry of Finance',
    description: 'Life insurance cover of ₹2 lakh at ₹436/year premium.',
    descHi: '₹436/वर्ष प्रीमियम पर ₹2 लाख का जीवन बीमा कवर।',
    descTa: '₹436/ஆண்டு பிரீமியத்தில் ₹2 லட்சம் ஆயுள் காப்பீடு.',
    eligibility: ['Age 18-50', 'Bank account with auto-debit', 'Indian citizen'],
    benefit: '₹2 lakh life cover for any cause of death',
    match: 86,
    category: 'Insurance',
    status: 'Active',
  },
  {
    id: 'SWACHH-BHARAT',
    name: 'Swachh Bharat Mission',
    nameHi: 'स्वच्छ भारत मिशन',
    nameTa: 'ஸ்வச்ச் பாரத் இயக்கம்',
    ministry: 'Ministry of Jal Shakti',
    description: 'Financial assistance of ₹12,000 for building individual household toilets.',
    descHi: 'व्यक्तिगत घरेलू शौचालय बनाने के लिए ₹12,000 की वित्तीय सहायता।',
    descTa: 'தனிநபர் கழிவறை கட்ட ₹12,000 நிதி உதவி.',
    eligibility: ['BPL household', 'No existing toilet', 'Indian citizen'],
    benefit: '₹12,000 for toilet construction',
    match: 69,
    category: 'Sanitation',
    status: 'Active',
  },
  {
    id: 'PM-MATRU',
    name: 'PM Matru Vandana Yojana',
    nameHi: 'प्रधानमंत्री मातृ वंदना योजना',
    nameTa: 'பிரதமர் மாத்ரு வந்தனா திட்டம்',
    ministry: 'Ministry of WCD',
    description: 'Cash incentive of ₹5,000 for pregnant and lactating women for first living child.',
    descHi: 'गर्भवती और स्तनपान कराने वाली महिलाओं को पहली जीवित संतान के लिए ₹5,000 नकद प्रोत्साहन।',
    descTa: 'கர்ப்பிணி மற்றும் பாலூட்டும் பெண்களுக்கு முதல் குழந்தைக்கு ₹5,000 பணப்பரிசு.',
    eligibility: ['Pregnant/lactating woman', 'First living child', 'Age 19+'],
    benefit: '₹5,000 in 3 installments',
    match: 79,
    category: 'Women & Child',
    status: 'Active',
  },
  {
    id: 'STANDUP-INDIA',
    name: 'Stand Up India',
    nameHi: 'स्टैंड अप इंडिया',
    nameTa: 'ஸ்டாண்ட் அப் இந்தியா',
    ministry: 'Ministry of Finance',
    description: 'Bank loans between ₹10 lakh and ₹1 crore for SC/ST and women entrepreneurs.',
    descHi: 'SC/ST और महिला उद्यमियों के लिए ₹10 लाख से ₹1 करोड़ तक बैंक ऋण।',
    descTa: 'SC/ST மற்றும் பெண் தொழில்முனைவோருக்கு ₹10 லட்சம் முதல் ₹1 கோடி வரை வங்கிக் கடன்.',
    eligibility: ['SC/ST or woman entrepreneur', 'First-time venture', 'Age 18+'],
    benefit: 'Loan ₹10 lakh to ₹1 crore',
    match: 68,
    category: 'Business',
    status: 'Active',
  },
  {
    id: 'PM-FASAL',
    name: 'PM Fasal Bima Yojana',
    nameHi: 'प्रधानमंत्री फसल बीमा योजना',
    nameTa: 'பிரதமர் பயிர் காப்பீட்டுத் திட்டம்',
    ministry: 'Ministry of Agriculture',
    description: 'Crop insurance with very low premium for farmers against natural calamities.',
    descHi: 'प्राकृतिक आपदाओं से किसानों के लिए बहुत कम प्रीमियम पर फसल बीमा।',
    descTa: 'இயற்கை பேரிடர்களுக்கு எதிராக விவசாயிகளுக்கு மிகக் குறைந்த பிரீமியத்தில் பயிர் காப்பீடு.',
    eligibility: ['Farmer with notified crop', 'Loanee or non-loanee farmer', 'Indian citizen'],
    benefit: 'Crop loss compensation (premium: 1.5-5%)',
    match: 77,
    category: 'Agriculture',
    status: 'Active',
  },
  {
    id: 'DIGITAL-INDIA',
    name: 'Digital India Programme',
    nameHi: 'डिजिटल इंडिया कार्यक्रम',
    nameTa: 'டிஜிட்டல் இந்தியா திட்டம்',
    ministry: 'Ministry of Electronics & IT',
    description: 'Free digital literacy training and internet access for rural citizens.',
    descHi: 'ग्रामीण नागरिकों के लिए मुफ्त डिजिटल साक्षरता प्रशिक्षण और इंटरनेट पहुंच।',
    descTa: 'ஊரக குடிமக்களுக்கு இலவச டிஜிட்டல் எழுத்தறிவு பயிற்சி மற்றும் இணைய அணுகல்.',
    eligibility: ['Indian citizen', 'Residing in rural area', 'No prior digital training'],
    benefit: 'Free computer & internet training',
    match: 60,
    category: 'Education',
    status: 'Active',
  },
];

const ageGroups = [
  { value: '', label: 'Select Age Group' },
  { value: '18-25', label: '18-25 years' },
  { value: '26-35', label: '26-35 years' },
  { value: '36-45', label: '36-45 years' },
  { value: '46-60', label: '46-60 years' },
  { value: '60+', label: '60+ years' },
];

const incomeRanges = [
  { value: '', label: 'Select Annual Income' },
  { value: 'below-1L', label: 'Below ₹1,00,000' },
  { value: '1L-3L', label: '₹1,00,000 - ₹3,00,000' },
  { value: '3L-6L', label: '₹3,00,000 - ₹6,00,000' },
  { value: '6L-10L', label: '₹6,00,000 - ₹10,00,000' },
  { value: 'above-10L', label: 'Above ₹10,00,000' },
];

const categoryOptions = [
  { value: '', label: 'Select Category' },
  { value: 'general', label: 'General' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'ews', label: 'EWS' },
];

const occupations = [
  { value: '', label: 'Select Occupation' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'student', label: 'Student' },
  { value: 'salaried', label: 'Salaried Employee' },
  { value: 'self-employed', label: 'Self Employed' },
  { value: 'daily-wage', label: 'Daily Wage Worker' },
  { value: 'street-vendor', label: 'Street Vendor' },
  { value: 'homemaker', label: 'Homemaker' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
];

// Category filter mapping: menu card id → scheme category strings to include
const categoryFilterMap = {
  agriculture: ['Agriculture'],
  housing: ['Housing', 'Sanitation'],
  health: ['Health', 'Insurance', 'Women & Child'],
  education: ['Education'],
  employment: ['Employment', 'Livelihood', 'Business', 'Financial Inclusion', 'Pension', 'Energy'],
};

const SchemeDiscovery = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState('menu'); // 'menu' | 'profile' | 'results'
  const [preCategory, setPreCategory] = useState(''); // menu card selected category
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    ageGroup: '',
    gender: '',
    state: '',
    income: '',
    category: '',
    occupation: '',
  });
  const [results, setResults] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [translatedSchemes, setTranslatedSchemes] = useState({});

  const lang = i18n.language;

  const menuCards = [
    {
      id: 'all',
      LucideIcon: Sparkles,
      title: t('schemes.discoverSchemes', 'Discover My Schemes'),
      description: t('home.schemesAllDesc', 'AI-powered matching across all government schemes'),
      color: '#7c3aed',
      bg: 'color-mix(in oklab, #7c3aed 12%, white)',
    },
    {
      id: 'agriculture',
      LucideIcon: Leaf,
      title: t('home.schemesAgriculture', 'Agriculture Schemes'),
      description: t('home.schemesAgricultureDesc', 'Farming support, crop insurance, soil health'),
      color: '#16a34a',
      bg: 'color-mix(in oklab, #16a34a 12%, white)',
    },
    {
      id: 'housing',
      LucideIcon: Home,
      title: t('home.schemesHousing', 'Housing & Urban'),
      description: t('home.schemesHousingDesc', 'Affordable housing, sanitation, urban development'),
      color: '#ea580c',
      bg: 'color-mix(in oklab, #ea580c 12%, white)',
    },
    {
      id: 'health',
      LucideIcon: Heart,
      title: t('home.schemesHealth', 'Health & Insurance'),
      description: t('home.schemesHealthDesc', 'Medical cover, life & accident insurance schemes'),
      color: '#dc2626',
      bg: 'color-mix(in oklab, #dc2626 12%, white)',
    },
    {
      id: 'education',
      LucideIcon: BookOpen,
      title: t('home.schemesEducation', 'Education & Skills'),
      description: t('home.schemesEducationDesc', 'Scholarships, digital literacy, skill training'),
      color: '#0369a1',
      bg: 'color-mix(in oklab, #0369a1 12%, white)',
    },
    {
      id: 'employment',
      LucideIcon: Briefcase,
      title: t('home.schemesEmployment', 'Employment & Finance'),
      description: t('home.schemesEmploymentDesc', 'Jobs, loans, pensions, financial inclusion'),
      color: '#ca8a04',
      bg: 'color-mix(in oklab, #ca8a04 12%, white)',
    },
  ];

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleDiscover = async () => {
    setLoading(true);
    try {
      const data = await schemeAPI.discover(profile);
      if (data && data.schemes && data.schemes.length > 0) {
        const filtered = applyPreCategoryFilter(data.schemes);
        setResults(filtered);
        setStep('results');
        setLoading(false);
        return;
      }
    } catch {
      // fall through to local matching
    }

    let matched = [...mockSchemes];

    if (profile.occupation === 'farmer') {
      matched = matched.map(s => s.id === 'PM-KISAN' ? { ...s, match: 98 } : s);
    }
    if (profile.income === 'below-1L' || profile.income === '1L-3L') {
      matched = matched.map(s => s.id === 'PMAY' ? { ...s, match: 94 } : s);
      matched = matched.map(s => s.id === 'AYUSHMAN' ? { ...s, match: 92 } : s);
    }
    if (profile.occupation === 'street-vendor') {
      matched = matched.map(s => s.id === 'PM-SVANidhi' ? { ...s, match: 96 } : s);
    }

    matched.sort((a, b) => b.match - a.match);
    const filtered = applyPreCategoryFilter(matched);
    setResults(filtered);
    setStep('results');
    setLoading(false);
  };

  const applyPreCategoryFilter = (schemes) => {
    if (!preCategory || preCategory === 'all') return schemes;
    const allowedCategories = categoryFilterMap[preCategory] || [];
    return schemes.filter(s => allowedCategories.includes(s.category));
  };

  const handleApply = (scheme) => {
    setSelectedScheme(scheme);
    setShowApplyModal(true);
  };

  const translateSchemeTexts = useCallback(async (schemes, targetLang) => {
    if (targetLang === 'en' || targetLang === 'hi' || targetLang === 'ta') return;
    const cacheKey = targetLang;
    if (translatedSchemes[cacheKey]) return;
    try {
      const textsToTranslate = [];
      schemes.forEach(s => {
        textsToTranslate.push(s.name);
        textsToTranslate.push(s.description);
      });
      const sarvamCode = getSarvamLangCode(targetLang);
      const response = await api.post('/api/sarvam/batch-translate', {
        texts: textsToTranslate,
        source_language_code: 'en-IN',
        target_language_code: sarvamCode,
      });
      const translated = response.translations || textsToTranslate;
      const cache = {};
      schemes.forEach((s, i) => {
        cache[s.id] = {
          name: translated[i * 2] || s.name,
          description: translated[i * 2 + 1] || s.description,
        };
      });
      setTranslatedSchemes(prev => ({ ...prev, [cacheKey]: cache }));
    } catch (err) {
      console.warn('Scheme translation failed:', err);
    }
  }, [translatedSchemes]);

  useEffect(() => {
    if (results.length > 0 && lang !== 'en' && lang !== 'hi' && lang !== 'ta') {
      translateSchemeTexts(results, lang);
    }
  }, [results, lang]);

  const getLocalName = (scheme) => {
    if (lang === 'hi' && scheme.nameHi) return scheme.nameHi;
    if (lang === 'ta' && scheme.nameTa) return scheme.nameTa;
    const cached = translatedSchemes[lang];
    if (cached && cached[scheme.id]) return cached[scheme.id].name;
    return scheme.name;
  };

  const getLocalDesc = (scheme) => {
    if (lang === 'hi' && scheme.descHi) return scheme.descHi;
    if (lang === 'ta' && scheme.descTa) return scheme.descTa;
    const cached = translatedSchemes[lang];
    if (cached && cached[scheme.id]) return cached[scheme.id].description;
    return scheme.description;
  };

  const filteredResults = searchQuery
    ? results.filter(s => {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.ministry.toLowerCase().includes(q) ||
          (s.nameHi && s.nameHi.includes(searchQuery)) ||
          (s.nameTa && s.nameTa.includes(searchQuery));
      })
    : results;

  const isProfileComplete = profile.ageGroup && profile.state && profile.income;

  if (loading) {
    return (
      <VK bg="color-mix(in oklab, #7c3aed 4%, white)">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" message={t('schemes.analyzing', 'Analysing your profile…')} />
        </div>
      </VK>
    );
  }

  return (
    <VK bg="color-mix(in oklab, #7c3aed 4%, white)">

      {/* ── MENU LANDING ── */}
      {step === 'menu' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
            }}>
              <SchemesIcon size={60} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 10 }}>
              {t('schemes.title', 'Government Schemes')}
            </h1>
            <p className="body-l" style={{ color: 'var(--ink-500)' }}>
              {t('schemes.subtitle', 'AI-powered scheme discovery · Eligibility matching · Instant apply')}
            </p>
          </div>

          {/* Service grid — 3 cols for kiosk */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
            {menuCards.map((s) => {
              const Icon = s.LucideIcon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setPreCategory(s.id);
                    setStep('profile');
                  }}
                  className="tile"
                  style={{
                    minHeight: 260,
                    padding: 32,
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    gap: 20,
                    borderTop: `6px solid ${s.color}`,
                    touchAction: 'manipulation',
                  }}
                  aria-label={s.title}
                >
                  <div style={{
                    width: 72, height: 72, borderRadius: 20,
                    background: s.bg, display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <Icon size={36} style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  <div className="nm" style={{ fontSize: 26, lineHeight: 1.3 }}>{s.title}</div>
                  <div className="sub" style={{ fontSize: 20, marginTop: 'auto' }}>{s.description}</div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-quiet"
            style={{ alignSelf: 'center', fontSize: 22, padding: '18px 48px' }}
            onClick={() => navigate('/home')}
          >
            <I d={ic.back} size={24} /> {t('home.backToOrgs', 'Back to Organizations')}
          </button>
        </>
      )}

      {/* ── PROFILE INPUT STEP ── */}
      {step === 'profile' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12, boxShadow: '0 4px 16px rgba(124,58,237,0.25)',
            }}>
              <SchemesIcon size={40} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 6 }}>
              {t('schemes.title', 'Government Schemes')}
            </h1>
          </div>

          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-8">
            <h2 className="text-kiosk-xl font-bold text-gray-800 mb-6">
              {t('schemes.enterProfile', 'Enter Your Profile')}
            </h2>
            <p className="text-kiosk-base text-gray-500 mb-8">
              {t('schemes.profileHint', 'We use this to match the best schemes for you')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select label={t('schemes.ageGroup', 'Age Group')} value={profile.ageGroup} onChange={(e) => handleProfileChange('ageGroup', e.target.value)} options={ageGroups} />
              <Select label={t('schemes.gender', 'Gender')} value={profile.gender} onChange={(e) => handleProfileChange('gender', e.target.value)} options={[
                { value: '', label: t('schemes.selectGender', 'Select Gender') },
                { value: 'male', label: t('schemes.male', 'Male') },
                { value: 'female', label: t('schemes.female', 'Female') },
                { value: 'other', label: t('schemes.otherGender', 'Other') },
              ]} />
              <Select label={t('form.state', 'State')} value={profile.state} onChange={(e) => handleProfileChange('state', e.target.value)} options={[
                { value: '', label: t('form.selectState', 'Select State') },
                ...states.map(s => ({ value: s.id, label: s.name }))
              ]} />
              <Select label={t('schemes.income', 'Annual Income')} value={profile.income} onChange={(e) => handleProfileChange('income', e.target.value)} options={incomeRanges} />
              <Select label={t('schemes.category', 'Category')} value={profile.category} onChange={(e) => handleProfileChange('category', e.target.value)} options={categoryOptions} />
              <Select label={t('schemes.occupation', 'Occupation')} value={profile.occupation} onChange={(e) => handleProfileChange('occupation', e.target.value)} options={occupations} />
            </div>

            <div className="mt-8">
              <Button onClick={handleDiscover} disabled={!isProfileComplete} fullWidth size="xlarge" icon={Sparkles} iconPosition="right">
                {t('schemes.discoverSchemes', 'Discover My Schemes')}
              </Button>
            </div>

            <div className="mt-4 text-center">
              <button type="button" className="btn btn-quiet" style={{ fontSize: 20 }} onClick={() => setStep('menu')}>
                <I d={ic.back} size={20} /> {t('app.back', 'Back')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULTS STEP ── */}
      {step === 'results' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12, boxShadow: '0 4px 16px rgba(124,58,237,0.25)',
            }}>
              <SchemesIcon size={40} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 6 }}>
              {t('schemes.title', 'Government Schemes')}
            </h1>
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('schemes.searchSchemes', 'Search schemes…')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-kiosk text-kiosk-base focus:ring-2 focus:ring-government-blue focus:border-government-blue"
              />
            </div>
            <Button variant="outline" onClick={() => { setStep('profile'); setResults([]); setSearchQuery(''); }} icon={Filter}>
              {t('schemes.refineSearch', 'Refine')}
            </Button>
          </div>

          {/* Match summary */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-kiosk-lg p-6 mb-6 border border-purple-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-kiosk-xl font-bold text-purple-800">
                  {t('schemes.matchFound', { count: filteredResults.length })}
                </h3>
                <p className="text-sm text-purple-600 mt-1">
                  {t('schemes.rankedByEligibility', 'Ranked by eligibility score')}
                </p>
              </div>
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">
                  {t('schemes.aiRecommended', 'AI Recommended')}
                </span>
              </div>
            </div>
          </div>

          {/* Scheme cards */}
          <div className="space-y-4">
            {filteredResults.map((scheme, index) => (
              <div key={scheme.id} className="bg-white rounded-kiosk-lg shadow-kiosk overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-bold text-white bg-government-blue px-3 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${scheme.match >= 90 ? 'bg-green-100 text-green-700' : scheme.match >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                          {scheme.match}% {t('schemes.matchLabel', 'match')}
                        </span>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {scheme.category}
                        </span>
                      </div>
                      <h3 className="text-kiosk-xl font-bold text-gray-900">{getLocalName(scheme)}</h3>
                      <p className="text-sm text-gray-500 mt-1">{scheme.ministry}</p>
                    </div>
                    {scheme.match >= 90 && (
                      <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                        <span className="text-xs font-bold text-green-700">{t('schemes.topMatch', 'Top Match')}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-kiosk-base text-gray-600 mb-4">{getLocalDesc(scheme)}</p>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('schemes.eligibilityCriteria', 'Eligibility')}:</h4>
                    <div className="flex flex-wrap gap-2">
                      {scheme.eligibility.map((crit, i) => (
                        <span key={i} className="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {crit}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-700 bg-green-50 px-4 py-2 rounded-kiosk mb-4">
                    <IndianRupee className="w-4 h-4 mr-2 text-green-600" />
                    <span className="font-medium">{t('schemes.benefit', 'Benefit')}: {scheme.benefit}</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{t('schemes.eligibilityScore', 'Eligibility Score')}</span>
                      <span className="font-bold">{scheme.match}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${scheme.match >= 90 ? 'bg-green-500' : scheme.match >= 75 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{ width: `${scheme.match}%` }}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleApply(scheme)} fullWidth size="large" icon={ArrowRight} iconPosition="right">
                    {t('schemes.applyNow', 'Apply Now')}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center py-6">
            <button
              type="button"
              className="btn btn-quiet"
              style={{ fontSize: 22, padding: '18px 48px' }}
              onClick={() => navigate('/home')}
            >
              <I d={ic.back} size={24} /> {t('home.backToOrgs', 'Back to Organizations')}
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        type="success"
        title={t('schemes.applicationStarted', 'Application Started')}
        message={selectedScheme
          ? `${t('schemes.applicationMsg', 'You are applying for')} "${getLocalName(selectedScheme)}". ${t('schemes.documentsNeeded', 'Please keep your documents ready.')}`
          : ''
        }
        confirmText={t('schemes.proceedWithDocs', 'Proceed')}
        cancelText={t('app.cancel')}
        onConfirm={() => setShowApplyModal(false)}
        onCancel={() => setShowApplyModal(false)}
      />
    </VK>
  );
};

export default SchemeDiscovery;

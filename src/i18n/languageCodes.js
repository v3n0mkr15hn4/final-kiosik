/**
 * Complete 22 Scheduled Indian Languages + English
 * ← NEW: Full language manifest with provider, script, and RTL metadata
 */

export const INDIAN_LANGUAGES = [
  { code:'hi',  name:'Hindi',     native:'हिंदी',         script:'Devanagari',  provider:'sarvam', rtl:false },
  { code:'en',  name:'English',   native:'English',        script:'Latin',       provider:'sarvam', rtl:false },
  { code:'ta',  name:'Tamil',     native:'தமிழ்',          script:'Tamil',       provider:'sarvam', rtl:false },
  { code:'te',  name:'Telugu',    native:'తెలుగు',         script:'Telugu',      provider:'sarvam', rtl:false },
  { code:'kn',  name:'Kannada',   native:'ಕನ್ನಡ',          script:'Kannada',     provider:'sarvam', rtl:false },
  { code:'ml',  name:'Malayalam', native:'മലയാളം',         script:'Malayalam',   provider:'sarvam', rtl:false },
  { code:'mr',  name:'Marathi',   native:'मराठी',          script:'Devanagari',  provider:'sarvam', rtl:false },
  { code:'gu',  name:'Gujarati',  native:'ગુજરાતી',        script:'Gujarati',    provider:'sarvam', rtl:false },
  { code:'bn',  name:'Bengali',   native:'বাংলা',          script:'Bengali',     provider:'sarvam', rtl:false },
  { code:'or',  name:'Odia',      native:'ଓଡ଼ିଆ',          script:'Odia',        provider:'sarvam', rtl:false },
  { code:'pa',  name:'Punjabi',   native:'ਪੰਜਾਬੀ',         script:'Gurmukhi',    provider:'sarvam', rtl:false },
  { code:'as',  name:'Assamese',  native:'অসমীয়া',        script:'Bengali',     provider:'sarvam', rtl:false },
  { code:'ur',  name:'Urdu',      native:'اردو',           script:'Perso-Arabic',provider:'hf',     rtl:true  },
  { code:'ks',  name:'Kashmiri',  native:'كٲشُر',          script:'Perso-Arabic',provider:'hf',     rtl:true  },
  { code:'sd',  name:'Sindhi',    native:'سنڌي',           script:'Perso-Arabic',provider:'hf',     rtl:true  },
  { code:'mai', name:'Maithili',  native:'मैथिली',         script:'Devanagari',  provider:'hf',     rtl:false },
  { code:'kok', name:'Konkani',   native:'कोंकणी',         script:'Devanagari',  provider:'hf',     rtl:false },
  { code:'doi', name:'Dogri',     native:'डोगरी',          script:'Devanagari',  provider:'hf',     rtl:false },
  { code:'ne',  name:'Nepali',    native:'नेपाली',         script:'Devanagari',  provider:'hf',     rtl:false },
  { code:'sa',  name:'Sanskrit',  native:'संस्कृतम्',      script:'Devanagari',  provider:'hf',     rtl:false },
  { code:'mni', name:'Manipuri',  native:'ꯃꯤꯇꯩꯂꯣꯟ',        script:'Meitei Mayek',provider:'hf',     rtl:false },
  { code:'brx', name:'Bodo',      native:'बड़ो',            script:'Devanagari',  provider:'hf',     rtl:false },
  { code:'sat', name:'Santali',   native:'ᱥᱟᱱᱛᱟᱲᱤ',       script:'Ol Chiki',    provider:'hf',     rtl:false },
];

// ← NEW: Groupings for UI display
// Spec requires EN, HI, AS as primary 3; TA and KN added for broad reach
export const POPULAR_LANGS = ['hi', 'en', 'as', 'ta', 'te', 'kn'];
export const NORTH_EAST_LANGS = ['mr', 'gu', 'bn', 'or', 'pa', 'ml', 'ur', 'mai'];
export const OTHER_LANGS = ['ks', 'sd', 'kok', 'doi', 'ne', 'sa', 'mni', 'bo', 'sat'];

export const RTL_LANGS = ['ur', 'ks', 'sd'];

export default INDIAN_LANGUAGES;

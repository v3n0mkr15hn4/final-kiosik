/**
 * Voice messages in all supported languages (English, Hindi, Assamese, Tamil)
 * Used for form events, navigation, and user feedback
 */

export const FORM_SUBMIT_MESSAGES = {
  en: 'Submitting form. Please wait.',
  hi: 'फॉर्म जमा कर रहे हैं। कृपया प्रतीक्षा करें।',
  as: 'ফর्म জমা দিচ্ছি। অনুগ্রহ করে অপেক্ষা করুন।',
  ta: 'படிவம் சமர்ப்பிக்கப்படுகிறது। தயவுசெய்து காத்திருங்கள்।',
};

export const FORM_SUCCESS_MESSAGES = {
  en: 'Form submitted successfully.',
  hi: 'फॉर्म सफलतापूर्वक जमा किया।',
  as: 'ফর্ম সফলভাবে জমা দেওয়া হয়েছে।',
  ta: 'படிவம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது।',
};

export const FORM_ERROR_MESSAGES = {
  en: 'Error submitting form. Please check your entries and try again.',
  hi: 'फॉर्म जमा करने में त्रुटि। कृपया अपनी प्रविष्टियों की जांच करें।',
  as: 'ফর্ম জমা দিতে ত্রুটি। অনুগ্রহ করে আপনার প্রবেশ পরীক্ষা করুন।',
  ta: 'படிவம் சமர்ப்பிக்க பிழை। உங்கள் உள்ளீடுகளைச் சரிபார்க்கவும்।',
};

export const BACK_MESSAGES = {
  en: 'Going back to previous page.',
  hi: 'पिछले पृष्ठ पर जा रहे हैं।',
  as: 'আগের পৃষ্ঠায় যাচ্ছি।',
  ta: 'முந்தைய பக்கத்திற்கு திரும்புகிறேன்।',
};

export const LOGOUT_MESSAGES = {
  en: 'Logging out. Thank you for using Suvidha. Goodbye.',
  hi: 'लॉग आउट कर रहे हैं। सुविधा का उपयोग करने के लिए धन्यवाद।',
  as: 'লগ আউট করছি। সুবিধা ব্যবহারের জন্য ধন্যবাদ।',
  ta: 'வெளியேறுகிறேன். சுவிதாவைப் பயன்படுத்தியதற்கு நன்றி।',
};

export const OTP_MESSAGES = {
  otp_sent: {
    en: 'OTP sent successfully to your mobile. Please enter the six digit code.',
    hi: 'ओटीपी आपके मोबाइल पर सफलतापूर्वक भेजा गया है। कृपया छः अंकों का कोड दर्ज करें।',
    as: 'ওটিপি আপনার মোবাইলে সফলভাবে পাঠানো হয়েছে। অনুগ্রহ করে ছয় অঙ্কের কোড প্রবেশ করুন।',
    ta: 'ஓটிபி உங்கள் செல்லுலாருக்கு வெற்றிகரமாக அனுப்பப்பட்டது। தயவுசெய்து ছह இலக்க குறியீட்டை உள்ளிடுக।',
  },
  otp_verified: {
    en: 'OTP verified successfully.',
    hi: 'ओटीपी सफलतापूर्वक सत्यापित किया गया।',
    as: 'ওটিপি সফলভাবে যাচাই করা হয়েছে।',
    ta: 'ஓடிபி வெற்றிகரமாக যাচাই செய்யப்பட்டது।',
  },
  otp_invalid: {
    en: 'Invalid OTP. Please try again.',
    hi: 'अमान्य ओटीपी। कृपया फिर से प्रयास करें।',
    as: 'অবৈধ ওটিপি। অনুগ্রহ করে আবার চেষ্টা করুন।',
    ta: 'தவறான ஓடிபி। மீண்டும் முயற்சிக்கவும்।',
  },
};

export const AADHAAR_MESSAGES = {
  aadhaar_lookup: {
    en: 'Verifying Aadhaar. Please wait.',
    hi: 'आधार सत्यापन हो रहा है। कृपया प्रतीक्षा करें।',
    as: 'আধার যাচাই করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।',  
    ta: 'ஆதாரை சரிபார்க்கிறேன். தயவுசெய்து காத்திருங்கள்।',
  },
  aadhaar_verified: {
    en: 'Aadhaar verified. Please choose your authentication method.',
    hi: 'आधार सत्यापित हो गया। कृपया अपनी प्रमाणीकरण विधि चुनें।',
    as: 'আধার যাচাই করা হয়েছে। অনুগ্রহ করে আপনার প্রমাণীকরণ পদ্ধতি চয়ন করুন।',
    ta: 'ஆதாரை சரிபார்க்க முடிந்தது. உங்கள் প্রমாணীকরণ முறையை தேர்ந்தெடுக்கவும்।',
  },
  aadhaar_invalid: {
    en: 'Invalid Aadhaar number. Please check and try again.',
    hi: 'अमान्य आधार नंबर। कृपया जांचें और दोबारा प्रयास करें।',
    as: 'অবৈধ আধার নম্বর। অনুগ্রহ করে পরীক্ষা করুন এবং আবার চেষ্টা করুন।',
    ta: 'தவறான ஆதார எண். தயவுசெய்து பரிசோধிக்கி மீண்டும் முயற்சிக்கவும்।',
  },
};

export function getMessageByLanguage(messages, language) {
  if (!messages || !language) return '';
  
  const baseLang = (language || 'en').toLowerCase().split('-')[0];
  return messages[baseLang] || messages.en || '';
}

export default {
  FORM_SUBMIT_MESSAGES,
  FORM_SUCCESS_MESSAGES,
  FORM_ERROR_MESSAGES,
  BACK_MESSAGES,
  LOGOUT_MESSAGES,
  OTP_MESSAGES,
  AADHAAR_MESSAGES,
  getMessageByLanguage,
};

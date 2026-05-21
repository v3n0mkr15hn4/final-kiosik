import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Phone, X, AlertTriangle, Shield } from 'lucide-react';

// Pages that have the new VK shell with a built-in EMERGENCY button in the
// bottom bar. On these pages we hide the floating SOS button (to avoid two
// emergency UIs), but still listen for the 'suvidha:open-emergency' event
// the VK bottom bar dispatches so the modal opens correctly.
const KIOSK_SHELL_ROUTES = new Set([
  '/',
  '/login',
  '/mode-select',
  '/home',
  '/dashboard',
]);

/**
 * Emergency Quick Access Panel
 * Always accessible — no login required.
 * Floating SOS button that expands into emergency numbers panel.
 */

const EMERGENCY_NUMBERS = [
  { name: 'Ambulance', nameHi: 'एम्बुलेंस', nameTa: 'ஆம்புலன்ஸ்', number: '108', color: 'bg-red-600', icon: '🚑' },
  { name: 'Police', nameHi: 'पुलिस', nameTa: 'காவல்துறை', number: '100', color: 'bg-blue-700', icon: '🚔' },
  { name: 'Fire Department', nameHi: 'दमकल', nameTa: 'தீயணைப்பு', number: '101', color: 'bg-orange-600', icon: '🚒' },
  { name: 'Women Helpline', nameHi: 'महिला हेल्पलाइन', nameTa: 'பெண்கள் உதவி', number: '1091', color: 'bg-pink-600', icon: '👩' },
  { name: 'Child Helpline', nameHi: 'बाल हेल्पलाइन', nameTa: 'குழந்தை உதவி', number: '1098', color: 'bg-green-600', icon: '👶' },
  { name: 'Disaster Management', nameHi: 'आपदा प्रबंधन', nameTa: 'பேரிடர் மேலாண்மை', number: '1078', color: 'bg-yellow-600', icon: '⚠️' },
  { name: 'Suicide Prevention (iCall)', nameHi: 'आत्महत्या रोकथाम', nameTa: 'தற்கொலை தடுப்பு', number: '9152987821', color: 'bg-purple-600', icon: '💜' },
  { name: 'Senior Citizen Helpline', nameHi: 'वरिष्ठ नागरिक', nameTa: 'மூத்த குடிமக்கள்', number: '14567', color: 'bg-teal-600', icon: '👴' },
  { name: 'Road Accident Emergency', nameHi: 'सड़क दुर्घटना', nameTa: 'சாலை விபத்து', number: '1073', color: 'bg-gray-700', icon: '🚗' },
];

const EmergencyQuickAccess = () => {
  const [isOpen, setIsOpen] = useState(false);
  const lang = localStorage.getItem('i18nextLng') || 'en';
  const location = useLocation();
  const onKioskShell = KIOSK_SHELL_ROUTES.has(location.pathname);

  // Listen for the VK bottom bar's EMERGENCY button.
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('suvidha:open-emergency', handler);
    return () => window.removeEventListener('suvidha:open-emergency', handler);
  }, []);

  const getName = (item) => {
    if (lang === 'hi') return item.nameHi || item.name;
    if (lang === 'ta') return item.nameTa || item.name;
    return item.name;
  };

  return (
    <>
      {/* Floating SOS Button — hidden on pages with the new VK shell */}
      {!onKioskShell && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-[9998] w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 animate-pulse"
          aria-label="Emergency SOS"
          title="Emergency Numbers"
        >
          <span className="text-2xl font-black">SOS</span>
        </button>
      )}

      {/* Emergency Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-red-600 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">
                    {lang === 'hi' ? '🆘 आपातकालीन नंबर' : lang === 'ta' ? '🆘 அவசர எண்கள்' : '🆘 Emergency Numbers'}
                  </h2>
                  <p className="text-sm opacity-90">
                    {lang === 'hi' ? 'लॉगिन आवश्यक नहीं' : lang === 'ta' ? 'உள்நுழைவு தேவையில்லை' : 'No login required'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Numbers List */}
            <div className="p-4 space-y-3">
              {EMERGENCY_NUMBERS.map((item) => (
                <a
                  key={item.number}
                  href={`tel:${item.number}`}
                  className="flex items-center space-x-4 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all active:scale-[0.98]"
                >
                  <div className={`w-14 h-14 ${item.color} rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-lg">{getName(item)}</p>
                    <p className="text-sm text-gray-500">
                      {lang === 'hi' ? 'नंबर डायल करें' : lang === 'ta' ? 'எண்ணை அழைக்கவும்' : 'Tap to call'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Phone className="w-5 h-5 text-red-500" />
                    <span className="text-xl font-black text-red-600">{item.number}</span>
                  </div>
                </a>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 rounded-b-2xl text-center">
              <p className="text-xs text-gray-500">
                {lang === 'hi'
                  ? 'सभी नंबर 24/7 उपलब्ध हैं। कॉल सरकारी हेल्पलाइन पर जाती है।'
                  : lang === 'ta'
                  ? 'அனைத்து எண்களும் 24/7 கிடைக்கும்.'
                  : 'All numbers are 24/7. Calls connect to government helplines.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmergencyQuickAccess;

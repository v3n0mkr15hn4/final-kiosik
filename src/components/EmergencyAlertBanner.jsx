import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { alertAPI } from '../utils/apiService';

// Pages on the new VK shell: the tricolor strip + brand bar sit at the very top
// and would visually clash with this fixed banner. Hide here; surface alerts
// via in-page advisory cards (Dashboard already does this for AQI).
// TODO Phase 2: redesign banner to fit below the tricolor strip.
const KIOSK_SHELL_ROUTES = new Set([
  '/',
  '/login',
  '/mode-select',
  '/home',
  '/dashboard',
]);

const MOCK_ALERTS = [
  {
    id: 'alert-1',
    type: 'weather',
    severity: 'high',
    title: 'Heavy Rainfall Warning — IMD Red Alert for Mumbai & Coastal Maharashtra. Avoid waterlogged areas.',
    titleHi: 'भारी बारिश की चेतावनी — IMD ने मुंबई व तटीय महाराष्ट्र में रेड अलर्ट जारी किया है। जलभराव क्षेत्रों से बचें।',
    titleTa: 'கனமழை எச்சரிக்கை — மும்பை மற்றும் கடலோர மகாராஷ்டிராவில் IMD சிவப்பு எச்சரிக்கை.',
    source: 'IMD',
    active: true,
  },
  {
    id: 'alert-2',
    type: 'air',
    severity: 'medium',
    title: 'Air Quality Alert Delhi NCR — AQI 400+ (Severe). Wear N95 masks. Avoid outdoor activities.',
    titleHi: 'वायु गुणवत्ता चेतावनी दिल्ली NCR — AQI 400+ (गंभीर)। N95 मास्क पहनें। बाहरी गतिविधियों से बचें।',
    titleTa: 'காற்று தர எச்சரிக்கை டெல்லி NCR — AQI 400+ (தீவிரம்). N95 மாஸ்க் அணியுங்கள்.',
    source: 'CPCB',
    active: true,
  },
];

const EmergencyAlertBanner = () => {
  const [alerts, setAlerts] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await alertAPI.getEmergency();
        if (data?.alerts?.length > 0) { setAlerts(data.alerts); return; }
      } catch { /* fall through */ }
      setAlerts(MOCK_ALERTS.filter(a => a.active));
    };
    fetchAlerts();
  }, []);

  if (alerts.length === 0) return null;
  if (KIOSK_SHELL_ROUTES.has(location.pathname)) return null;

  const lang = localStorage.getItem('i18nextLng') || 'en';
  const getText = (alert) => {
    if (lang === 'hi') return alert.titleHi || alert.title;
    if (lang === 'ta') return alert.titleTa || alert.title;
    return alert.title;
  };

  const marqueeText = alerts.map(a => `${a.source}: ${getText(a)}`).join('     •••     ');

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]" role="alert" aria-live="assertive">
      <style>{`
        @keyframes suvidha-marquee {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .suvidha-marquee-text {
          animation: suvidha-marquee 40s linear infinite;
          white-space: nowrap;
          display: inline-block;
          will-change: transform;
        }
        .suvidha-marquee-text:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ── Scrolling ticker bar ─────────────────────────── */}
      <div className="bg-white border-b border-red-200 flex items-stretch h-9 shadow-sm">
        {/* Red badge on left */}
        <div className="flex items-center bg-red-600 px-3 gap-1.5 flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-white" aria-hidden />
          <span className="text-white text-[11px] font-black uppercase tracking-widest leading-none">
            {lang === 'hi' ? 'आपातकाल' : lang === 'ta' ? 'அவசரம்' : 'EMERGENCY'}
          </span>
        </div>

        {/* Divider dot */}
        <div className="flex items-center px-2 text-red-400 flex-shrink-0 text-sm font-bold">▶</div>

        {/* Marquee viewport */}
        <div className="flex-1 overflow-hidden flex items-center relative">
          <div className="suvidha-marquee-text">
            <span className="text-red-700 font-semibold text-sm">{marqueeText}</span>
          </div>
        </div>

        {/* Expand button */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center px-3 gap-1 text-xs text-gray-500 hover:bg-gray-50 border-l border-gray-200 flex-shrink-0 transition-colors"
          aria-label={expanded ? 'Collapse alerts' : 'Expand alerts'}
        >
          <span className="hidden sm:inline">{alerts.length} alert{alerts.length > 1 ? 's' : ''}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Expanded detail panel ────────────────────────── */}
      {expanded && (
        <div className="bg-white border-b-2 border-red-600 shadow-xl max-h-[50vh] overflow-y-auto">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-snug">{getText(alert)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Source: {alert.source}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmergencyAlertBanner;

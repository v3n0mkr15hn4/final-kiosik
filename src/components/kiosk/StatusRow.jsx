// ──────────────────────────────────────────────────────────────────
// SUVIDHA Vertical Kiosk · Status row (Weather + AQI + Clock + Connectivity)
// Source: docs/kiosk-design/designs/kiosk-shell.jsx:75-119
// Pulls live data from useEnvironment(); accepts explicit `status` props
// to override (used by Dashboard for the AQI-Moderate showcase).
// ──────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { I, ic, weatherIcon } from './icons';
import useEnvironment from '../../hooks/useEnvironment';

// CPCB India AQI bands.
export function aqiBand(v) {
  if (v <= 50)  return { label: 'Good',          tone: 'good', color: 'var(--ok)' };
  if (v <= 100) return { label: 'Satisfactory',  tone: 'good', color: 'var(--ok)' };
  if (v <= 200) return { label: 'Moderate',      tone: 'mod',  color: 'oklch(0.74 0.15 75)' };
  if (v <= 300) return { label: 'Poor',          tone: 'poor', color: 'var(--err)' };
  if (v <= 400) return { label: 'Very Poor',     tone: 'poor', color: 'var(--err)' };
  return            { label: 'Severe',           tone: 'poor', color: 'var(--err)' };
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // repaint only on minute change
    const tick = () => {
      const d = new Date();
      setNow(prev => (prev.getMinutes() === d.getMinutes() ? prev : d));
    };
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatDate(d) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}
function formatTime(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function StatusRow({ override = {}, compact = false }) {
  const env = useEnvironment();
  const now = useNow();

  // override allows pages (e.g. Dashboard demo) to force values
  const city = override.city ?? env.city;
  const temp = override.temp ?? env.weather?.temp ?? 28;
  const feels = override.feelsLike ?? env.weather?.feelsLike ?? temp + 2;
  const condition = override.condition ?? env.weather?.condition ?? 'Partly cloudy';
  const iconKey = override.iconKey ?? env.weather?.iconKey ?? 'cloudsun';
  const aqi = override.aqi ?? env.aqi?.value ?? 132;
  const online = override.online ?? env.online;

  const band = aqiBand(aqi);

  return (
    <div className="vk-status" role="status" aria-live="polite">
      <div className="stat stat-weather" style={{ flex: 1.2 }}>
        <div className="ico"><I d={weatherIcon(iconKey)} size={26} /></div>
        <div>
          <div className="lbl">{city} · {condition}</div>
          <div className="val">
            {temp}°C{' '}
            <span style={{ fontSize: 14, color: 'var(--ink-500)', fontWeight: 500, letterSpacing: 0 }}>
              feels {feels}°
            </span>
          </div>
        </div>
      </div>

      <div
        className={`stat stat-aqi-${band.tone}`}
        style={{ flex: 1 }}
        aria-label={`Air quality ${aqi}, ${band.label}.`}
      >
        <div className="ico"><I d={ic.leaf} size={26} /></div>
        <div>
          <div className="lbl">AIR QUALITY · CPCB</div>
          <div className="val" style={{ color: band.color }}>
            {aqi}{' '}
            <span style={{ fontSize: 14, color: 'var(--ink-500)', fontWeight: 600, letterSpacing: 0 }}>
              {band.label}
            </span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="stat stat-clock" style={{ flex: 0.9 }}>
          <div className="ico"><I d={ic.clock} size={22} /></div>
          <div>
            <div className="lbl">{formatDate(now)}</div>
            <div className="val" style={{ fontFamily: 'var(--font-mono)' }}>{formatTime(now)}</div>
          </div>
        </div>
      )}

      <div
        className={`stat stat-net${online ? '' : ' offline'}`}
        style={{ paddingLeft: 14, paddingRight: 14 }}
        aria-label={online ? 'Online' : 'Offline'}
      >
        <div className="ico"><I d={ic.wifi} size={22} /></div>
      </div>
    </div>
  );
}

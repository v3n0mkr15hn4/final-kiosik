// ──────────────────────────────────────────────────────────────────
// useEnvironment — Weather + AQI + Connectivity for the kiosk status row.
//
// Polls /api/env/weather every 15 min, /api/env/aqi every 30 min.
// Caches both in localStorage; falls back to last-known value when offline
// or the request fails. Listens to navigator online/offline events.
// ──────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';

const DEFAULT_CITY = 'Guwahati';

const STORAGE_KEY = 'suvidha.env';
const WEATHER_INTERVAL_MS = 15 * 60 * 1000;
const AQI_INTERVAL_MS     = 30 * 60 * 1000;

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}
function writeCache(patch) {
  try {
    const next = { ...readCache(), ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota — ignore */
  }
}

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export default function useEnvironment(city = DEFAULT_CITY) {
  const cached = readCache();

  const [weather, setWeather] = useState(cached.weather ?? null);
  const [aqi,     setAqi]     = useState(cached.aqi ?? null);
  const [online,  setOnline]  = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const refreshWeather = useCallback(async () => {
    try {
      const data = await fetchJSON(`/api/env/weather?city=${encodeURIComponent(city)}`);
      setWeather(data);
      writeCache({ weather: data });
    } catch {
      /* keep cached value */
    }
  }, [city]);

  const refreshAqi = useCallback(async () => {
    try {
      const data = await fetchJSON(`/api/env/aqi?city=${encodeURIComponent(city)}`);
      setAqi(data);
      writeCache({ aqi: data });
    } catch {
      /* keep cached value */
    }
  }, [city]);

  useEffect(() => {
    refreshWeather();
    refreshAqi();
    const w = setInterval(refreshWeather, WEATHER_INTERVAL_MS);
    const a = setInterval(refreshAqi, AQI_INTERVAL_MS);
    return () => { clearInterval(w); clearInterval(a); };
  }, [refreshWeather, refreshAqi]);

  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return { city, weather, aqi, online, refreshWeather, refreshAqi };
}

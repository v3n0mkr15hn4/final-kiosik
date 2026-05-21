// ──────────────────────────────────────────────────────────────────
// /api/env/weather and /api/env/aqi
//
// Public endpoints for the kiosk status row (StatusRow / useEnvironment).
//
// Weather: OpenWeatherMap if OWM_API_KEY is set, else deterministic mock.
// AQI:     data.gov.in CPCB dataset if DATA_GOV_KEY is set, else mock.
//
// Both endpoints maintain an in-memory cache so we don't hammer external APIs.
// ──────────────────────────────────────────────────────────────────

import { Router } from 'express';

const router = Router();

const CITY_COORDS = {
  guwahati:    { lat: 26.1445, lon: 91.7362 },
  delhi:       { lat: 28.6139, lon: 77.2090 },
  mumbai:      { lat: 19.0760, lon: 72.8777 },
  bengaluru:   { lat: 12.9716, lon: 77.5946 },
  chennai:     { lat: 13.0827, lon: 80.2707 },
  kolkata:     { lat: 22.5726, lon: 88.3639 },
  hyderabad:   { lat: 17.3850, lon: 78.4867 },
  ahmedabad:   { lat: 23.0225, lon: 72.5714 },
  pune:        { lat: 18.5204, lon: 73.8567 },
  lucknow:     { lat: 26.8467, lon: 80.9462 },
};

function aqiTone(v) {
  if (v <= 100) return 'good';
  if (v <= 200) return 'mod';
  return 'poor';
}

// Map OpenWeatherMap weather codes → our iconKey
// https://openweathermap.org/weather-conditions
function owmIconKey(code) {
  if (code >= 200 && code < 600) return 'cloud';   // storms / drizzle / rain — closest match in our icon set
  if (code >= 600 && code < 700) return 'cloud';   // snow
  if (code >= 700 && code < 800) return 'cloud';   // atmosphere (mist, haze)
  if (code === 800) return 'sun';                  // clear
  if (code === 801 || code === 802) return 'cloudsun';
  if (code === 803 || code === 804) return 'cloud';
  return 'cloudsun';
}

function mockWeather(city) {
  // Deterministic mock keyed off city so dev sessions feel real.
  const seed = city.toLowerCase().charCodeAt(0) || 65;
  const temp = 24 + (seed % 12);
  return {
    city,
    temp,
    feelsLike: temp + 2,
    condition: 'Partly cloudy',
    iconKey: 'cloudsun',
    fetchedAt: Date.now(),
    source: 'mock',
  };
}

function mockAqi(city) {
  const seed = city.toLowerCase().charCodeAt(1) || 70;
  const value = 80 + (seed * 3) % 220;
  return {
    city,
    value,
    band: aqiTone(value),
    fetchedAt: Date.now(),
    source: 'mock',
  };
}

// Simple TTL cache.
const cache = new Map();
function getCached(key, ttlMs) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return hit.data;
  return null;
}
function setCached(key, data) {
  cache.set(key, { data, t: Date.now() });
}

async function fetchOWM(city) {
  const key = process.env.OWM_API_KEY;
  if (!key) return null;
  const c = CITY_COORDS[city.toLowerCase()];
  if (!c) return null;
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${c.lat}&lon=${c.lon}&units=metric&appid=${key}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const j = await r.json();
    return {
      city,
      temp: Math.round(j.main?.temp ?? 0),
      feelsLike: Math.round(j.main?.feels_like ?? j.main?.temp ?? 0),
      condition: j.weather?.[0]?.description
        ?.replace(/^./, (c) => c.toUpperCase()) ?? 'Clear',
      iconKey: owmIconKey(j.weather?.[0]?.id ?? 800),
      fetchedAt: Date.now(),
      source: 'openweathermap',
    };
  } catch {
    return null;
  }
}

async function fetchAqiFromGov(city) {
  const key = process.env.DATA_GOV_KEY;
  if (!key) return null;
  try {
    // CPCB realtime AQI resource on data.gov.in
    const resource = '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';
    const url = `https://api.data.gov.in/resource/${resource}?api-key=${key}&format=json&limit=2000&filters%5Bcity%5D=${encodeURIComponent(city)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const j = await r.json();
    const records = j.records || [];
    if (records.length === 0) return null;
    // Take the highest pollutant value across stations as the city AQI proxy
    const values = records
      .map((rec) => Number(rec.pollutant_avg ?? rec.pollutant_max))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (values.length === 0) return null;
    const value = Math.max(...values);
    return {
      city,
      value,
      band: aqiTone(value),
      fetchedAt: Date.now(),
      source: 'data.gov.in',
    };
  } catch {
    return null;
  }
}

// ─── Routes ───────────────────────────────────────────────────────

router.get('/weather', async (req, res) => {
  const city = String(req.query.city || 'Guwahati').slice(0, 60);
  const cacheKey = `w:${city.toLowerCase()}`;

  const cached = getCached(cacheKey, 5 * 60 * 1000);
  if (cached) {
    res.set('Cache-Control', 'public, max-age=900');
    return res.json(cached);
  }

  const live = await fetchOWM(city);
  const data = live || mockWeather(city);
  setCached(cacheKey, data);
  res.set('Cache-Control', 'public, max-age=900');
  res.json(data);
});

router.get('/aqi', async (req, res) => {
  const city = String(req.query.city || 'Guwahati').slice(0, 60);
  const cacheKey = `a:${city.toLowerCase()}`;

  const cached = getCached(cacheKey, 30 * 60 * 1000);
  if (cached) {
    res.set('Cache-Control', 'public, max-age=1800');
    return res.json(cached);
  }

  const live = await fetchAqiFromGov(city);
  const data = live || mockAqi(city);
  setCached(cacheKey, data);
  res.set('Cache-Control', 'public, max-age=1800');
  res.json(data);
});

export default router;

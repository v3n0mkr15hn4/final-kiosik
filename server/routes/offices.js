import { Router } from 'express';

const router = Router();

const STATE_CENTERS = {
  assam: { center: [26.2006, 92.9376], zoom: 7 },
  'tamil nadu': { center: [11.1271, 78.6569], zoom: 7 },
  delhi: { center: [28.7041, 77.1025], zoom: 10 },
  maharashtra: { center: [19.7515, 75.7139], zoom: 7 },
  karnataka: { center: [15.3173, 75.7139], zoom: 7 },
  'uttar pradesh': { center: [26.8467, 80.9462], zoom: 7 },
  gujarat: { center: [22.2587, 71.1924], zoom: 7 },
  rajasthan: { center: [27.0238, 74.2179], zoom: 7 },
  'west bengal': { center: [22.9868, 87.855], zoom: 7 },
};

const ASSAM_DISTRICTS = [
  'Kamrup Metro', 'Dibrugarh', 'Cachar', 'Jorhat', 'Sonitpur', 'Nagaon', 'Tinsukia',
  'Bongaigaon', 'Barpeta', 'Dhubri', 'Sivasagar', 'Karimganj', 'Goalpara', 'Kamrup',
  'Nalbari', 'Lakhimpur', 'Dhemaji', 'Hailakandi', 'Kokrajhar', 'Chirang', 'Baksa',
  'Udalguri', 'Morigaon', 'Golaghat', 'Majuli', 'Dima Hasao', 'Hojai', 'Biswanath',
  'Charaideo', 'South Salmara', 'West Karbi Anglong', 'East Karbi Anglong',
];

const CATEGORY_ROTATION = [
  'municipal', 'electricity', 'water', 'healthcare', 'transport', 'revenue',
  'sanitation', 'welfare', 'emergency', 'property_tax', 'citizen_service',
];

const ASSAM_OFFICES = [
  { id: 'AS-KM-001', name: 'Guwahati Municipal Corporation Citizen Service Center', organization: 'Municipal Corporation', category: 'municipal', district: 'Kamrup Metro', city: 'Guwahati', latitude: 26.1445, longitude: 91.7362, queueStatus: 'Moderate Queue' },
  { id: 'AS-KM-002', name: 'APDCL Dispur Division Office', organization: 'Assam Power Distribution Company', category: 'electricity', district: 'Kamrup Metro', city: 'Dispur', latitude: 26.1448, longitude: 91.7898, queueStatus: 'Open Now' },
  { id: 'AS-TS-001', name: 'Tinsukia Emergency Response Coordination Cell', organization: 'Emergency Services', category: 'emergency', district: 'Tinsukia', city: 'Tinsukia', latitude: 27.4924, longitude: 95.3553, queueStatus: 'Open Now' },
];

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseArray(rawValue) {
  try {
    return JSON.parse(rawValue || '[]');
  } catch {
    return [];
  }
}

function etaFromDistance(distanceKm) {
  const walking = Math.max(1, Math.round((distanceKm / 4.8) * 60));
  const driving = Math.max(1, Math.round((distanceKm / 28) * 60));
  return { walkingMinutes: walking, drivingMinutes: driving };
}

function normalizeOffice(raw, index = 0) {
  const services = raw.services || parseArray(raw.services_json || raw.services);
  const queueStatus = raw.queue_status || raw.queueStatus || (index % 4 === 0 ? 'Busy' : 'Moderate Queue');
  return {
    id: raw.id,
    name: raw.name,
    organization: raw.organization || raw.type || 'Government Services',
    category: raw.category || raw.type || services?.[0] || 'citizen_service',
    state: raw.state,
    district: raw.district || raw.city || 'Unknown',
    city: raw.city,
    address: raw.address || `${raw.city}, ${raw.state}`,
    latitude: Number.isFinite(Number(raw.latitude)) ? Number(raw.latitude) : null,
    longitude: Number.isFinite(Number(raw.longitude)) ? Number(raw.longitude) : null,
    timings: raw.timings || raw.working_hours || '09:30 AM - 05:30 PM',
    phone: raw.phone || '1800-000-000',
    email: raw.email || null,
    services: Array.isArray(services) ? services : [],
    accessibility_features: raw.accessibility_features || ['wheelchair_access', 'senior_citizen_assistance'],
    accessibility_support: raw.accessibility_support || raw.accessibility_features || ['wheelchair_access', 'senior_citizen_assistance'],
    queue_status: queueStatus,
    queue_level: raw.queue_level || queueStatus,
    status: raw.status || (queueStatus === 'System Down' ? 'System Down' : 'Open Now'),
    emergency_support: Boolean(raw.emergency_support || raw.category === 'emergency' || raw.category === 'healthcare'),
  };
}

function getStateValue(officeState = '') {
  const codeMap = {
    AS: 'assam',
    TN: 'tamil nadu',
    DL: 'delhi',
    MH: 'maharashtra',
    KA: 'karnataka',
    UP: 'uttar pradesh',
    GJ: 'gujarat',
    RJ: 'rajasthan',
    WB: 'west bengal',
  };
  const normalized = String(officeState || '').trim().toLowerCase();
  if (codeMap[officeState]) return codeMap[officeState];
  return normalized;
}

function getAssamCatalog() {
  const seeded = ASSAM_OFFICES.map((entry, index) => normalizeOffice({
    ...entry,
    state: 'Assam',
    address: `${entry.city}, ${entry.district}, Assam`,
    timings: '09:30 AM - 05:30 PM',
    services: [entry.category],
    accessibility_features: ['wheelchair_access', 'senior_citizen_assistance'],
  }, index));

  const districtsPresent = new Set(seeded.map((office) => office.district));
  let serial = 1;
  for (const district of ASSAM_DISTRICTS) {
    if (districtsPresent.has(district)) continue;
    const category = CATEGORY_ROTATION[serial % CATEGORY_ROTATION.length];
    seeded.push(normalizeOffice({
      id: `AS-AUTO-${String(serial).padStart(3, '0')}`,
      name: `${district} Government ${category.replace('_', ' ')} Office`,
      organization: 'Assam Government Services',
      category,
      state: 'Assam',
      district,
      city: district,
      latitude: 26.15 + ((serial % 7) * 0.21),
      longitude: 91.73 + ((serial % 9) * 0.19),
      address: `${district}, Assam`,
      services: [category],
      queue_status: serial % 5 === 0 ? 'Busy' : 'Moderate Queue',
    }, serial));
    serial += 1;
  }
  return seeded;
}

function getDbCatalog(db) {
  const rows = db.prepare('SELECT * FROM offices ORDER BY name').all();
  return rows.map((row, index) => normalizeOffice({ ...row, district: row.district || row.city }, index));
}

function getCombinedCatalog(db) {
  return [...getDbCatalog(db), ...getAssamCatalog()];
}

function applyFilters(offices, query) {
  const search = String(query.search || '').trim().toLowerCase();
  const state = String(query.state || '').toLowerCase();
  const district = String(query.district || '').toLowerCase();
  const city = String(query.city || '').toLowerCase();
  const category = String(query.category || query.type || query.serviceType || '').toLowerCase();

  return offices.filter((office) => {
    const normalizedState = getStateValue(office.state);
    if (state && normalizedState !== state && office.state?.toLowerCase() !== state) return false;
    if (district && office.district?.toLowerCase() !== district) return false;
    if (city && office.city?.toLowerCase() !== city) return false;
    if (category && category !== 'all' && office.category?.toLowerCase() !== category) return false;
    if (!search) return true;

    return [office.name, office.organization, office.state, office.district, office.city, office.category, ...(office.services || [])]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(search));
  });
}

function withDistance(offices, lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return offices.map((office) => ({ ...office, distanceKm: null, eta: null }));
  }

  return offices
    .map((office) => {
      if (!Number.isFinite(office.latitude) || !Number.isFinite(office.longitude)) {
        return { ...office, distanceKm: null, eta: null };
      }
      const distanceKm = Number(haversineDistanceKm(lat, lng, office.latitude, office.longitude).toFixed(2));
      return { ...office, distanceKm, eta: etaFromDistance(distanceKm) };
    })
    .sort((a, b) => (a.distanceKm ?? Number.MAX_VALUE) - (b.distanceKm ?? Number.MAX_VALUE));
}

function getAverageCenter(offices) {
  const scoped = offices.filter((office) => Number.isFinite(office.latitude) && Number.isFinite(office.longitude));
  if (!scoped.length) return null;
  const latitude = scoped.reduce((sum, office) => sum + office.latitude, 0) / scoped.length;
  const longitude = scoped.reduce((sum, office) => sum + office.longitude, 0) / scoped.length;
  return { latitude, longitude };
}

function buildRegionalOrigin(focus, offices) {
  const anchor = Array.isArray(focus?.center)
    ? { latitude: focus.center[0], longitude: focus.center[1] }
    : getAverageCenter(offices);

  if (!anchor) return null;

  return {
    latitude: Number((anchor.latitude - 0.009).toFixed(6)),
    longitude: Number((anchor.longitude - 0.012).toFixed(6)),
  };
}

function buildLocalRouteContext(targetLat, targetLng, offices, destination, district, state, fromLat, fromLng) {
  const scoped = applyFilters(offices, {
    district: district || destination?.district,
    state: state || destination?.state,
  }).filter((office) => Number.isFinite(office.latitude) && Number.isFinite(office.longitude));

  const incomingIsLocal = Number.isFinite(fromLat)
    && Number.isFinite(fromLng)
    && haversineDistanceKm(fromLat, fromLng, targetLat, targetLng) <= 120;

  let origin = incomingIsLocal
    ? { latitude: fromLat, longitude: fromLng }
    : null;

  if (!origin) {
    const peer = scoped
      .filter((office) => office.id !== destination?.id)
      .sort((a, b) => haversineDistanceKm(a.latitude, a.longitude, targetLat, targetLng) - haversineDistanceKm(b.latitude, b.longitude, targetLat, targetLng))[0];

    if (peer) {
      origin = {
        latitude: Number((((peer.latitude + targetLat) / 2) - 0.004).toFixed(6)),
        longitude: Number((((peer.longitude + targetLng) / 2) - 0.004).toFixed(6)),
      };
    } else {
      origin = {
        latitude: Number((targetLat - 0.012).toFixed(6)),
        longitude: Number((targetLng - 0.015).toFixed(6)),
      };
    }
  }

  const distanceKm = Number(haversineDistanceKm(origin.latitude, origin.longitude, targetLat, targetLng).toFixed(2));
  return {
    origin,
    destination: { latitude: targetLat, longitude: targetLng },
    distanceKm,
    eta: etaFromDistance(distanceKm),
    source: 'regional-kiosk-origin',
  };
}

async function getOsrmRoute(fromLng, fromLat, toLng, toLat) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`OSRM returned ${response.status}`);
  }

  const payload = await response.json();
  const route = payload?.routes?.[0];
  if (!route) {
    throw new Error('No route returned by OSRM');
  }

  const points = (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]);
  const distanceKm = Number((route.distance / 1000).toFixed(2));
  const drivingMinutes = Math.max(1, Math.round(route.duration / 60));
  const walkingMinutes = Math.max(1, Math.round((distanceKm / 4.8) * 60));
  const instructions = [];

  for (const leg of route.legs || []) {
    for (const step of leg.steps || []) {
      if (step.maneuver?.instruction) {
        instructions.push(step.maneuver.instruction);
      } else if (step.name) {
        instructions.push(`Continue on ${step.name}`);
      }

      if (instructions.length >= 6) break;
    }
    if (instructions.length >= 6) break;
  }

  return {
    points,
    distanceKm,
    eta: { walkingMinutes, drivingMinutes },
    instructions: instructions.length ? instructions : ['Follow the highlighted road route to the destination.'],
    source: 'osrm',
  };
}

router.get('/state/:state', (req, res) => {
  const db = req.app.locals.db;
  const stateName = String(req.params.state || '').toLowerCase();
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const filtered = applyFilters(getCombinedCatalog(db), { ...req.query, state: stateName });
  const focus = STATE_CENTERS[stateName]
    || (() => {
      const scoped = filtered.filter((office) => Number.isFinite(office.latitude) && Number.isFinite(office.longitude));
      if (!scoped.length) return null;
      const avgLat = scoped.reduce((acc, office) => acc + office.latitude, 0) / scoped.length;
      const avgLng = scoped.reduce((acc, office) => acc + office.longitude, 0) / scoped.length;
      return { center: [avgLat, avgLng], zoom: 7.5 };
    })();
  return res.json({
    success: true,
    state: req.params.state,
    focus,
    virtualOrigin: buildRegionalOrigin(focus, filtered),
    offices: withDistance(filtered, lat, lng),
  });
});

router.get('/district/:district', (req, res) => {
  const db = req.app.locals.db;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const filtered = applyFilters(getCombinedCatalog(db), { ...req.query, district: req.params.district });
  const center = getAverageCenter(filtered);
  const focus = center ? { center: [center.latitude, center.longitude], zoom: 11.8 } : null;
  return res.json({
    success: true,
    district: req.params.district,
    focus,
    virtualOrigin: buildRegionalOrigin(focus, filtered),
    offices: withDistance(filtered, lat, lng),
  });
});

router.get('/category/:type', (req, res) => {
  const db = req.app.locals.db;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const filtered = applyFilters(getCombinedCatalog(db), { ...req.query, category: req.params.type });
  return res.json({ success: true, category: req.params.type, offices: withDistance(filtered, lat, lng) });
});

router.get('/nearby', (req, res) => {
  const db = req.app.locals.db;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const limit = Number(req.query.limit || 10);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ success: false, error: 'lat and lng query params are required.' });
  }

  const offices = withDistance(applyFilters(getCombinedCatalog(db), req.query), lat, lng)
    .slice(0, Math.max(1, Math.min(limit, 100)));
  return res.json({ success: true, offices });
});

router.get('/nearest', (req, res) => {
  const db = req.app.locals.db;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ success: false, error: 'lat and lng query params are required.' });
  }

  const ranked = withDistance(applyFilters(getCombinedCatalog(db), req.query), lat, lng);
  const nearest = ranked[0] || null;
  const leastCrowded = ranked.find((office) => office.queue_status === 'Open Now' || office.queue_status === 'Moderate Queue') || nearest;
  const fastestService = ranked.find((office) => office.status !== 'System Down') || nearest;
  const emergency = ranked.find((office) => office.emergency_support) || nearest;

  return res.json({ success: true, suggestions: { nearest, leastCrowded, fastestService, emergencyNearby: emergency } });
});

router.get('/routes', async (req, res) => {
  const db = req.app.locals.db;
  const catalog = getCombinedCatalog(db);
  const fromLat = Number(req.query.fromLat);
  const fromLng = Number(req.query.fromLng);
  const toLat = Number(req.query.toLat);
  const toLng = Number(req.query.toLng);
  const officeId = req.query.officeId ? String(req.query.officeId) : null;
  const district = req.query.district ? String(req.query.district) : null;
  const state = req.query.state ? String(req.query.state) : null;

  const destination = officeId ? catalog.find((office) => office.id === officeId) : null;
  const targetLat = Number.isFinite(toLat) ? toLat : destination?.latitude;
  const targetLng = Number.isFinite(toLng) ? toLng : destination?.longitude;

  if (![targetLat, targetLng].every(Number.isFinite)) {
    return res.status(400).json({ success: false, error: 'Valid destination coordinates are required.' });
  }

  const localContext = buildLocalRouteContext(targetLat, targetLng, catalog, destination, district, state, fromLat, fromLng);

  try {
    const route = await getOsrmRoute(
      localContext.origin.longitude,
      localContext.origin.latitude,
      localContext.destination.longitude,
      localContext.destination.latitude,
    );

    return res.json({
      success: true,
      route: {
        from: [localContext.origin.latitude, localContext.origin.longitude],
        to: [localContext.destination.latitude, localContext.destination.longitude],
        origin: localContext.origin,
        destination: localContext.destination,
        points: route.points,
        distanceKm: route.distanceKm,
        eta: route.eta,
        instructions: route.instructions,
        source: route.source,
      },
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: `Route generation failed: ${error.message}`,
      route: {
        from: [localContext.origin.latitude, localContext.origin.longitude],
        to: [localContext.destination.latitude, localContext.destination.longitude],
        origin: localContext.origin,
        destination: localContext.destination,
        distanceKm: localContext.distanceKm,
        eta: localContext.eta,
        instructions: ['Live road routing is temporarily unavailable for this office.'],
        source: localContext.source,
      },
    });
  }
});

router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const office = getCombinedCatalog(db).find((entry) => entry.id === req.params.id) || null;
  if (!office) {
    return res.status(404).json({ success: false, error: 'Office not found.' });
  }
  return res.json({ success: true, office });
});

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const filtered = applyFilters(getCombinedCatalog(db), req.query);
  return res.json({ success: true, offices: withDistance(filtered, lat, lng) });
});

export default router;

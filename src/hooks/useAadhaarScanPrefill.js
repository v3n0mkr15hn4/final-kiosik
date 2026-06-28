import { useCallback, useEffect, useRef, useState } from 'react';
import { states, cities } from '../utils/constants';

const POLL_MS = 500;
const ENDPOINT = '/api/kiosk/aadhaar-scan/latest';

// Resolve full state name → stateId used by form dropdowns ("Assam" → "AS")
function resolveStateId(stateName) {
  if (!stateName) return '';
  const lower = stateName.toLowerCase().trim();
  const match = states.find(s =>
    s.name.toLowerCase() === lower ||
    (s.nameHi && s.nameHi === stateName) ||
    (s.nameAs && s.nameAs === stateName)
  );
  return match?.id || '';
}

// Resolve full city name → cityId within a given stateId ("Guwahati" → "GHY")
function resolveCityId(cityName, stateId) {
  if (!cityName || !stateId) return '';
  const lower = cityName.toLowerCase().trim();
  const stateCities = cities[stateId] || [];
  const match = stateCities.find(c =>
    c.name.toLowerCase() === lower ||
    (c.nameHi && c.nameHi === cityName) ||
    (c.nameAs && c.nameAs === cityName)
  );
  return match?.id || '';
}

/**
 * Polls the local Express backend for a decoded Aadhaar scan result from
 * scanner_service.py. Returns form-ready fields matching the shape used
 * by buildFormPrefill() in citizenProfile.js.
 *
 * Usage:
 *   const { scanning, start, stop, fields } = useAadhaarScanPrefill();
 *
 *   useEffect(() => {
 *     if (fields) setFormData(prev => ({ ...prev, ...fields }));
 *   }, [fields]);
 */
export function useAadhaarScanPrefill() {
  const [scanning, setScanning]   = useState(false);
  const [fields, setFields]       = useState(null);
  const [error, setError]         = useState(null);
  const intervalRef               = useRef(null);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setScanning(false);
  }, []);

  const start = useCallback(() => {
    setFields(null);
    setError(null);
    setScanning(true);
  }, []);

  useEffect(() => {
    if (!scanning) return;

    const poll = async () => {
      try {
        const resp = await fetch(ENDPOINT);
        if (!resp.ok) return;
        const { data } = await resp.json();
        if (!data) return;

        // Map pyaadhaar address fields → form field names
        const addr = data.address || {};
        const stateId = resolveStateId(addr.state);
        const cityId  = resolveCityId(addr.locality || addr.district, stateId);
        const formFields = {
          name:     data.name    || '',
          gender:   data.gender  || '',
          dob:      data.dob     || '',
          address:  [addr.house, addr.street, addr.locality].filter(Boolean).join(', '),
          pincode:  addr.pincode || '',
          state:    stateId,        // dropdown-compatible ID ("AS")
          city:     cityId,         // dropdown-compatible ID ("GHY")
          district: addr.district  || '',
          // mobile / email intentionally omitted — QR stores hashed values only
        };

        // Persist to sessionStorage so subsequent form pages auto-fill via
        // citizenProfile.getActiveApplicant() / buildFormPrefill()
        try {
          const existing = JSON.parse(sessionStorage.getItem('citizenData') || '{}');
          sessionStorage.setItem('citizenData', JSON.stringify({
            ...existing,
            name:    formFields.name   || existing.name,
            gender:  formFields.gender || existing.gender,
            dob:     formFields.dob    || existing.dob,
            address: {
              ...(existing.address || {}),
              house:    addr.house    || existing.address?.house    || '',
              street:   addr.street   || existing.address?.street   || '',
              landmark: addr.locality || existing.address?.landmark || '',
              district: addr.district || existing.address?.district || '',
              state:    addr.state    || existing.address?.state    || '',
              stateId,                                                   // dropdown ID
              cityId,                                                    // dropdown ID
              pincode:  addr.pincode  || existing.address?.pincode  || '',
            },
          }));
        } catch { /* sessionStorage write failure is non-fatal */ }

        setFields(formFields);
        stop();
      } catch {
        // Network/parse error — keep polling (Express may be starting up)
      }
    };

    intervalRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [scanning, stop]);

  return { scanning, start, stop, fields, error };
}

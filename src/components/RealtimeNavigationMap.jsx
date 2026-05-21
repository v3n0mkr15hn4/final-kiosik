import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';

const FALLBACK_LOCATION = { latitude: 26.1445, longitude: 91.7362 };

const OFFICE_LOCATIONS = [
  { id: 'dispur-hub', name: 'Dispur Office Hub', address: 'GS Road, Dispur', latitude: 26.1409, longitude: 91.7898 },
  { id: 'panbazar-ops', name: 'Panbazar Operations', address: 'Panbazar, Guwahati', latitude: 26.1861, longitude: 91.7485 },
  { id: 'beltola-center', name: 'Beltola Service Center', address: 'Beltola, Guwahati', latitude: 26.1116, longitude: 91.7988 }
];

const routeLayer = {
  id: 'route-line',
  type: 'line',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': '#1877f2',
    'line-width': ['interpolate', ['linear'], ['zoom'], 8, 4, 12, 6, 16, 9],
    'line-opacity': 0.95
  }
};

const UserMarker = memo(function UserMarker({ latitude, longitude }) {
  return (
    <Marker latitude={latitude} longitude={longitude} anchor="center">
      <div style={{ position: 'relative', width: 18, height: 18 }}>
        <div
          style={{
            position: 'absolute',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'rgba(37,99,235,0.34)',
            animation: 'rtPulse 1.7s ease-in-out infinite'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 4,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#2563eb',
            border: '2px solid #fff'
          }}
        />
      </div>
    </Marker>
  );
});

const DestinationMarker = memo(function DestinationMarker({ latitude, longitude }) {
  return (
    <Marker latitude={latitude} longitude={longitude} anchor="bottom">
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          background: '#dc2626',
          border: '2px solid #fff',
          boxShadow: '0 8px 18px rgba(0,0,0,0.28)'
        }}
      />
    </Marker>
  );
});

function formatDistance(km) {
  if (!Number.isFinite(km)) return '--';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatDuration(mins) {
  if (!Number.isFinite(mins)) return '--';
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}

function getBoundsFromCoordinates(coordinates) {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coordinates) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  return [[minLng, minLat], [maxLng, maxLat]];
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.98;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export default function RealtimeNavigationMap({ externalCommandRef } = {}) {
  const [userLocation, setUserLocation] = useState(FALLBACK_LOCATION);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [routeAnimationPhase, setRouteAnimationPhase] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mapRef = useRef(null);
  const wrapperRef = useRef(null);
  const watchIdRef = useRef(null);
  const routeAbortRef = useRef(null);
  const fetchDebounceRef = useRef(null);
  const lastLocationUpdateRef = useRef(0);

  const mapStyleUrl = useMemo(
    () => `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    []
  );

  const animatedRouteLayer = useMemo(
    () => ({
      ...routeLayer,
      paint: {
        ...routeLayer.paint,
        'line-dasharray': [2, 1.4 + (routeAnimationPhase % 5)]
      }
    }),
    [routeAnimationPhase]
  );

  const fetchRoute = useCallback(
    async (destination) => {
      if (!destination || !userLocation) return;

      if (routeAbortRef.current) {
        routeAbortRef.current.abort();
      }

      const controller = new AbortController();
      routeAbortRef.current = controller;
      setErrorMessage('');

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Route request failed');

        const data = await response.json();
        const route = data?.routes?.[0];
        const coordinates = route?.geometry?.coordinates;

        if (!coordinates || coordinates.length < 2) {
          throw new Error('No route geometry returned');
        }

        setRouteGeoJSON({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates }
        });

        setDistance(route.distance / 1000);
        setDuration(route.duration / 60);

        const map = mapRef.current?.getMap?.();
        const bounds = getBoundsFromCoordinates(coordinates);
        map?.fitBounds(bounds, {
          padding: { top: 80, right: 80, bottom: 80, left: 80 },
          duration: 900,
          maxZoom: 14
        });
      } catch (err) {
        if (err.name === 'AbortError') return;
        setRouteGeoJSON(null);
        setDistance(null);
        setDuration(null);
        setErrorMessage('Unable to load navigation route.');
      }
    },
    [userLocation]
  );

  const debouncedFetchRoute = useCallback(
    (destination) => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
      fetchDebounceRef.current = setTimeout(() => {
        fetchRoute(destination);
      }, 350);
    },
    [fetchRoute]
  );

  const selectDestination = useCallback(
    (office) => {
      setSelectedDestination(office);
      setNavigationStarted(false);
      debouncedFetchRoute(office);

      const map = mapRef.current?.getMap?.();
      map?.flyTo({
        center: [office.longitude, office.latitude],
        zoom: 14,
        speed: 1,
        essential: true
      });
    },
    [debouncedFetchRoute]
  );

  const startNavigation = useCallback(() => {
    if (!selectedDestination || !routeGeoJSON) return;

    setNavigationStarted(true);
    speak(
      `Navigation started. Destination ${selectedDestination.name}. ETA ${formatDuration(duration)}. Distance ${formatDistance(distance)}.`
    );
  }, [distance, duration, routeGeoJSON, selectedDestination]);

  const recenter = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    map?.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 15,
      speed: 1,
      essential: true
    });
  }, [userLocation]);

  const zoomIn = useCallback(() => mapRef.current?.getMap?.()?.zoomIn({ duration: 300 }), []);
  const zoomOut = useCallback(() => mapRef.current?.getMap?.()?.zoomOut({ duration: 300 }), []);

  const toggleFullscreen = useCallback(async () => {
    if (!wrapperRef.current) return;

    if (!document.fullscreenElement) {
      await wrapperRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      mapRef.current?.getMap?.()?.resize();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.getMap?.()?.resize();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation(FALLBACK_LOCATION);
      return;
    }

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    const onPosition = (position) => {
      const now = Date.now();
      if (now - lastLocationUpdateRef.current < 850) return;
      lastLocationUpdateRef.current = now;

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    };

    const onError = () => {
      setUserLocation(FALLBACK_LOCATION);
    };

    navigator.geolocation.getCurrentPosition(onPosition, onError, options);
    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, options);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (routeAbortRef.current) {
        routeAbortRef.current.abort();
      }
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedDestination) return;
    debouncedFetchRoute(selectedDestination);
  }, [userLocation, selectedDestination, debouncedFetchRoute]);

  useEffect(() => {
    if (!routeGeoJSON) return undefined;
    const interval = setInterval(() => setRouteAnimationPhase((v) => v + 1), 220);
    return () => clearInterval(interval);
  }, [routeGeoJSON]);

  /* ── External command bridge (sidebar → map, non-breaking) ── */
  useEffect(() => {
    if (!externalCommandRef) return;
    externalCommandRef.current = {
      flyTo: (opts) => mapRef.current?.getMap?.()?.flyTo(opts),
      navigate: (office) => selectDestination({
        id:        office.id,
        name:      office.name,
        address:   office.address,
        latitude:  office.lat,
        longitude: office.lng,
      }),
    };
  });

  return (
    <div ref={wrapperRef} className="map-container" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <style>{`@keyframes rtPulse {0%,100%{transform:scale(1);opacity:.75;}50%{transform:scale(1.25);opacity:.35;}}`}</style>
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{ longitude: 91.7362, latitude: 26.1445, zoom: 12 }}
        mapStyle={mapStyleUrl}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {routeGeoJSON ? (
          <Source id="live-route" type="geojson" data={routeGeoJSON}>
            <Layer {...animatedRouteLayer} />
          </Source>
        ) : null}

        <UserMarker latitude={userLocation.latitude} longitude={userLocation.longitude} />

        {OFFICE_LOCATIONS.map((office) => (
          <Marker key={office.id} latitude={office.latitude} longitude={office.longitude} anchor="bottom">
            <button
              type="button"
              onClick={() => selectDestination(office)}
              title={office.name}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid #fff',
                background: selectedDestination?.id === office.id ? '#1d4ed8' : '#dc2626',
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                cursor: 'pointer'
              }}
            />
          </Marker>
        ))}

        {selectedDestination ? (
          <DestinationMarker latitude={selectedDestination.latitude} longitude={selectedDestination.longitude} />
        ) : null}
      </Map>

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 4,
          minWidth: 320,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          padding: '8px 10px',
          borderRadius: 14,
          background: 'rgba(7,17,33,0.82)',
          color: '#f8fafc'
        }}
      >
        <div><span style={{ color: '#cbd5e1', fontSize: 11 }}>Distance</span><strong style={{ display: 'block' }}>{formatDistance(distance)}</strong></div>
        <div><span style={{ color: '#cbd5e1', fontSize: 11 }}>ETA</span><strong style={{ display: 'block' }}>{formatDuration(duration)}</strong></div>
        <div><span style={{ color: '#cbd5e1', fontSize: 11 }}>Voice</span><strong style={{ display: 'block' }}>On</strong></div>
      </div>

      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 4, display: 'grid', gap: 8 }}>
        <button type="button" onClick={recenter} aria-label="Locate me" style={controlStyle}>◎</button>
        <button type="button" onClick={zoomIn} aria-label="Zoom in" style={controlStyle}>+</button>
        <button type="button" onClick={zoomOut} aria-label="Zoom out" style={controlStyle}>-</button>
        <button type="button" onClick={toggleFullscreen} aria-label="Fullscreen" style={controlStyle}>{isFullscreen ? '↙' : '↗'}</button>
      </div>

      <button
        type="button"
        onClick={startNavigation}
        disabled={!selectedDestination || !routeGeoJSON}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 24,
          transform: 'translateX(-50%)',
          zIndex: 4,
          border: '1px solid #1d4ed8',
          borderRadius: 18,
          background: !selectedDestination || !routeGeoJSON ? '#94a3b8' : '#1d4ed8',
          color: '#fff',
          height: 48,
          minWidth: 220,
          padding: '0 20px',
          fontWeight: 700,
          cursor: !selectedDestination || !routeGeoJSON ? 'not-allowed' : 'pointer'
        }}
      >
        {navigationStarted ? 'Navigating' : 'Start Navigation'}
      </button>

      {errorMessage ? (
        <div
          style={{
            position: 'absolute',
            left: 16,
            bottom: 90,
            zIndex: 4,
            background: '#7f1d1d',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 12px'
          }}
        >
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}

const controlStyle = {
  width: 44,
  height: 44,
  border: 'none',
  borderRadius: 12,
  background: '#fff',
  boxShadow: '0 8px 22px rgba(0,0,0,0.15)',
  color: '#111827',
  fontSize: '1.15rem',
  cursor: 'pointer'
};

// ──────────────────────────────────────────────────────────────────
// Dashboard — Vertical Kiosk personal hub (1080×1920)
// Design source: docs/kiosk-design/designs/kiosk-pages-personal.jsx:11-101 (VDashboard)
//
// Phase 1: active requests + bills are stubbed with design mock data.
// TODO Phase 2: fetch from /api/me/dashboard, /api/me/requests, /api/me/bills.
// ──────────────────────────────────────────────────────────────────

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VK, I, ic, DD, aqiBand } from '../components/kiosk';
import useEnvironment from '../hooks/useEnvironment';

// TODO Phase 2: replace with real API data
const MOCK_ACTIVE = [
  {
    ref: 'SUV-EL-2026-018472',
    s: 'New Electricity Connection',
    step: 'Site inspection · Mar 16',
    pct: 60,
    status: 'IN PROGRESS',
    tone: 'b-warn',
    c: 'var(--dept-elec)',
    g: ic.bolt,
  },
  {
    ref: 'SUV-MN-2026-009127',
    s: 'Pothole · GS Road junction',
    step: 'Assigned to JE · Mar 14',
    pct: 35,
    status: 'ASSIGNED',
    tone: 'b-info',
    c: 'var(--dept-water)',
    g: ic.drop,
  },
];

const MOCK_DUES = [
  { dept: 'Electricity', amt: 1284, due: 'Apr 28', units: 'APDCL 12-units', c: 'var(--dept-elec)',  g: ic.bolt,  path: '/electricity' },
  { dept: 'Water',       amt: 412,  due: 'May 04', units: 'GMC W-2241',     c: 'var(--dept-water)', g: ic.drop,  path: '/water' },
  { dept: 'Gas refill',  amt: 1090, due: 'Booking', units: 'Cyl · 14.2 kg', c: 'var(--dept-gas)',   g: ic.flame, path: '/gas/bills' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const env = useEnvironment();
  const aqi = env.aqi?.value ?? 132;
  const showAqiAdvisory = aqi >= 101;

  const userName = sessionStorage.getItem('userName') || 'Citizen';
  const firstName = userName.split(' ')[0];

  const quickActions = [
    { l: 'All services',   g: ic.cog,    c: 'var(--indigo-700)',  path: '/home' },
    { l: 'File complaint', g: ic.bell,   c: 'var(--err)',         path: '/complaints' },
    { l: 'Schemes',        g: ic.star,   c: 'var(--saffron-700)', path: '/schemes' },
    { l: 'Family',         g: ic.family, c: 'var(--dept-health)', path: '/family-profile' },
  ];

  return (
    <VK bg="var(--cream)">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 22,
      }}>
        <div>
          <div className="label-tag" style={{ color: 'var(--saffron-700)' }}>
            স্বাগতম · WELCOME BACK
          </div>
          <h1 className="h2" style={{ marginTop: 8 }}>Hello, {firstName}</h1>
          <p className="body-l" style={{ marginTop: 6 }}>
            You have{' '}
            <strong style={{ color: 'var(--indigo-700)' }}>
              {MOCK_ACTIVE.length} active requests
            </strong>{' '}
            and{' '}
            <strong style={{ color: 'var(--err)' }}>
              {MOCK_DUES.length} bills due
            </strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="badge b-info">
            <I d={ic.dot} size={10} /> SESSION · 04:21
          </span>
        </div>
      </div>

      {showAqiAdvisory && (
        <div className="card" style={{
          padding: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 18,
          borderColor: 'oklch(0.74 0.15 75)',
          background: 'color-mix(in oklab, var(--warn) 10%, white)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'oklch(0.74 0.15 75)', color: 'white',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <I d={ic.leaf} size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'oklch(0.45 0.12 75)' }}>
              Air quality is {aqiBand(aqi).label} today
            </div>
            <div className="meta" style={{ marginTop: 2 }}>
              Sensitive groups should reduce prolonged outdoor exertion. Source: CPCB · {env.city}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ minHeight: 56, fontSize: 16, padding: '14px 22px' }}
            onClick={() => navigate('/healthcare')}
          >
            Health tips
          </button>
        </div>
      )}

      {/* Active requests */}
      <div className="label-tag" style={{ marginBottom: 12 }}>YOUR ACTIVE REQUESTS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {MOCK_ACTIVE.map((a) => (
          <button
            key={a.ref}
            type="button"
            onClick={() => navigate('/track-status')}
            className="card"
            style={{
              padding: 22,
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              borderLeft: `6px solid ${a.c}`,
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit',
              color: 'inherit',
            }}
          >
            <DD color={a.c} glyph={a.g} size={72} isz={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--indigo-900)' }}>{a.s}</div>
                <span className={`badge ${a.tone}`} style={{ fontSize: 11 }}>{a.status}</span>
              </div>
              <div className="meta" style={{ fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {a.ref} · {a.step}
              </div>
              <div style={{
                height: 8,
                background: 'var(--surface-2)',
                borderRadius: 4,
                marginTop: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${a.pct}%`,
                  background: a.c,
                  borderRadius: 4,
                }} />
              </div>
            </div>
            <I d={ic.arrow} size={32} />
          </button>
        ))}
      </div>

      {/* Bills due */}
      <div className="label-tag" style={{ marginBottom: 12 }}>BILLS DUE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
        {MOCK_DUES.map((d) => (
          <div
            key={d.dept}
            className="card"
            style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <DD color={d.c} glyph={d.g} size={56} isz={28} />
              <span className="label-tag">DUE {d.due}</span>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 30,
                fontWeight: 800,
                color: 'var(--indigo-900)',
                letterSpacing: '-0.02em',
              }}>
                ₹ {d.amt.toLocaleString('en-IN')}
              </div>
              <div className="meta" style={{ marginTop: 2 }}>{d.dept} · {d.units}</div>
            </div>
            <button
              type="button"
              className="btn btn-pri"
              style={{ minHeight: 60, fontSize: 18, padding: '14px 20px' }}
              onClick={() => navigate(d.path)}
            >
              Pay <I d={ic.arrow} size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="label-tag" style={{ marginBottom: 12 }}>QUICK ACTIONS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {quickActions.map((q) => (
          <button
            key={q.l}
            type="button"
            onClick={() => navigate(q.path)}
            className="card"
            style={{
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 12,
              cursor: 'pointer',
              minHeight: 130,
              textAlign: 'left',
              font: 'inherit',
              color: 'inherit',
            }}
          >
            <DD color={q.c} glyph={q.g} size={56} isz={28} />
            <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--indigo-900)' }}>{q.l}</div>
          </button>
        ))}
      </div>
    </VK>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, Gauge, CreditCard, MessageSquare, UserCog, FileText, Search } from 'lucide-react';
import { GasIcon } from '../assets/icons';
import { VK, I, ic } from '../components/kiosk';

const GasMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const services = [
    {
      id: 'newConnection',
      LucideIcon: PlusCircle,
      title: t('home.gasNewConnection', 'New Connection / Connection Change'),
      description: t('home.gasNewConnectionDesc', 'New gas, reconnect, disconnect, prepaid conversion, pipeline'),
      path: '/gas?category=newConnection',
      color: '#dc2626',
      bg: 'color-mix(in oklab, #dc2626 12%, white)',
    },
    {
      id: 'meterDamage',
      LucideIcon: Gauge,
      title: t('home.gasMeterDamage', 'Meter Malfunction / Damage'),
      description: t('home.gasMeterDamageDesc', 'Report meter issues and request replacements'),
      path: '/gas?category=meterDamage',
      color: '#e11d48',
      bg: 'color-mix(in oklab, #e11d48 12%, white)',
    },
    {
      id: 'bills',
      LucideIcon: CreditCard,
      title: t('home.gasBills', 'Check / View Bills'),
      description: t('home.gasBillsDesc', 'View current and past gas bills'),
      path: '/gas/bills',
      color: '#be185d',
      bg: 'color-mix(in oklab, #be185d 12%, white)',
    },
    {
      id: 'complaint',
      LucideIcon: MessageSquare,
      title: t('home.gasComplaint', 'Register Complaint'),
      description: t('home.gasComplaintDesc', 'File gas-related grievances with voice input'),
      path: '/gas/complaint',
      color: '#b91c1c',
      bg: 'color-mix(in oklab, #b91c1c 12%, white)',
    },
    {
      id: 'track',
      LucideIcon: Search,
      title: t('home.gasTrack', 'Track Complaint / Request'),
      description: t('home.gasTrackDesc', 'Check real-time status of your requests'),
      path: '/track-status',
      color: '#475569',
      bg: 'color-mix(in oklab, #475569 12%, white)',
    },
    {
      id: 'profile',
      LucideIcon: UserCog,
      title: t('home.gasProfile', 'Edit Credentials / Profile'),
      description: t('home.gasProfileDesc', 'Update your consumer information'),
      path: '/consumer-profile?org=gas',
      color: '#0369a1',
      bg: 'color-mix(in oklab, #0369a1 12%, white)',
    },
  ];

  return (
    <VK bg="color-mix(in oklab, #dc2626 4%, white)">
      {/* Dept header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f87171, #be123c)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, boxShadow: '0 8px 32px rgba(190,18,60,0.3)',
        }}>
          <GasIcon size={60} color="#fff" />
        </div>
        <h1 className="h2" style={{ marginBottom: 10 }}>
          {t('home.gasDept', 'Assam Gas Department')}
        </h1>
        <p className="body-l" style={{ color: 'var(--ink-500)' }}>
          {t('home.gasDeptDesc', 'Gas connections · Bills · Complaints · Maintenance')}
        </p>
      </div>

      {/* Service grid — 3 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        {services.map((s) => {
          const Icon = s.LucideIcon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => navigate(s.path)}
              className="tile"
              style={{
                minHeight: 260,
                padding: 32,
                alignItems: 'flex-start',
                textAlign: 'left',
                gap: 20,
                borderTop: `6px solid ${s.color}`,
                touchAction: 'manipulation',
              }}
              aria-label={s.title}
            >
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: s.bg, display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <Icon size={36} style={{ color: s.color }} strokeWidth={2} />
              </div>
              <div className="nm" style={{ fontSize: 26, lineHeight: 1.3 }}>{s.title}</div>
              <div className="sub" style={{ fontSize: 20, marginTop: 'auto' }}>{s.description}</div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-quiet"
        style={{ alignSelf: 'center', fontSize: 22, padding: '18px 48px' }}
        onClick={() => navigate('/home')}
      >
        <I d={ic.back} size={24} /> {t('home.backToOrgs', 'Back to Organizations')}
      </button>
    </VK>
  );
};

export default GasMenu;

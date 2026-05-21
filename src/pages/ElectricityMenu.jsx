import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, Gauge, MessageSquare, UserCog, Search, FileText } from 'lucide-react';
import { ElectricityIcon, TrackIcon } from '../assets/icons';
import { VK, DD, I, ic } from '../components/kiosk';

const ElectricityMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const mainServices = [
    {
      id: 'newConnection',
      LucideIcon: PlusCircle,
      title: t('home.elecNewConnection', 'New Connection & Load Extension'),
      description: t('home.elecNewConnectionDesc', 'Apply for new electricity connection or load change'),
      path: '/electricity?category=newConnection',
      color: '#d97706',
      bg: 'color-mix(in oklab, #d97706 12%, white)',
    },
    {
      id: 'meterIssue',
      LucideIcon: Gauge,
      title: t('home.elecMeterService', 'Meter Replacement & Shifting'),
      description: t('home.elecMeterServiceDesc', 'Report meter malfunction, damage, or shifting'),
      path: '/electricity?category=meterIssue',
      color: '#b45309',
      bg: 'color-mix(in oklab, #b45309 12%, white)',
    },
    {
      id: 'complaint',
      LucideIcon: MessageSquare,
      title: t('home.elecComplaint', 'Register Complaint'),
      description: t('home.elecComplaintDesc', 'File electricity-specific grievances'),
      path: '/electricity/complaint',
      color: '#ea580c',
      bg: 'color-mix(in oklab, #ea580c 12%, white)',
    },
    {
      id: 'profile',
      LucideIcon: UserCog,
      title: t('home.elecProfile', 'Update Consumer Info'),
      description: t('home.elecProfileDesc', 'Update credentials and consumer details'),
      path: '/consumer-profile?org=electricity',
      color: '#0369a1',
      bg: 'color-mix(in oklab, #0369a1 12%, white)',
    },
    {
      id: 'track',
      LucideIcon: Search,
      title: t('home.elecTrack', 'Track Request / Complaint'),
      description: t('home.elecTrackDesc', 'Check real-time status of your requests'),
      path: '/track-status',
      color: '#475569',
      bg: 'color-mix(in oklab, #475569 12%, white)',
    },
    {
      id: 'receipt',
      LucideIcon: FileText,
      title: t('home.elecReceipt', 'View Receipts'),
      description: t('home.elecReceiptDesc', 'View and print transaction receipts'),
      path: '/receipt?org=electricity',
      color: '#059669',
      bg: 'color-mix(in oklab, #059669 12%, white)',
    },
  ];

  return (
    <VK bg="color-mix(in oklab, #d97706 4%, white)">
      {/* Dept header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, boxShadow: '0 8px 32px rgba(234,88,12,0.3)',
        }}>
          <ElectricityIcon size={60} color="#fff" />
        </div>
        <h1 className="h2" style={{ marginBottom: 10 }}>
          {t('home.electricityDept', 'Electricity Department')}
        </h1>
        <p className="body-l" style={{ color: 'var(--ink-500)' }}>
          {t('home.electricityDeptDesc', 'New connections · Meter services · Complaints · Billing')}
        </p>
      </div>

      {/* Service grid — 3 cols for kiosk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        {mainServices.map((s) => {
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

export default ElectricityMenu;

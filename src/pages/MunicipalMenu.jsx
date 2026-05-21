import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Droplets, MessageSquare, Building2, UserCog, FileText, Search } from 'lucide-react';
import { MunicipalIcon } from '../assets/icons';
import { VK, I, ic } from '../components/kiosk';

const MunicipalMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const services = [
    {
      id: 'waterConnection',
      LucideIcon: Droplets,
      title: t('home.muniWater', 'New Water Connection / Upgrade'),
      description: t('home.muniWaterDesc', 'Apply for water connection or upgrade existing'),
      path: '/municipal?category=waterConnection',
      color: '#4338ca',
      bg: 'color-mix(in oklab, #4338ca 12%, white)',
    },
    {
      id: 'grievance',
      LucideIcon: MessageSquare,
      title: t('home.muniGrievance', 'Register Municipal Grievances'),
      description: t('home.muniGrievanceDesc', 'Water, sewage, garbage, streetlight, roads & more'),
      path: '/municipal/grievance',
      color: '#7c3aed',
      bg: 'color-mix(in oklab, #7c3aed 12%, white)',
    },
    {
      id: 'propertyTax',
      LucideIcon: Building2,
      title: t('municipal.propertyTax', 'Property Tax Payment'),
      description: t('home.muniPropertyTaxDesc', 'Look up and pay your property tax online'),
      path: '/municipal/property-tax',
      color: '#6d28d9',
      bg: 'color-mix(in oklab, #6d28d9 12%, white)',
    },
    {
      id: 'track',
      LucideIcon: Search,
      title: t('home.muniTrack', 'Track Request / Complaint'),
      description: t('home.muniTrackDesc', 'Monitor status of submitted applications'),
      path: '/track-status',
      color: '#475569',
      bg: 'color-mix(in oklab, #475569 12%, white)',
    },
    {
      id: 'receipt',
      LucideIcon: FileText,
      title: t('home.muniReceipt', 'Receipt Generation'),
      description: t('home.muniReceiptDesc', 'View and print transaction receipts'),
      path: '/receipt?org=municipal',
      color: '#059669',
      bg: 'color-mix(in oklab, #059669 12%, white)',
    },
    {
      id: 'profile',
      LucideIcon: UserCog,
      title: t('home.muniProfile', 'Update Profile / Credentials'),
      description: t('home.muniProfileDesc', 'Update consumer details and contact info'),
      path: '/consumer-profile?org=municipal',
      color: '#0369a1',
      bg: 'color-mix(in oklab, #0369a1 12%, white)',
    },
  ];

  return (
    <VK bg="color-mix(in oklab, #4338ca 4%, white)">
      {/* Dept header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'linear-gradient(135deg, #818cf8, #7c3aed)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
        }}>
          <MunicipalIcon size={60} color="#fff" />
        </div>
        <h1 className="h2" style={{ marginBottom: 10 }}>
          {t('home.municipalDept', 'Municipal Department')}
        </h1>
        <p className="body-l" style={{ color: 'var(--ink-500)' }}>
          {t('home.municipalDeptDesc', 'Water connections · Grievances · Municipal services')}
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

export default MunicipalMenu;

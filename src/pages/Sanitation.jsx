import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, Droplets, AlertTriangle, UserCog, Search, FileText } from 'lucide-react';
import { Button, Input, Select, TextArea, Modal, LoadingSpinner } from '../components';
import { VK, I, ic } from '../components/kiosk';
import { SanitationIcon } from '../assets/icons';
import QRUpload from '../components/QRUpload';
import { states, cities, wards } from '../utils/constants';
import { generateRequestId, getCurrentTimestamp } from '../utils/helpers';
import { addReceipt } from '../utils/receipts';
import { serviceAPI } from '../utils/apiService';

const Sanitation = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    mobile: sessionStorage.getItem('userMobile') || '',
    email: '',
    state: '',
    city: '',
    ward: '',
    address: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const mainServices = [
    {
      id: 'wastePickup',
      LucideIcon: Trash2,
      title: t('sanitation.wastePickup', 'Waste Pickup Request'),
      description: t('home.sanitationWasteDesc', 'Schedule household or commercial waste collection'),
      color: '#059669',
      bg: 'color-mix(in oklab, #059669 12%, white)',
    },
    {
      id: 'drainageCleaning',
      LucideIcon: Droplets,
      title: t('sanitation.drainageCleaning', 'Drainage Cleaning'),
      description: t('home.sanitationDrainageDesc', 'Report blocked or overflowing drainage lines'),
      color: '#0891b2',
      bg: 'color-mix(in oklab, #0891b2 12%, white)',
    },
    {
      id: 'sewageIssue',
      LucideIcon: AlertTriangle,
      title: t('sanitation.sewageIssue', 'Sewage Issue'),
      description: t('home.sanitationSewageDesc', 'Report sewage overflow or pipeline damage'),
      color: '#d97706',
      bg: 'color-mix(in oklab, #d97706 12%, white)',
    },
    {
      id: '_profile',
      LucideIcon: UserCog,
      title: t('home.sanitationProfile', 'Update Profile'),
      description: t('home.sanitationProfileDesc', 'Update credentials and sanitation details'),
      path: '/consumer-profile?org=sanitation',
      color: '#0369a1',
      bg: 'color-mix(in oklab, #0369a1 12%, white)',
    },
    {
      id: '_track',
      LucideIcon: Search,
      title: t('home.sanitationTrack', 'Track Request'),
      description: t('home.sanitationTrackDesc', 'Check real-time status of your requests'),
      path: '/track-status',
      color: '#475569',
      bg: 'color-mix(in oklab, #475569 12%, white)',
    },
    {
      id: '_receipt',
      LucideIcon: FileText,
      title: t('home.sanitationReceipt', 'View Receipts'),
      description: t('home.sanitationReceiptDesc', 'View and print transaction receipts'),
      path: '/receipt?org=sanitation',
      color: '#65a30d',
      bg: 'color-mix(in oklab, #65a30d 12%, white)',
    },
  ];

  const getLocalizedName = (item) => {
    if (i18n.language === 'hi' && item.nameHi) return item.nameHi;
    if (i18n.language === 'ta' && item.nameTa) return item.nameTa;
    return item.name;
  };

  const availableCities = formData.state ? cities[formData.state] || [] : [];
  const availableWards = formData.city ? wards[formData.city] || wards.default : [];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'state') setFormData(prev => ({ ...prev, city: '', ward: '' }));
    if (field === 'city') setFormData(prev => ({ ...prev, ward: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('errors.required');
    if (!formData.mobile.trim()) newErrors.mobile = t('errors.required');
    if (!formData.state) newErrors.state = t('errors.required');
    if (!formData.city) newErrors.city = t('errors.required');
    if (!formData.ward) newErrors.ward = t('errors.required');
    if (!formData.address.trim()) newErrors.address = t('errors.required');
    if (!formData.description.trim()) newErrors.description = t('errors.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      let requestId;
      try {
        const result = await serviceAPI.submit({
          serviceType: 'sanitation',
          serviceCategory: selectedCategory,
          citizenName: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          state: formData.state,
          city: formData.city,
          ward: formData.ward,
          address: formData.address,
          description: formData.description,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          aadhaarUid: sessionStorage.getItem('aadhaarUid'),
        });
        requestId = result.requestId;
      } catch {
        requestId = generateRequestId();
      }
      const receiptData = {
        requestId,
        citizenName: formData.name,
        mobile: formData.mobile,
        serviceType: 'sanitation',
        serviceCategory: t(`sanitation.${selectedCategory}`),
        timestamp: getCurrentTimestamp(),
        status: 'submitted',
      };
      addReceipt(receiptData);
      navigate(`/receipt?org=${encodeURIComponent(receiptData.serviceType)}&id=${encodeURIComponent(receiptData.requestId)}`);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <VK bg="color-mix(in oklab, #059669 4%, white)">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" message={t('app.loading')} />
        </div>
      </VK>
    );
  }

  return (
    <VK bg="color-mix(in oklab, #059669 4%, white)">
      {step === 1 ? (
        <>
          {/* Dept header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, boxShadow: '0 8px 32px rgba(5,150,105,0.3)',
            }}>
              <SanitationIcon size={60} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 10 }}>
              {t('sanitation.title', 'Sanitation Department')}
            </h1>
            <p className="body-l" style={{ color: 'var(--ink-500)' }}>
              {t('sanitation.subtitle', 'Waste Pickup · Drainage · Sewage · Street Cleaning')}
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
                  onClick={() => {
                    if (s.path) {
                      navigate(s.path);
                    } else {
                      setSelectedCategory(s.id);
                      setStep(2);
                    }
                  }}
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
        </>
      ) : (
        /* Service Request Form */
        <div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12, boxShadow: '0 4px 16px rgba(5,150,105,0.25)',
            }}>
              <SanitationIcon size={40} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 6 }}>
              {t('sanitation.title', 'Sanitation Department')}
            </h1>
          </div>

          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <div className="mb-6 p-4 bg-green-50 rounded-kiosk border border-green-200">
              <p className="text-kiosk-base font-semibold text-green-800">
                Selected: {t(`sanitation.${selectedCategory}`)}
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={t('form.name')} value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder={t('form.enterName')} error={errors.name} required />
                <Input label={t('form.mobile')} type="tel" value={formData.mobile} onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder={t('form.enterMobile')} error={errors.mobile} required />
              </div>

              <Input label={t('form.email')} type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder={t('form.enterEmail')} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select label={t('form.state')} value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)} placeholder={t('form.selectState')} options={states.map(s => ({ value: s.id, label: getLocalizedName(s) }))} error={errors.state} required />
                <Select label={t('form.city')} value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} placeholder={t('form.selectCity')} options={availableCities.map(c => ({ value: c.id, label: getLocalizedName(c) }))} error={errors.city} required disabled={!formData.state} />
                <Select label={t('form.ward')} value={formData.ward} onChange={(e) => handleInputChange('ward', e.target.value)} placeholder={t('form.selectWard')} options={availableWards.map(w => ({ value: w.id, label: w.name }))} error={errors.ward} required disabled={!formData.city} />
              </div>

              <Input label={t('form.address')} value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder={t('form.enterAddress')} error={errors.address} required />
              <TextArea label={t('form.description')} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder={t('form.enterDescription')} error={errors.description} required rows={4} maxLength={500} />
              <QRUpload label={t('form.uploadDocuments')} onUploadComplete={(uploadedFiles) => setFiles(uploadedFiles)} maxFiles={5} />

              <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
                <Button variant="secondary" onClick={() => setStep(1)} size="large">{t('app.back')}</Button>
                <Button onClick={handleSubmit} size="xlarge">{t('app.submit')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} type="confirm" title={t('modal.confirmTitle')} message={t('modal.confirmMessage')} confirmText={t('app.confirm')} cancelText={t('app.cancel')} onConfirm={handleConfirmSubmit} onCancel={() => setShowConfirmModal(false)} />
    </VK>
  );
};

export default Sanitation;

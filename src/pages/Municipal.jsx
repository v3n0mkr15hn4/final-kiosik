import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, Search, FileText, UserCog } from 'lucide-react';
import {
  Header,
  Button,
  Input,
  Select,
  TextArea,
  Modal,
  LoadingSpinner,
  PageContainer,
  DepartmentHeader,
  SectionTitle,
  ServiceCard,
  UtilityCard,
  ResponsiveGrid,
  ActionButton
} from '../components';
import { VK } from '../components/kiosk';
import { MunicipalIcon } from '../assets/icons';
import QRUpload from '../components/QRUpload';
import { states, cities, wards, serviceCategories } from '../utils/constants';
import { generateRequestId, getCurrentTimestamp } from '../utils/helpers';
import { addReceipt } from '../utils/receipts';
import { serviceAPI } from '../utils/apiService';

/**
 * Municipal Corporation Services page
 * Covers property tax, birth/death certificates, building permits, trade licenses, etc.
 */
const Municipal = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDeepLinkedCategory, setIsDeepLinkedCategory] = useState(false);
  const [searchParams] = useSearchParams();

  // Auto-select category from URL params
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory) {
      const validCategory = serviceCategories.municipal.find(c => c.id === urlCategory);
      if (validCategory) {
        setSelectedCategory(urlCategory);
        setStep(2);
        setIsDeepLinkedCategory(true);
        return;
      }
    }

    setIsDeepLinkedCategory(false);
  }, [searchParams]);
  const [formData, setFormData] = useState({
    name: '',
    mobile: sessionStorage.getItem('userMobile') || '',
    email: '',
    propertyId: '',
    aadhaarLast4: '',
    state: '',
    city: '',
    ward: '',
    address: '',
    description: '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const categories = serviceCategories.municipal;

  const theme = {
    gradient: 'from-indigo-500 via-violet-500 to-purple-600',
    softGradient: 'from-indigo-50 via-indigo-100 to-violet-100',
    accentClass: 'text-indigo-600',
    darkIcon: '#4338ca',
  };

  const utilityServices = [
    {
      id: 'track',
      title: t('home.muniTrack', 'Track Request / Complaint'),
      description: t('home.muniTrackDesc', 'Monitor status of submitted applications'),
      path: '/track-status',
      Icon: Search,
    },
    {
      id: 'profile',
      title: t('home.muniProfile', 'Update Profile / Credentials'),
      description: t('home.muniProfileDesc', 'Update consumer details and contact info'),
      path: '/consumer-profile?org=municipal',
      Icon: UserCog,
    },
    {
      id: 'receipt',
      title: t('home.muniReceipt', 'Receipt Generation'),
      description: t('home.muniReceiptDesc', 'View and print transaction receipts'),
      path: '/receipt?org=municipal',
      Icon: FileText,
    },
  ];

  const getLocalizedName = (item) => {
    if (i18n.language === 'hi' && item.nameHi) return item.nameHi;
    if (i18n.language === 'as' && item.nameAs) return item.nameAs;
    if (i18n.language === 'ta' && item.nameTa) return item.nameTa;
    return item.name;
  };

  const availableCities = formData.state ? cities[formData.state] || [] : [];
  const availableWards = formData.city ? wards[formData.city] || wards.default : [];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'state') {
      setFormData(prev => ({ ...prev, city: '', ward: '' }));
    }
    if (field === 'city') {
      setFormData(prev => ({ ...prev, ward: '' }));
    }
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
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const handleFormBack = () => {
    if (isDeepLinkedCategory) {
      navigate('/municipal-menu');
      return;
    }

    setStep(1);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      let requestId;
      try {
        const result = await serviceAPI.submit({
          serviceType: 'municipal',
          serviceCategory: selectedCategory,
          citizenName: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          propertyId: formData.propertyId,
          state: formData.state,
          city: formData.city,
          ward: formData.ward,
          address: formData.address,
          description: formData.description,
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
        serviceType: 'municipal',
        serviceCategory: t(`municipal.${selectedCategory}`),
        timestamp: getCurrentTimestamp(),
        status: 'submitted',
        sla: '14 working days',
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
      <VK bg="color-mix(in oklab, #4338ca 4%, white)">
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" message={t('app.loading')} />
        </div>
      </VK>
    );
  }

  return (
    <VK bg="color-mix(in oklab, #4338ca 4%, white)">
      

      <div>
        <DepartmentHeader
          title={t('municipal.title')}
          subtitle={t('municipal.subtitle')}
          icon={MunicipalIcon}
          iconProps={{ size: 40, color: '#ffffff' }}
          gradient="from-indigo-500 to-purple-600"
        />

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-government-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
            1
          </div>
          <div className={`w-20 h-1 ${step >= 2 ? 'bg-government-blue' : 'bg-gray-200'}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-government-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
        </div>

        {step === 1 ? (
          <>
            <SectionTitle title={t('form.selectCategory')} className="mb-4" />
            <ResponsiveGrid variant="services" className="mb-8">
              {categories.map((category) => (
                <ServiceCard
                  key={category.id}
                  title={t(category.key)}
                  icon={MunicipalIcon}
                  iconProps={{ size: 28, color: '#ffffff' }}
                  gradient={theme.gradient}
                  selected={selectedCategory === category.id}
                  badge={selectedCategory === category.id ? t('app.selected', 'Selected') : undefined}
                  onClick={() => setSelectedCategory(category.id)}
                  accessibilityLabel={t(category.key)}
                />
              ))}
            </ResponsiveGrid>

            <SectionTitle
              title={t('home.utilitiesHistory', 'Utilities & History')}
              icon={UserCog}
              accentClass={theme.accentClass}
              className="mb-4"
            />
            <ResponsiveGrid variant="utilities" className="mb-8">
              {utilityServices.map((service) => (
                <UtilityCard
                  key={service.id}
                  title={service.title}
                  description={service.description}
                  icon={service.Icon}
                  iconProps={{ className: 'w-6 h-6 text-indigo-700' }}
                  gradient={theme.softGradient}
                  onClick={() => navigate(service.path)}
                  accessibilityLabel={service.title}
                />
              ))}
            </ResponsiveGrid>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <ActionButton
                variant="outline"
                onClick={() => navigate('/home')}
                icon={ArrowLeft}
              >
                {t('home.backToOrgs', 'Back to Home')}
              </ActionButton>
              <ActionButton
                onClick={() => setStep(2)}
                disabled={!selectedCategory}
                icon={ArrowRight}
                iconPosition="right"
                variant="primary"
              >
                {t('app.next')}
              </ActionButton>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <div className="mb-6 p-4 bg-indigo-50 rounded-kiosk border border-indigo-200">
              <p className="text-kiosk-base font-semibold text-indigo-800">
                Selected: {t(`municipal.${selectedCategory}`)}
              </p>
            </div>

            <div className="space-y-6">
              {selectedCategory === 'waterConnection' && (
                <div className="p-4 bg-indigo-50 rounded-kiosk border border-indigo-200">
                  <h3 className="text-kiosk-base font-bold text-indigo-800 mb-4">Water Connection Details (SRS Module 17)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Select label={t('municipal.connectionType')} value={formData.waterConnectionType || ''} onChange={e => handleInputChange('waterConnectionType', e.target.value)} options={[{value:'domestic',label:'🏠 Domestic (Household)'},{value:'commercial',label:'🏢 Commercial'},{value:'industrial',label:'🏭 Industrial'},{value:'institutional',label:'🏫 Institutional/Govt'},{value:'upgrade',label:'⬆️ Upgrade Existing'}]} placeholder={t('municipal.selectConnectionType')} required />
                    <Select label={t('municipal.pipeSize')} value={formData.pipeSize || ''} onChange={e => handleInputChange('pipeSize', e.target.value)} options={[{value:'0.5inch',label:'½ inch (Standard domestic)'},{value:'1inch',label:'1 inch (Small commercial)'},{value:'2inch',label:'2 inch (Large commercial)'},{value:'3inch',label:'3 inch+ (Industrial)'}]} placeholder={t('municipal.selectPipeSize')} />
                    <Input label={t('municipal.plotArea')} type="number" value={formData.plotArea || ''} onChange={e => handleInputChange('plotArea', e.target.value)} placeholder="e.g. 1500" />
                    <Input label={t('municipal.numberOfFloors')} type="number" value={formData.floorCount || ''} onChange={e => handleInputChange('floorCount', e.target.value)} placeholder="e.g. 3" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('form.name')}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('form.enterName')}
                  error={errors.name}
                  required
                />
                <Input
                  label={t('form.mobile')}
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={t('form.enterMobile')}
                  error={errors.mobile}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('form.email')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('form.enterEmail')}
                />
                <Input
                  label={t('municipal.propertyId')}
                  value={formData.propertyId}
                  onChange={(e) => handleInputChange('propertyId', e.target.value)}
                  placeholder={t('municipal.enterPropertyId')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select
                  label={t('form.state')}
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder={t('form.selectState')}
                  options={states.map(s => ({ value: s.id, label: getLocalizedName(s) }))}
                  error={errors.state}
                  required
                />
                <Select
                  label={t('form.city')}
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder={t('form.selectCity')}
                  options={availableCities.map(c => ({ value: c.id, label: getLocalizedName(c) }))}
                  error={errors.city}
                  required
                  disabled={!formData.state}
                />
                <Select
                  label={t('form.ward')}
                  value={formData.ward}
                  onChange={(e) => handleInputChange('ward', e.target.value)}
                  placeholder={t('form.selectWard')}
                  options={availableWards.map(w => ({ value: w.id, label: w.name }))}
                  error={errors.ward}
                  required
                  disabled={!formData.city}
                />
              </div>

              <Input
                label={t('form.address')}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('form.enterAddress')}
                error={errors.address}
                required
              />

              <TextArea
                label={t('form.description')}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('form.enterDescription')}
                error={errors.description}
                required
                rows={4}
                maxLength={500}
              />

              <QRUpload
                label={t('form.uploadDocuments')}
                onUploadComplete={(uploadedFiles) => setFiles(uploadedFiles)}
                maxFiles={5}
              />

              <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
                <Button
                  variant="secondary"
                  onClick={handleFormBack}
                  size="large"
                >
                  {t('app.back')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  size="xlarge"
                >
                  {t('app.submit')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        type="confirm"
        title={t('modal.confirmTitle')}
        message={t('modal.confirmMessage')}
        confirmText={t('app.confirm')}
        cancelText={t('app.cancel')}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmModal(false)}
      />
    </VK>
  );
};

export default Municipal;

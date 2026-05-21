import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, ArrowRight, ArrowLeft, Search, FileText, UserCog } from 'lucide-react';
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
import { SanitationIcon } from '../assets/icons';
import QRUpload from '../components/QRUpload';
import { states, cities, wards, serviceCategories } from '../utils/constants';
import { generateRequestId, getCurrentTimestamp } from '../utils/helpers';
import { addReceipt } from '../utils/receipts';
import { serviceAPI } from '../utils/apiService';

/**
 * Sanitation Services page
 */
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

  const categories = serviceCategories.sanitation;

  const theme = {
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    softGradient: 'from-emerald-50 via-emerald-100 to-teal-100',
    accentClass: 'text-emerald-600',
  };

  const utilityServices = [
    {
      id: 'profile',
      title: 'Edit Credentials / Profile',
      description: 'Update your sanitation profile and details',
      path: '/consumer-profile?org=sanitation',
      Icon: UserCog,
    },
    {
      id: 'track',
      title: 'Track Request / Complaint',
      description: 'Check real-time status of your requests',
      path: '/track-status',
      Icon: Search,
    },
    {
      id: 'receipt',
      title: 'View Receipts',
      description: 'View and print transaction receipts',
      path: '/receipt?org=sanitation',
      Icon: FileText,
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
      <PageContainer tone="sanitation">
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" message={t('app.loading')} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer tone="sanitation">
      

      <div>
        <DepartmentHeader
          title={t('sanitation.title')}
          subtitle={t('sanitation.subtitle')}
          icon={SanitationIcon}
          iconProps={{ size: 40, color: '#ffffff' }}
          gradient="from-emerald-500 to-green-600"
        />

        {step === 1 ? (
          <>
            <SectionTitle title={t('form.selectCategory')} className="mb-4" />
            <ResponsiveGrid variant="services" className="mb-8">
              {categories.map((category) => (
                <ServiceCard
                  key={category.id}
                  title={t(category.key)}
                  icon={SanitationIcon}
                  iconProps={{ size: 28, color: '#ffffff' }}
                  gradient={theme.gradient}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setStep(2);
                  }}
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
                  iconProps={{ className: 'w-6 h-6 text-emerald-700' }}
                  gradient={theme.softGradient}
                  onClick={() => navigate(service.path)}
                  accessibilityLabel={service.title}
                />
              ))}
            </ResponsiveGrid>

            <div className="mt-8 text-center">
              <ActionButton
                variant="outline"
                size="large"
                icon={ArrowLeft}
                onClick={() => navigate('/home')}
              >
                {t('home.backToOrgs', 'Back to Home')}
              </ActionButton>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <div className="mb-6 p-4 bg-green-50 rounded-kiosk border border-green-200">
              <p className="text-kiosk-base font-semibold text-green-800">
                Selected: {t(`sanitation.${selectedCategory}`)}
              </p>
            </div>

            <div className="space-y-6">
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

              <Input
                label={t('form.email')}
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('form.enterEmail')}
              />

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
                  onClick={() => setStep(1)}
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
    </PageContainer>
  );
};

export default Sanitation;

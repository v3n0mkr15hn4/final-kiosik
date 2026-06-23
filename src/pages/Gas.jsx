import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import {
  Header,
  Button,
  Card,
  Input,
  Select,
  TextArea,
  Modal,
  LoadingSpinner
} from '../components';
import { VK } from '../components/kiosk';
import QRUpload from '../components/QRUpload';
import { states, cities, wards, serviceCategories } from '../utils/constants';
import { generateRequestId, getCurrentTimestamp } from '../utils/helpers';
import { addReceipt } from '../utils/receipts';
import { serviceAPI } from '../utils/apiService';

/**
 * Gas Services page
 */
const Gas = () => {
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
      const validCategory = serviceCategories.gas.find(c => c.id === urlCategory);
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
    consumerNumber: '',
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

  const categories = serviceCategories.gas;

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
      navigate('/gas-menu');
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
          serviceType: 'gas',
          serviceCategory: selectedCategory,
          citizenName: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          consumerNumber: formData.consumerNumber,
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
        serviceType: 'gas',
        serviceCategory: t(`gas.${selectedCategory}`),
        timestamp: getCurrentTimestamp(),
        status: 'submitted',
        sla: '10 working days',
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
      <VK bg="var(--surface-1)">
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" message={t('app.loading')} />
        </div>
      </VK>
    );
  }

  return (
    <VK bg="var(--surface-1)">
      

      <div>
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-kiosk-2xl md:text-kiosk-3xl font-bold text-government-blue">
            {t('gas.title')}
          </h1>
          <p className="text-kiosk-lg text-gray-600 mt-2">
            {t('gas.subtitle')}
          </p>
        </div>

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
          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <h2 className="text-kiosk-xl font-bold text-gray-800 mb-6 text-center">
              {t('form.selectCategory')}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  title={t(category.key)}
                  selected={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  size="medium"
                  className="text-center"
                />
              ))}
            </div>

            <div className="mt-8 flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/home')}
                size="large"
                icon={ArrowLeft}
              >
                {t('home.backToOrgs', 'Back to Home')}
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedCategory}
                size="xlarge"
                icon={ArrowRight}
                iconPosition="right"
              >
                {t('app.next')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <div className="mb-6 p-4 bg-red-50 rounded-kiosk border border-red-200">
              <p className="text-kiosk-base font-semibold text-red-800">
                Selected: {t(`gas.${selectedCategory}`)}
              </p>
            </div>

            <div className="space-y-6">
              {/* Gas New Connection — sub-type selector (SRS Module 11) */}
              {selectedCategory === 'newConnection' && (
                <div className="p-4 bg-red-50 rounded-kiosk border border-red-200">
                  <h3 className="text-kiosk-base font-bold text-red-800 mb-4">Request Type</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'new_gas', label: '🔥 New Gas Connection', sla: '30 days' },
                      { id: 'reconnect', label: '🔄 Reconnection', sla: '7 days' },
                      { id: 'disconnect', label: '⛔ Disconnection', sla: '3 days' },
                      { id: 'prepaid', label: '💳 Postpaid → Prepaid', sla: '15 days' },
                      { id: 'pipeline', label: '🔧 Pipeline Inspection', sla: '5 days' },
                      { id: 'maintenance', label: '🛠️ Maintenance Schedule', sla: '7 days' },
                    ].map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleInputChange('gasSubType', sub.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all touch-manipulation ${formData.gasSubType === sub.id ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 hover:border-red-200'}`}
                      >
                        <div className="font-bold text-sm text-gray-800">{sub.label}</div>
                        <div className="text-xs text-gray-500 mt-1">SLA: {sub.sla}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meter Damage — severity + type */}
              {selectedCategory === 'meterDamage' && (
                <div className="p-4 bg-rose-50 rounded-kiosk border border-rose-200">
                  <h3 className="text-kiosk-base font-bold text-rose-800 mb-4">Meter Issue Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label={t('gas.issueType')}
                      value={formData.meterIssueType || ''}
                      onChange={e => handleInputChange('meterIssueType', e.target.value)}
                      options={[
                        { value: 'damaged', label: 'Physically Damaged' },
                        { value: 'malfunctioning', label: 'Showing Wrong Readings' },
                        { value: 'leaking', label: 'Gas Leaking at Meter' },
                        { value: 'installation', label: 'New Meter Installation' },
                        { value: 'replacement', label: 'Replacement Required' },
                      ]}
                      placeholder={t('gas.selectIssueType')}
                      required
                    />
                    <Select
                      label={t('gas.priority')}
                      value={formData.priority || ''}
                      onChange={e => handleInputChange('priority', e.target.value)}
                      options={[
                        { value: 'emergency', label: '🔴 Emergency — Gas Leak (24h)' },
                        { value: 'urgent', label: '🟡 Urgent (3 days)' },
                        { value: 'normal', label: '🟢 Normal (10 days)' },
                      ]}
                      placeholder={t('gas.selectPriority')}
                    />
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
                  label={t('gas.consumerNumber', 'CA Number / Legacy Number')}
                  value={formData.consumerNumber}
                  onChange={(e) => handleInputChange('consumerNumber', e.target.value)}
                  placeholder={t('gas.enterConsumerNumber', 'Enter CA Number or Legacy Number')}
                />
                <p className="text-sm text-gray-500 mt-1">{t('gas.caNumberHint', 'Your Consumer Account (CA) number is printed on your gas bill')}</p>
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

export default Gas;

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, ArrowLeft, ArrowRight, FileWarning, Gauge, Ban, HelpCircle, Flame } from 'lucide-react';
import { startSTT, stopSTT } from '../ai/voice/speechRecognition';
import { useVoiceFormSubmit } from '../hooks/useVoiceFormSubmit';
import {
  Button,
  Input,
  Select,
  TextArea,
  Modal,
  LoadingSpinner,
} from '../components';
import { VK } from '../components/kiosk';
import QRUpload from '../components/QRUpload';
import { states, cities, wards } from '../utils/constants';
import { generateComplaintId, getCurrentTimestamp } from '../utils/helpers';
import { addReceipt } from '../utils/receipts';
import { serviceAPI } from '../utils/apiService';

/**
 * Gas Complaint Registration — with voice input support (SRS requirement)
 */
const GasComplaint = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');

  const gasComplaintCategories = [
    { id: 'billing', label: t('gasComplaint.billing', 'Incorrect Gas Bill'), icon: FileWarning, color: 'bg-amber-100 text-amber-700 border-amber-300', sla: '7 working days' },
    { id: 'gasleak', label: t('gasComplaint.gasleak', 'Gas Leak / Safety Issue'), icon: Flame, color: 'bg-red-100 text-red-700 border-red-300', sla: '24 hours (Emergency)' },
    { id: 'meter', label: t('gasComplaint.meterIssue', 'Meter Damage / Malfunction'), icon: Gauge, color: 'bg-purple-100 text-purple-700 border-purple-300', sla: '10 working days' },
    { id: 'disconnection', label: t('gasComplaint.disconnection', 'Disconnection Without Notice'), icon: Ban, color: 'bg-orange-100 text-orange-700 border-orange-300', sla: '3 working days' },
    { id: 'other', label: t('gasComplaint.other', 'Other Grievance'), icon: HelpCircle, color: 'bg-gray-100 text-gray-700 border-gray-300', sla: '14 working days' },
  ];

  const selectedCategoryData = gasComplaintCategories.find(c => c.id === selectedCategory);

  const [formData, setFormData] = useState({
    name: sessionStorage.getItem('userName') || '',
    mobile: sessionStorage.getItem('userMobile') || '',
    email: '',
    caNumber: '',
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
  const [isRecording, setIsRecording] = useState(false);

  const STT_LANG_MAP = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', gu: 'gu-IN', bn: 'bn-IN', or: 'or-IN', pa: 'pa-IN', as: 'as-IN' };
  const sttLangCode = STT_LANG_MAP[(i18n.language || 'en').split('-')[0]] || 'hi-IN';

  useVoiceFormSubmit('gas_complaint', () => { if (step === 2) handleSubmit(); });

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
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'state') setFormData(prev => ({ ...prev, city: '', ward: '' }));
    if (field === 'city') setFormData(prev => ({ ...prev, ward: '' }));
  };

  const toggleVoiceInput = useCallback(() => {
    if (isRecording) {
      stopSTT();
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
    startSTT({
      language: sttLangCode,
      continuous: false,
      autoRestart: false,
      onResult: (text) => {
        setFormData(prev => ({ ...prev, description: prev.description ? `${prev.description} ${text}` : text }));
        setIsRecording(false);
      },
      onInterim: () => {},
      onError: () => setIsRecording(false),
    });
  }, [isRecording, sttLangCode]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('errors.required');
    if (!formData.mobile.trim()) newErrors.mobile = t('errors.required');
    if (!formData.state) newErrors.state = t('errors.required');
    if (!formData.city) newErrors.city = t('errors.required');
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
      let ticketId;
      try {
        const result = await serviceAPI.submit({
          serviceType: 'gas',
          serviceCategory: 'complaint',
          citizenName: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          consumerNumber: formData.caNumber,
          state: formData.state,
          city: formData.city,
          ward: formData.ward,
          address: formData.address,
          description: formData.description,
          aadhaarUid: sessionStorage.getItem('aadhaarUid'),
        });
        ticketId = result.requestId;
      } catch {
        ticketId = generateComplaintId();
      }

      const receiptData = {
        requestId: ticketId,
        citizenName: formData.name,
        mobile: formData.mobile,
        serviceType: 'gas',
        serviceCategory: selectedCategoryData ? `Gas Complaint: ${selectedCategoryData.label}` : t('gasComplaint.title', 'Gas Complaint'),
        timestamp: getCurrentTimestamp(),
        status: 'submitted',
        sla: selectedCategoryData?.sla || '7 working days',
      };

      addReceipt(receiptData);
      navigate(`/receipt?org=${encodeURIComponent(receiptData.serviceType)}&id=${encodeURIComponent(receiptData.requestId)}`);
    } catch (error) {
      console.error('Gas complaint error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <VK bg="color-mix(in oklab, #dc2626 4%, white)">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <LoadingSpinner size="large" message={t('app.loading')} />
        </div>
      </VK>
    );
  }

  return (
    <VK bg="color-mix(in oklab, #dc2626 4%, white)">
      <div>
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-kiosk-2xl md:text-kiosk-3xl font-bold text-gray-800">
            {t('gasComplaint.title', 'Gas Complaint Registration')}
          </h1>
          <p className="text-kiosk-lg text-gray-600 mt-2">
            {t('gasComplaint.subtitle', 'Register your gas-related grievance')}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`w-20 h-1 ${step >= 2 ? 'bg-red-500' : 'bg-gray-200'}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>

        {/* Step 1 — Category selection */}
        {step === 1 && (
          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <h2 className="text-kiosk-xl font-bold text-gray-800 mb-6 text-center">
              {t('gasComplaint.selectCategory', 'Select Complaint Category')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gasComplaintCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all touch-manipulation ${selectedCategory === cat.id ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 hover:border-red-200 hover:bg-red-50/50'}`}
                  aria-label={cat.label}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${cat.color} border`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-kiosk-base font-bold text-gray-800">{cat.label}</div>
                    <div className="text-xs text-gray-500 mt-1">SLA: {cat.sla}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={() => navigate('/home')} size="large" icon={ArrowLeft}>
                {t('home.backToOrgs', 'Back')}
              </Button>
              <Button onClick={() => setStep(2)} disabled={!selectedCategory} size="xlarge" icon={ArrowRight} iconPosition="right">
                {t('app.next', 'Next')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Form */}
        {step === 2 && (
        <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
          {/* SLA Banner */}
          <div className="mb-6 p-4 bg-red-50 rounded-kiosk border border-red-200">
            <p className="text-kiosk-sm font-semibold text-red-800">
              {selectedCategoryData?.label} — SLA: {selectedCategoryData?.sla}
            </p>
            <p className="text-kiosk-sm text-red-700 mt-1">
              ⏱️ {t('gasComplaint.slaNotice', 'Response time as per SLA guidelines')}
            </p>
          </div>

          <div className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('form.name')}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('form.enterName')}
                error={errors.name}
                required
                voiceField="name"
              />
              <Input
                label={t('form.mobile')}
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder={t('form.enterMobile')}
                error={errors.mobile}
                required
                voiceField="mobile"
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
                label={t('gasComplaint.caNumber', 'Consumer Account (CA) Number')}
                value={formData.caNumber}
                onChange={(e) => handleInputChange('caNumber', e.target.value)}
                placeholder={t('gasComplaint.enterCA', 'Enter CA number')}
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select
                label={t('form.state')}
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder={t('form.selectState')}
                options={states.map(s => ({ value: s.id, label: getLocalizedName(s) }))}
                error={errors.state}
                required
                voiceField="state"
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
                voiceField="city"
              />
              <Select
                label={t('form.ward')}
                value={formData.ward}
                onChange={(e) => handleInputChange('ward', e.target.value)}
                placeholder={t('form.selectWard')}
                options={availableWards.map(w => ({ value: w.id, label: w.name }))}
                disabled={!formData.city}
                voiceField="ward"
              />
            </div>

            <Input
              label={t('form.address')}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder={t('form.enterAddress')}
            />

            {/* Description with Voice Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-kiosk-base font-semibold text-gray-700">
                  {t('form.description')} <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={toggleVoiceInput}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  {isRecording
                    ? t('gasComplaint.stopRecording', 'Stop Recording')
                    : t('gasComplaint.voiceInput', 'Voice Input')
                  }
                </button>
              </div>
              {isRecording && (
                <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-kiosk text-sm text-red-700 animate-pulse">
                  🎤 {t('gasComplaint.recording', 'Listening... Speak now')}
                </div>
              )}
              <TextArea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('gasComplaint.descPlaceholder', 'Describe your complaint or use voice input')}
                error={errors.description}
                rows={5}
                maxLength={1000}
                voiceField="description"
              />
            </div>

            <QRUpload
              label={t('form.uploadDocuments')}
              onUploadComplete={(uploadedFiles) => setFiles(uploadedFiles)}
              maxFiles={5}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
              <Button variant="secondary" onClick={() => setStep(1)} size="large" icon={ArrowLeft}>
                {t('app.back', 'Back')}
              </Button>
              <Button onClick={handleSubmit} size="xlarge">
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

export default GasComplaint;

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Droplets,
  Waves,
  Trash2,
  Lightbulb,
  AlertTriangle,
  Beaker,
  Landmark,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Mic,
  MicOff,
} from 'lucide-react';
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
import { serviceAPI } from '../utils/apiService';
import { addReceipt } from '../utils/receipts';

/**
 * Municipal Grievance Registration — 8 SRS-defined categories
 */
const MunicipalGrievance = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    name: sessionStorage.getItem('userName') || '',
    mobile: sessionStorage.getItem('userMobile') || '',
    email: '',
    state: '',
    city: '',
    ward: '',
    specificLocation: '',
    description: '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const toggleVoiceInput = useCallback(() => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input not supported. Use Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    const langMap = { en: 'en-IN', hi: 'hi-IN', as: 'as-IN', ta: 'ta-IN', bn: 'bn-IN' };
    recognition.lang = langMap[i18n.language] || 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join(' ');
      setFormData(prev => ({ ...prev, description: prev.description ? `${prev.description} ${transcript}` : transcript }));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    setIsRecording(true);
  }, [isRecording, i18n.language]);

  const grievanceCategories = [
    { id: 'waterDisruption', label: t('muniGrievance.waterDisruption', 'Water Supply Disruption'), icon: Droplets, color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { id: 'sewageOverflow', label: t('muniGrievance.sewageOverflow', 'Sewage Overflow or Blockage'), icon: Waves, color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { id: 'garbageIssue', label: t('muniGrievance.garbageIssue', 'Garbage Collection Irregularity'), icon: Trash2, color: 'bg-green-100 text-green-700 border-green-300' },
    { id: 'streetlightFailure', label: t('muniGrievance.streetlightFailure', 'Streetlight Failure'), icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { id: 'roadDamage', label: t('muniGrievance.roadDamage', 'Road Damage and Potholes'), icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-300' },
    { id: 'waterQuality', label: t('muniGrievance.waterQuality', 'Water Quality Complaints'), icon: Beaker, color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
    { id: 'propertyTaxError', label: t('muniGrievance.propertyTaxError', 'Property Tax Errors'), icon: Landmark, color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { id: 'otherMunicipal', label: t('muniGrievance.otherMunicipal', 'Other Municipal Issues'), icon: HelpCircle, color: 'bg-gray-100 text-gray-700 border-gray-300' },
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
          serviceType: 'municipal',
          serviceCategory: `grievance_${selectedCategory}`,
          citizenName: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          state: formData.state,
          city: formData.city,
          ward: formData.ward,
          address: formData.specificLocation,
          description: formData.description,
          aadhaarUid: sessionStorage.getItem('aadhaarUid'),
        });
        ticketId = result.requestId;
      } catch {
        ticketId = generateComplaintId();
      }

      const catLabel = grievanceCategories.find(c => c.id === selectedCategory)?.label || selectedCategory;
      const receiptData = {
        requestId: ticketId,
        citizenName: formData.name,
        mobile: formData.mobile,
        serviceType: 'municipal',
        serviceCategory: `Grievance: ${catLabel}`,
        timestamp: getCurrentTimestamp(),
        status: 'submitted',
        sla: '10 working days',
      };

      addReceipt(receiptData);
      navigate(`/receipt?org=${encodeURIComponent(receiptData.serviceType)}&id=${encodeURIComponent(receiptData.requestId)}`);
    } catch (error) {
      console.error('Municipal grievance error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <VK bg="color-mix(in oklab, #4338ca 4%, white)">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <LoadingSpinner size="large" message={t('app.loading')} />
        </div>
      </VK>
    );
  }

  return (
    <VK bg="color-mix(in oklab, #4338ca 4%, white)">
      <div>
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-kiosk-2xl md:text-kiosk-3xl font-bold text-gray-800">
            {t('muniGrievance.title', 'Municipal Grievance Registration')}
          </h1>
          <p className="text-kiosk-lg text-gray-600 mt-2">
            {t('muniGrievance.subtitle', 'Report municipal service issues')}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`w-20 h-1 ${step >= 2 ? 'bg-indigo-500' : 'bg-gray-200'}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>

        {step === 1 ? (
          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <h2 className="text-kiosk-xl font-bold text-gray-800 mb-6 text-center">
              {t('muniGrievance.selectCategory', 'Select Grievance Category')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {grievanceCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all touch-manipulation
                    ${selectedCategory === cat.id
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50'
                    }
                  `}
                  aria-label={cat.label}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${cat.color} border`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-kiosk-base font-bold text-gray-800">{cat.label}</h3>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate('/home')}
                size="large"
                icon={ArrowLeft}
              >
                {t('home.backToOrgs', 'Back to Home')}
              </Button>
              <Button onClick={() => setStep(2)} disabled={!selectedCategory} size="xlarge" icon={ArrowRight} iconPosition="right">
                {t('app.next')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <div className="mb-6 p-4 bg-indigo-50 rounded-kiosk border border-indigo-200">
              <p className="text-kiosk-base font-semibold text-indigo-800">
                  Category: {grievanceCategories.find(c => c.id === selectedCategory)?.label}
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={t('form.name')} value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder={t('form.enterName')} error={errors.name} required />
                <Input label={t('form.mobile')} type="tel" value={formData.mobile} onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder={t('form.enterMobile')} error={errors.mobile} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select label={t('form.state')} value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)} placeholder={t('form.selectState')} options={states.map(s => ({ value: s.id, label: getLocalizedName(s) }))} error={errors.state} required />
                <Select label={t('form.city')} value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} placeholder={t('form.selectCity')} options={availableCities.map(c => ({ value: c.id, label: getLocalizedName(c) }))} error={errors.city} required disabled={!formData.state} />
                <Select label={t('form.ward')} value={formData.ward} onChange={(e) => handleInputChange('ward', e.target.value)} placeholder={t('form.selectWard')} options={availableWards.map(w => ({ value: w.id, label: w.name }))} disabled={!formData.city} />
              </div>

              <Input
                label={t('muniGrievance.specificLocation', 'Specific Location / Landmark')}
                value={formData.specificLocation}
                onChange={(e) => handleInputChange('specificLocation', e.target.value)}
                placeholder={t('muniGrievance.enterLocation', 'e.g., Near ABC Junction, Main Road')}
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-kiosk-base font-semibold text-gray-700">
                    {t('form.description')} <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={toggleVoiceInput}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-manipulation ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                    aria-label={isRecording ? 'Stop voice recording' : 'Start voice input'}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {isRecording ? t('gasComplaint.stopRecording', 'Stop Recording') : t('gasComplaint.voiceInput', 'Voice Input')}
                  </button>
                </div>
                {isRecording && (
                  <div className="mb-2 p-3 bg-indigo-50 border border-indigo-200 rounded-kiosk text-sm text-indigo-700 animate-pulse">
                    🎤 {t('gasComplaint.recording', 'Listening… Speak now')}
                  </div>
                )}
                <TextArea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder={t('form.enterDescription')} error={errors.description} rows={4} maxLength={1000} />
              </div>

              <QRUpload label={t('form.uploadDocuments')} onUploadComplete={(uploadedFiles) => setFiles(uploadedFiles)} maxFiles={5} />

              <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
                <Button variant="secondary" onClick={() => setStep(1)} size="large">{t('app.back')}</Button>
                <Button onClick={handleSubmit} size="xlarge">{t('app.submit')}</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} type="confirm" title={t('modal.confirmTitle')} message={t('modal.confirmMessage')} confirmText={t('app.confirm')} cancelText={t('app.cancel')} onConfirm={handleConfirmSubmit} onCancel={() => setShowConfirmModal(false)} />
    </VK>
  );
};

export default MunicipalGrievance;

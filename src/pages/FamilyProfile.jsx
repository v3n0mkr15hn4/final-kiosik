import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Save, X, Baby, Heart, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button, Input, Modal, PageContainer, DepartmentHeader } from '../components';
import { VK } from '../components/kiosk';
import DependentCard from '../components/DependentCard';

/**
 * Family Profile & Dependent Management Page
 * - Add/edit/remove dependents (child, elderly parent)
 * - Stored in sessionStorage
 * - Dependents are used by Scheme Discovery for eligibility
 */
const FamilyProfile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || 'en';
  const userName = sessionStorage.getItem('userName') || 'Citizen';

  // Load dependents from sessionStorage
  const [dependents, setDependents] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('familyDependents') || '[]');
    } catch {
      return [];
    }
  });

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'child',
    age: '',
    gender: 'Male',
    aadhaar: '',
    disability: '',
  });
  const [formError, setFormError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Persist dependents to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('familyDependents', JSON.stringify(dependents));
  }, [dependents]);

  const resetForm = () => {
    setFormData({ name: '', relationship: 'child', age: '', gender: 'Male', aadhaar: '', disability: '' });
    setEditingId(null);
    setFormError('');
    setShowForm(false);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) return lang === 'hi' ? 'नाम आवश्यक है' : lang === 'ta' ? 'பெயர் தேவை' : 'Name is required';
    if (!formData.age || isNaN(formData.age) || formData.age < 0 || formData.age > 120)
      return lang === 'hi' ? 'मान्य आयु दर्ज करें' : lang === 'ta' ? 'சரியான வயதை உள்ளிடவும்' : 'Enter a valid age';
    if (formData.relationship === 'child' && parseInt(formData.age) > 18)
      return lang === 'hi' ? 'बच्चे की आयु 18 या उससे कम होनी चाहिए' : lang === 'ta' ? 'குழந்தையின் வயது 18 அல்லது அதற்கும் குறைவாக இருக்க வேண்டும்' : 'Child must be 18 or younger';
    if (formData.relationship === 'elderly_parent' && parseInt(formData.age) < 55)
      return lang === 'hi' ? 'वृद्ध माता-पिता की आयु 55+ होनी चाहिए' : lang === 'ta' ? 'முதியோர் பெற்றோர் வயது 55+ இருக்க வேண்டும்' : 'Elderly parent must be 55+';
    if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar))
      return lang === 'hi' ? 'मान्य 12 अंक का आधार दर्ज करें' : lang === 'ta' ? 'சரியான 12 இலக்க ஆதார் உள்ளிடவும்' : 'Enter valid 12-digit Aadhaar';
    return null;
  };

  const handleSave = () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const entry = {
      ...formData,
      age: parseInt(formData.age),
      id: editingId || `dep-${Date.now()}`,
    };

    if (editingId) {
      setDependents((prev) => prev.map((d) => (d.id === editingId ? entry : d)));
    } else {
      setDependents((prev) => [...prev, entry]);
    }

    resetForm();
  };

  const handleEdit = (dep) => {
    setFormData({
      name: dep.name,
      relationship: dep.relationship,
      age: dep.age.toString(),
      gender: dep.gender,
      aadhaar: dep.aadhaar || '',
      disability: dep.disability || '',
    });
    setEditingId(dep.id);
    setShowForm(true);
  };

  const handleRemove = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmRemove = () => {
    setDependents((prev) => prev.filter((d) => d.id !== deleteTargetId));
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const children = dependents.filter((d) => d.relationship === 'child');
  const parents = dependents.filter((d) => d.relationship === 'elderly_parent');

  return (
    <PageContainer tone="family">
      

      <div>
        <DepartmentHeader
          title={t('familyProfile.title')}
          subtitle={t('familyProfile.subtitle')}
          icon={Users}
          iconProps={{ className: 'w-8 h-8 text-white' }}
          gradient="from-blue-600 to-indigo-600"
        />



        {/* Primary citizen info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-government-blue flex items-center justify-center text-white font-bold text-lg">
            {userName[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <p className="font-bold text-government-blue">{userName}</p>
            <p className="text-xs text-blue-600">
              {lang === 'hi' ? 'प्राथमिक नागरिक (आधार सत्यापित)' : lang === 'ta' ? 'முதன்மை குடிமகன் (ஆதார் சரிபார்க்கப்பட்டது)' : 'Primary Citizen (Aadhaar Verified)'}
            </p>
          </div>
        </div>

        {/* Add Dependent Button */}
        {!showForm && (
          <div className="mb-6">
            <Button onClick={() => setShowForm(true)} icon={Plus} size="large" fullWidth>
              {t('familyProfile.addDependent')}
            </Button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-kiosk p-6 mb-8 border-2 border-violet-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-kiosk-lg font-bold text-gray-800">
                {editingId ? t('familyProfile.editDependent') : t('familyProfile.addNewDependent')}
              </h2>
              <button onClick={resetForm} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('form.name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder={lang === 'hi' ? 'नाम दर्ज करें' : lang === 'ta' ? 'பெயரை உள்ளிடுங்கள்' : 'Enter full name'}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('familyProfile.relationship')} *
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) => handleFormChange('relationship', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base"
                >
                  <option value="child">
                    {lang === 'hi' ? 'बच्चा' : lang === 'ta' ? 'குழந்தை' : 'Child'}
                  </option>
                  <option value="elderly_parent">
                    {lang === 'hi' ? 'वृद्ध माता-पिता' : lang === 'ta' ? 'முதியோர் பெற்றோர்' : 'Elderly Parent'}
                  </option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {lang === 'hi' ? 'आयु' : lang === 'ta' ? 'வயது' : 'Age'} *
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleFormChange('age', e.target.value)}
                  placeholder={lang === 'hi' ? 'आयु' : lang === 'ta' ? 'வயது' : 'Age'}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('schemes.gender')}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleFormChange('gender', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base"
                >
                  <option value="Male">{lang === 'hi' ? 'पुरुष' : lang === 'ta' ? 'ஆண்' : 'Male'}</option>
                  <option value="Female">{lang === 'hi' ? 'महिला' : lang === 'ta' ? 'பெண்' : 'Female'}</option>
                  <option value="Other">{lang === 'hi' ? 'अन्य' : lang === 'ta' ? 'மற்றவை' : 'Other'}</option>
                </select>
              </div>

              {/* Aadhaar (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {lang === 'hi' ? 'आधार नंबर (वैकल्पिक)' : lang === 'ta' ? 'ஆதார் எண் (விருப்பம்)' : 'Aadhaar Number (Optional)'}
                </label>
                <input
                  type="text"
                  value={formData.aadhaar}
                  onChange={(e) => handleFormChange('aadhaar', e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={12}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base"
                />
              </div>

              {/* Disability (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {lang === 'hi' ? 'विकलांगता (वैकल्पिक)' : lang === 'ta' ? 'ஊனம் (விருப்பம்)' : 'Disability (Optional)'}
                </label>
                <select
                  value={formData.disability}
                  onChange={(e) => handleFormChange('disability', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base"
                >
                  <option value="">{lang === 'hi' ? 'कोई नहीं' : lang === 'ta' ? 'எதுவுமில்லை' : 'None'}</option>
                  <option value="visual">{lang === 'hi' ? 'दृष्टि' : lang === 'ta' ? 'பார்வை' : 'Visual'}</option>
                  <option value="physical">{lang === 'hi' ? 'शारीरिक' : lang === 'ta' ? 'உடல்' : 'Physical'}</option>
                  <option value="hearing">{lang === 'hi' ? 'श्रवण' : lang === 'ta' ? 'செவிப்புலன்' : 'Hearing'}</option>
                  <option value="intellectual">{lang === 'hi' ? 'बौद्धिक' : lang === 'ta' ? 'அறிவுசார்' : 'Intellectual'}</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {formError && (
              <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{formError}</span>
              </div>
            )}

            {/* Save */}
            <div className="flex space-x-4">
              <Button onClick={handleSave} icon={Save} size="large" fullWidth>
                {editingId
                  ? (lang === 'hi' ? 'अपडेट करें' : lang === 'ta' ? 'புதுப்பிக்கவும்' : 'Update Dependent')
                  : (lang === 'hi' ? 'जोड़ें' : lang === 'ta' ? 'சேர்க்கவும்' : 'Save Dependent')}
              </Button>
              <Button onClick={resetForm} variant="outline" size="large">
                {t('app.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Dependents List */}
        {dependents.length === 0 && !showForm ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-kiosk-base text-gray-400 font-medium">
              {t('familyProfile.noDependents')}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {t('familyProfile.noDependentsHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Children */}
            {children.length > 0 && (
              <div>
                <div className="flex items-center mb-3">
                  <Baby className="w-5 h-5 text-pink-500 mr-2" />
                  <h2 className="text-kiosk-base font-bold text-gray-800">
                    {lang === 'hi' ? 'बच्चे' : lang === 'ta' ? 'குழந்தைகள்' : 'Children'} ({children.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {children.map((dep) => (
                    <DependentCard key={dep.id} dependent={dep} lang={lang} onEdit={handleEdit} onRemove={handleRemove} />
                  ))}
                </div>
              </div>
            )}

            {/* Elderly Parents */}
            {parents.length > 0 && (
              <div>
                <div className="flex items-center mb-3">
                  <Heart className="w-5 h-5 text-amber-500 mr-2" />
                  <h2 className="text-kiosk-base font-bold text-gray-800">
                    {lang === 'hi' ? 'वृद्ध माता-पिता' : lang === 'ta' ? 'முதியோர் பெற்றோர்' : 'Elderly Parents'} ({parents.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parents.map((dep) => (
                    <DependentCard key={dep.id} dependent={dep} lang={lang} onEdit={handleEdit} onRemove={handleRemove} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schemes hint */}
        {dependents.length > 0 && (
          <div className="mt-8 bg-violet-50 border border-violet-200 rounded-xl p-4">
            <p className="text-sm text-violet-700">
              💡 {t('familyProfile.schemesHint')}
            </p>
          </div>
        )}
      </div>

      {/* Back to Home Button */}
      <div className="flex justify-center py-6">
        <Button
          variant="outline"
          size="large"
          icon={ArrowLeft}
          onClick={() => navigate('/home')}
        >
          {t('home.backToOrgs', 'Back to Home')}
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="warning"
        title={lang === 'hi' ? 'हटाने की पुष्टि करें' : lang === 'ta' ? 'நீக்குவதை உறுதிப்படுத்தவும்' : 'Confirm Removal'}
        message={lang === 'hi' ? 'क्या आप इस आश्रित को हटाना चाहते हैं?' : lang === 'ta' ? 'இந்த சார்புடையவரை நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to remove this dependent?'}
        confirmText={lang === 'hi' ? 'हटाएं' : lang === 'ta' ? 'நீக்கு' : 'Remove'}
        cancelText={t('app.cancel')}
        onConfirm={confirmRemove}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Footer */}
      <footer className="bg-government-blue text-white py-4 mt-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm opacity-80">© 2026 SUVIDHA — {t('app.subtitle')}</p>
        </div>
      </footer>
    </PageContainer>
  );
};

export default FamilyProfile;

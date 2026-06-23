import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Baby, Heart, Users, Sparkles, Search, FileText, Plus, Save, X, AlertCircle } from 'lucide-react';
import { Button, Input, Modal } from '../components';
import { VK, I, ic } from '../components/kiosk';
import { FamilyIcon } from '../assets/icons';
import DependentCard from '../components/DependentCard';

const FamilyProfile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || 'en';
  const userName = sessionStorage.getItem('userName') || 'Citizen';

  const [view, setView] = useState('menu'); // 'menu' | 'manage'

  const [dependents, setDependents] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('familyDependents') || '[]');
    } catch {
      return [];
    }
  });

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

  useEffect(() => {
    sessionStorage.setItem('familyDependents', JSON.stringify(dependents));
  }, [dependents]);

  const menuCards = [
    {
      id: 'addChild',
      LucideIcon: Baby,
      title: t('familyProfile.addChildTitle'),
      description: t('familyProfile.addChildDesc'),
      color: '#ec4899',
      bg: 'color-mix(in oklab, #ec4899 12%, white)',
    },
    {
      id: 'addParent',
      LucideIcon: Heart,
      title: t('familyProfile.addParentTitle'),
      description: t('familyProfile.addParentDesc'),
      color: '#f59e0b',
      bg: 'color-mix(in oklab, #f59e0b 12%, white)',
    },
    {
      id: 'viewFamily',
      LucideIcon: Users,
      title: t('familyProfile.viewFamilyTitle'),
      description: t('familyProfile.viewFamilyDesc'),
      color: '#0369a1',
      bg: 'color-mix(in oklab, #0369a1 12%, white)',
    },
    {
      id: 'schemes',
      LucideIcon: Sparkles,
      title: t('familyProfile.schemesTitle'),
      description: t('familyProfile.schemesDesc'),
      path: '/schemes',
      color: '#7c3aed',
      bg: 'color-mix(in oklab, #7c3aed 12%, white)',
    },
    {
      id: 'track',
      LucideIcon: Search,
      title: t('familyProfile.trackTitle'),
      description: t('familyProfile.trackDesc'),
      path: '/track-status',
      color: '#475569',
      bg: 'color-mix(in oklab, #475569 12%, white)',
    },
    {
      id: 'receipt',
      LucideIcon: FileText,
      title: t('familyProfile.receiptTitle'),
      description: t('familyProfile.receiptDesc'),
      path: '/receipt',
      color: '#059669',
      bg: 'color-mix(in oklab, #059669 12%, white)',
    },
  ];

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
    if (!formData.name.trim()) return t('familyProfile.nameRequired');
    if (!formData.age || isNaN(formData.age) || formData.age < 0 || formData.age > 120)
      return t('familyProfile.enterValidAge');
    if (formData.relationship === 'child' && parseInt(formData.age) > 18)
      return t('familyProfile.childAgeLimit');
    if (formData.relationship === 'elderly_parent' && parseInt(formData.age) < 55)
      return t('familyProfile.elderlyAgeLimit');
    if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar))
      return t('familyProfile.enterValidAadhaar');
    return null;
  };

  const handleSave = () => {
    const error = validateForm();
    if (error) { setFormError(error); return; }
    const entry = { ...formData, age: parseInt(formData.age), id: editingId || `dep-${Date.now()}` };
    if (editingId) {
      setDependents((prev) => prev.map((d) => (d.id === editingId ? entry : d)));
    } else {
      setDependents((prev) => [...prev, entry]);
    }
    resetForm();
  };

  const handleEdit = (dep) => {
    setFormData({ name: dep.name, relationship: dep.relationship, age: dep.age.toString(), gender: dep.gender, aadhaar: dep.aadhaar || '', disability: dep.disability || '' });
    setEditingId(dep.id);
    setShowForm(true);
  };

  const handleRemove = (id) => { setDeleteTargetId(id); setShowDeleteModal(true); };

  const confirmRemove = () => {
    setDependents((prev) => prev.filter((d) => d.id !== deleteTargetId));
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const children = dependents.filter((d) => d.relationship === 'child');
  const parents = dependents.filter((d) => d.relationship === 'elderly_parent');

  return (
    <VK bg="color-mix(in oklab, #3b82f6 4%, white)">

      {/* ── MENU LANDING ── */}
      {view === 'menu' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
            }}>
              <FamilyIcon size={60} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 10 }}>
              {t('familyProfile.title', 'Family Profile')}
            </h1>
            <p className="body-l" style={{ color: 'var(--ink-500)' }}>
              {t('familyProfile.subtitle', 'Manage dependents · Children · Elderly parents · Scheme benefits')}
            </p>
          </div>

          {/* Service grid — 3 cols for kiosk */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
            {menuCards.map((s) => {
              const Icon = s.LucideIcon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.path) {
                      navigate(s.path);
                    } else if (s.id === 'addChild') {
                      setFormData(f => ({ ...f, relationship: 'child' }));
                      setShowForm(true);
                      setView('manage');
                    } else if (s.id === 'addParent') {
                      setFormData(f => ({ ...f, relationship: 'elderly_parent' }));
                      setShowForm(true);
                      setView('manage');
                    } else {
                      setView('manage');
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
      )}

      {/* ── MANAGE VIEW ── */}
      {view === 'manage' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12, boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
            }}>
              <FamilyIcon size={40} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 6 }}>
              {t('familyProfile.title', 'Family Profile')}
            </h1>
          </div>

          {/* Primary citizen info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-government-blue flex items-center justify-center text-white font-bold text-lg">
              {userName[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <p className="font-bold text-government-blue">{userName}</p>
              <p className="text-xs text-blue-600">
                {t('familyProfile.primaryCitizen')}
              </p>
            </div>
          </div>

          {/* Add Dependent Button */}
          {!showForm && (
            <div className="mb-6">
              <Button onClick={() => setShowForm(true)} icon={Plus} size="large" fullWidth>
                {t('familyProfile.addDependent', 'Add Dependent')}
              </Button>
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-kiosk p-6 mb-8 border-2 border-violet-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-kiosk-lg font-bold text-gray-800">
                  {editingId ? t('familyProfile.editDependent', 'Edit Dependent') : t('familyProfile.addNewDependent', 'Add New Dependent')}
                </h2>
                <button onClick={resetForm} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('form.name')} *</label>
                  <input type="text" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder={t('familyProfile.enterFullName')}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('familyProfile.relationship')} *</label>
                  <select value={formData.relationship} onChange={(e) => handleFormChange('relationship', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base">
                    <option value="child">{t('familyProfile.child')}</option>
                    <option value="elderly_parent">{t('familyProfile.elderlyParent')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t('familyProfile.age')} *
                  </label>
                  <input type="number" min="0" max="120" value={formData.age} onChange={(e) => handleFormChange('age', e.target.value)}
                    placeholder={t('familyProfile.age')}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('schemes.gender')}</label>
                  <select value={formData.gender} onChange={(e) => handleFormChange('gender', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base">
                    <option value="Male">{t('familyProfile.male')}</option>
                    <option value="Female">{t('familyProfile.female')}</option>
                    <option value="Other">{t('familyProfile.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t('familyProfile.aadhaarOptional')}
                  </label>
                  <input type="text" value={formData.aadhaar}
                    onChange={(e) => handleFormChange('aadhaar', e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder={t('familyProfile.aadhaarPlaceholder')} maxLength={12}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t('familyProfile.disabilityOptional')}
                  </label>
                  <select value={formData.disability} onChange={(e) => handleFormChange('disability', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-government-blue focus:ring-2 focus:ring-blue-200 text-base">
                    <option value="">{t('familyProfile.none')}</option>
                    <option value="visual">{t('familyProfile.visual')}</option>
                    <option value="physical">{t('familyProfile.physical')}</option>
                    <option value="hearing">{t('familyProfile.hearing')}</option>
                    <option value="intellectual">{t('familyProfile.intellectual')}</option>
                  </select>
                </div>
              </div>

              {formError && (
                <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{formError}</span>
                </div>
              )}

              <div className="flex space-x-4">
                <Button onClick={handleSave} icon={Save} size="large" fullWidth>
                  {editingId ? t('familyProfile.updateDependent') : t('familyProfile.saveDependent')}
                </Button>
                <Button onClick={resetForm} variant="outline" size="large">{t('app.cancel')}</Button>
              </div>
            </div>
          )}

          {/* Dependents list */}
          {dependents.length === 0 && !showForm ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-kiosk-base text-gray-400 font-medium">{t('familyProfile.noDependents')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('familyProfile.noDependentsHint')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {children.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <Baby className="w-5 h-5 text-pink-500 mr-2" />
                    <h2 className="text-kiosk-base font-bold text-gray-800">
                      {t('familyProfile.children')} ({children.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((dep) => (
                      <DependentCard key={dep.id} dependent={dep} onEdit={handleEdit} onRemove={handleRemove} />
                    ))}
                  </div>
                </div>
              )}

              {parents.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <Heart className="w-5 h-5 text-amber-500 mr-2" />
                    <h2 className="text-kiosk-base font-bold text-gray-800">
                      {t('familyProfile.elderlyParents')} ({parents.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parents.map((dep) => (
                      <DependentCard key={dep.id} dependent={dep} onEdit={handleEdit} onRemove={handleRemove} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {dependents.length > 0 && (
            <div className="mt-8 bg-violet-50 border border-violet-200 rounded-xl p-4">
              <p className="text-sm text-violet-700">💡 {t('familyProfile.schemesHint')}</p>
            </div>
          )}

          <div className="flex justify-center py-6">
            <button
              type="button"
              className="btn btn-quiet"
              style={{ fontSize: 22, padding: '18px 48px' }}
              onClick={() => setView('menu')}
            >
              <I d={ic.back} size={24} /> {t('familyProfile.backToMenu')}
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="warning"
        title={t('familyProfile.confirmRemovalTitle')}
        message={t('familyProfile.confirmRemovalMsg')}
        confirmText={t('familyProfile.remove')}
        cancelText={t('app.cancel')}
        onConfirm={confirmRemove}
        onCancel={() => setShowDeleteModal(false)}
      />
    </VK>
  );
};

export default FamilyProfile;

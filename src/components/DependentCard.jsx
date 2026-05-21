import React from 'react';
import { User, Calendar, Edit2, Trash2, Heart, Baby } from 'lucide-react';

/**
 * DependentCard — Reusable card for displaying a dependent (child or elderly parent).
 * Shows: name, relationship, age/DOB, gender, and action buttons (edit/remove).
 * Supports multilingual (en/hi/ta).
 */
const DependentCard = ({ dependent, lang = 'en', onEdit, onRemove }) => {
  const relationLabels = {
    child: { en: 'Child', hi: 'बच्चा', ta: 'குழந்தை' },
    elderly_parent: { en: 'Elderly Parent', hi: 'वृद्ध माता-पिता', ta: 'முதியோர் பெற்றோர்' },
    spouse: { en: 'Spouse', hi: 'जीवनसाथी', ta: 'வாழ்க்கைத் துணை' },
  };

  const genderLabels = {
    Male: { en: 'Male', hi: 'पुरुष', ta: 'ஆண்' },
    Female: { en: 'Female', hi: 'महिला', ta: 'பெண்' },
    Other: { en: 'Other', hi: 'अन्य', ta: 'மற்றவை' },
  };

  const relation = relationLabels[dependent.relationship]?.[lang] || dependent.relationship;
  const gender = genderLabels[dependent.gender]?.[lang] || dependent.gender;

  const isChild = dependent.relationship === 'child';
  const iconBg = isChild ? 'from-pink-400 to-rose-500' : 'from-amber-400 to-orange-500';
  const IconComp = isChild ? Baby : Heart;

  return (
    <div className="bg-white rounded-2xl shadow-kiosk p-5 border border-gray-100 transition-all hover:shadow-kiosk-hover">
      <div className="flex items-start space-x-4">
        {/* Avatar icon */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <IconComp className="w-7 h-7 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 truncate">{dependent.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isChild ? 'bg-pink-100 text-pink-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {relation}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <User className="w-3 h-3" /> {gender}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {lang === 'hi' ? 'आयु' : lang === 'ta' ? 'வயது' : 'Age'}: {dependent.age}
            </span>
          </div>
          {dependent.aadhaar && (
            <p className="text-xs text-gray-400 mt-1">
              Aadhaar: XXXX-XXXX-{dependent.aadhaar.slice(-4)}
            </p>
          )}
          {dependent.disability && (
            <p className="text-xs text-purple-600 mt-1">
              ♿ {lang === 'hi' ? 'विकलांगता' : lang === 'ta' ? 'ஊனம்' : 'Disability'}: {dependent.disability}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 flex-shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(dependent)}
              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              aria-label={`Edit ${dependent.name}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(dependent.id)}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              aria-label={`Remove ${dependent.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DependentCard;

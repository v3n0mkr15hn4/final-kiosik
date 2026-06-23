import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, Lock } from 'lucide-react';

/**
 * GuestGate — Wraps actions that require citizen login.
 * If user is a guest, shows a prompt instead of the action.
 * If user is logged in as citizen, renders children normally.
 */
const GuestGate = ({ children, actionLabel = 'this action' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isGuest = sessionStorage.getItem('isGuest') === 'true';
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

  // If citizen is logged in, render the action normally
  if (isLoggedIn && !isGuest) {
    return <>{children}</>;
  }

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
      <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
      <p className="text-kiosk-base font-semibold text-amber-700 mb-4">
        {t('auth.pleaseLoginAadhaar')}
      </p>
      <button
        onClick={() => navigate('/login')}
        className="inline-flex items-center space-x-2 px-6 py-3 bg-government-blue text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors"
      >
        <LogIn className="w-5 h-5" />
        <span>{t('auth.loginWithAadhaar')}</span>
      </button>
    </div>
  );
};

export default GuestGate;

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, LogOut, Globe, ChevronDown } from 'lucide-react';
import Button from './Button';
import { ALL_LANGUAGES } from '../utils/languageConfig';
import { changeLanguageSafe } from '../i18n';
import { useAuth } from '../hooks/useAuth';

/**
 * Header component with navigation and language selector dropdown
 */
const Header = ({ showBack = true, showHome = true, showLogout = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [loadingLang, setLoadingLang] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = ALL_LANGUAGES.find(l => l.code === i18n.language) || ALL_LANGUAGES[0];

  const changeLanguage = async (langCode) => {
    setLoadingLang(langCode);
    try {
      await changeLanguageSafe(langCode);
    } catch (e) {
      console.error('Language change failed:', e);
    }
    setLoadingLang(null);
    setShowLangDropdown(false);
  };

  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  return (
    <header className="bg-government-blue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Navigation */}
          <div className="flex items-center space-x-4">
            {showBack && !isHome && !isLogin && (
              <Button
                variant="ghost"
                size="medium"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/10"
                icon={ArrowLeft}
              >
                {t('app.back')}
              </Button>
            )}
            {showHome && !isHome && (
              <Button
                variant="ghost"
                size="medium"
                onClick={() => navigate('/home')}
                className="text-white hover:bg-white/10"
                icon={Home}
              >
                {t('app.home')}
              </Button>
            )}
          </div>

          {/* Center - Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center hidden md:block">
            <h1 className="text-kiosk-xl font-bold">{t('app.title')}</h1>
            <p className="text-kiosk-sm opacity-80">{t('app.subtitle')}</p>
          </div>

          {/* Right Section - Language & Logout */}
          <div className="flex items-center space-x-2">
            {/* Language Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center bg-white/10 rounded-kiosk px-3 py-2 hover:bg-white/20 transition-colors"
              >
                <Globe className="w-5 h-5 mr-1.5" />
                <span className="text-kiosk-base font-semibold">{currentLang.native}</span>
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] w-80 max-h-[70vh] overflow-y-auto">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 px-2 py-1 font-medium">4 Languages</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {ALL_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        disabled={loadingLang !== null}
                        className={`px-3 py-2 rounded-lg text-left transition-colors ${
                          i18n.language === lang.code
                            ? 'bg-government-blue text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        } ${loadingLang === lang.code ? 'animate-pulse' : ''}`}
                      >
                        <span className="block text-sm font-semibold">{lang.native}</span>
                        <span className="block text-xs opacity-70">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            {showLogout && (
              <Button
                variant="ghost"
                size="medium"
                onClick={() => logout().finally(() => navigate('/'))}
                className="text-white hover:bg-white/10 ml-4"
                icon={LogOut}
              >
                {t('app.logout')}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Title */}
        <div className="md:hidden text-center mt-4">
          <h1 className="text-kiosk-lg font-bold">{t('app.title')}</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;

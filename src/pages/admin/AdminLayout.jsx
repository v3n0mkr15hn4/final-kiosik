import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout = ({ title, subtitle, children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const role = sessionStorage.getItem('adminRole') || 'UNKNOWN';
  const userName = sessionStorage.getItem('userName') || 'Admin';

  const handleLogout = async () => {
    await logout();
    navigate('/admin-login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="text-xs text-slate-300">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{userName}</p>
          <p className="text-xs text-slate-300">{role}</p>
          <button onClick={handleLogout} className="mt-1 text-xs underline">{t('app.logout')}</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
};

export default AdminLayout;

import React, { useEffect, useState } from 'react';
import { adminPortalAPI } from '../../utils/apiService';
import AdminLayout from './AdminLayout';

const SuperAdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminPortalAPI.getSummary().then((res) => {
      if (res?.success) setSummary(res.summary);
      else setError(res?.error || 'Failed to load dashboard summary.');
    }).catch((e) => setError(e?.error || e?.message || 'Failed to load dashboard summary.'));
  }, []);

  return (
    <AdminLayout title="Super Admin Dashboard" subtitle="Global governance, cross-org analytics and compliance">
      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={summary?.total ?? '-'} />
        <StatCard label="Submitted" value={summary?.submitted ?? '-'} />
        <StatCard label="Assigned" value={summary?.assigned ?? '-'} />
        <StatCard label="Approved" value={summary?.approved ?? '-'} />
        <StatCard label="Rejected" value={summary?.rejected ?? '-'} />
      </div>
    </AdminLayout>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-xs text-slate-500 uppercase">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

export default SuperAdminDashboard;

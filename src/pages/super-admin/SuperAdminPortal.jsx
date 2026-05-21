import React, { useEffect, useState } from 'react';
import AdminLayout from '../admin/AdminLayout';
import { superAdminAPI } from '../../utils/apiService';

const SuperAdminPortal = () => {
  const [overview, setOverview] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([superAdminAPI.getOverview(), superAdminAPI.listOrganizations()])
      .then(([overviewRes, orgRes]) => {
        if (!overviewRes?.success) {
          setError(overviewRes?.error || 'Failed to load global overview.');
          return;
        }
        if (!orgRes?.success) {
          setError(orgRes?.error || 'Failed to load organizations.');
          return;
        }
        setOverview(overviewRes.data || null);
        setOrganizations(orgRes.organizations || []);
      })
      .catch((e) => setError(e?.error || e?.message || 'Failed to load super admin portal.'));
  }, []);

  return (
    <AdminLayout
      title="Super Admin Portal"
      subtitle="Global RBAC governance, organization management and enterprise-wide visibility"
    >
      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Organizations" value={overview?.activeOrganizations ?? '-'} />
        <Stat label="Kiosks" value={overview?.totalKiosks ?? '-'} />
        <Stat label="Applications" value={overview?.totalApplications ?? '-'} />
        <Stat label="Open Incidents" value={overview?.openSecurityIncidents ?? '-'} />
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Organization</th>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Departments</th>
              <th className="px-4 py-3 text-left">Admins</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{org.name}</td>
                <td className="px-4 py-3">{org.code}</td>
                <td className="px-4 py-3">{org.type}</td>
                <td className="px-4 py-3">{org.departments}</td>
                <td className="px-4 py-3">{org.adminUsers}</td>
                <td className="px-4 py-3">{org.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

const Stat = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-xs uppercase text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

export default SuperAdminPortal;

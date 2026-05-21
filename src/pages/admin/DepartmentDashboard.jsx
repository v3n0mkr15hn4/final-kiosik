import React, { useEffect, useState } from 'react';
import { adminPortalAPI } from '../../utils/apiService';
import AdminLayout from './AdminLayout';

const DepartmentDashboard = () => {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminPortalAPI.getApplications({ limit: 25 }).then((res) => {
      if (res?.success) setApps(res.applications || []);
      else setError(res?.error || 'Failed to load department applications.');
    }).catch((e) => setError(e?.error || e?.message || 'Failed to load department applications.'));
  }, []);

  return (
    <AdminLayout title="Department Dashboard" subtitle="Isolated applications and queue management">
      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Badge label="Total" value={apps.length} />
        <Badge label="Submitted" value={apps.filter((a) => a.workflow_state === 'Submitted').length} />
        <Badge label="Assigned" value={apps.filter((a) => a.workflow_state === 'Assigned').length} />
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Request ID</th>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Citizen</th>
              <th className="px-4 py-3 text-left">State</th>
              <th className="px-4 py-3 text-left">Priority</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.request_id} className="border-t border-slate-100">
                <td className="px-4 py-3">{a.request_id}</td>
                <td className="px-4 py-3">{a.service_type}</td>
                <td className="px-4 py-3">{a.citizen_name}</td>
                <td className="px-4 py-3">{a.workflow_state || 'Submitted'}</td>
                <td className="px-4 py-3">{a.priority || 'normal'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

const Badge = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-xs text-slate-500 uppercase">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

export default DepartmentDashboard;

import React, { useEffect, useState } from 'react';
import { adminPortalAPI } from '../../utils/apiService';
import AdminLayout from './AdminLayout';

const OfficerWorkspace = () => {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    adminPortalAPI.getApplications({ limit: 15, status: 'Assigned' })
      .then((res) => setApps(res?.applications || []))
      .catch(() => setApps([]));
  }, []);

  return (
    <AdminLayout title="Officer Workspace" subtitle="Assigned cases and workflow actions">
      <div className="space-y-3">
        {apps.length === 0 ? (
          <div className="bg-white rounded-xl p-4 shadow text-sm text-slate-600">No assigned applications right now.</div>
        ) : apps.map((app) => (
          <div key={app.request_id} className="bg-white rounded-xl p-4 shadow flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{app.request_id}</p>
              <p className="text-xs text-slate-600">{app.service_type} - {app.citizen_name}</p>
            </div>
            <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">{app.workflow_state || 'Assigned'}</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default OfficerWorkspace;

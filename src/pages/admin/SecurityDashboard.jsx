import React, { useEffect, useState } from 'react';
import { adminPortalAPI } from '../../utils/apiService';
import AdminLayout from './AdminLayout';

const SecurityDashboard = () => {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    adminPortalAPI.getSecurityIncidents()
      .then((res) => setIncidents(res?.incidents || []))
      .catch(() => setIncidents([]));
  }, []);

  return (
    <AdminLayout title="Security Operations Dashboard" subtitle="Intrusion, anomaly and SOC events">
      <div className="bg-white rounded-xl shadow divide-y divide-slate-100">
        {incidents.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">No security incidents logged yet.</div>
        ) : incidents.map((incident) => (
          <div key={incident.id} className="p-4">
            <p className="font-semibold text-slate-900">{incident.incident_type}</p>
            <p className="text-xs text-slate-600">Severity: {incident.severity} | Status: {incident.status}</p>
            <p className="text-xs text-slate-500 mt-1">{incident.created_at}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default SecurityDashboard;

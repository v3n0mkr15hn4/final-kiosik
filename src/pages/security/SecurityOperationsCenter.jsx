import React, { useEffect, useState } from 'react';
import AdminLayout from '../admin/AdminLayout';
import { securityCenterAPI } from '../../utils/apiService';

const SecurityOperationsCenter = () => {
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([securityCenterAPI.getIncidents(), securityCenterAPI.getTamperingAlerts()])
      .then(([incidentsRes, alertsRes]) => {
        if (!incidentsRes?.success) {
          setError(incidentsRes?.error || 'Failed to load security incidents.');
          return;
        }
        if (!alertsRes?.success) {
          setError(alertsRes?.error || 'Failed to load tampering alerts.');
          return;
        }
        setIncidents(incidentsRes.incidents || []);
        setAlerts(alertsRes.alerts || []);
      })
      .catch((e) => setError(e?.error || e?.message || 'Failed to load SOC dashboard.'));
  }, []);

  return (
    <AdminLayout title="Security Operations Center" subtitle="Incident response, tampering alerts and threat monitoring">
      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Panel title="Open Security Incidents" items={incidents.map((incident) => ({
          id: incident.id,
          title: incident.incident_type,
          meta: `${incident.severity} | ${incident.status}`,
          time: incident.created_at,
        }))} />
        <Panel title="Tampering Alerts" items={alerts.map((alert, index) => ({
          id: `${alert.kiosk_code}-${alert.created_at}-${index}`,
          title: `${alert.kiosk_code} - ${alert.location_name}`,
          meta: 'Suspicious activity detected',
          time: alert.created_at,
        }))} />
      </div>
    </AdminLayout>
  );
};

const Panel = ({ title, items }) => (
  <div className="bg-white rounded-xl shadow">
    <div className="px-4 py-3 border-b border-slate-100">
      <h2 className="font-semibold text-slate-900">{title}</h2>
    </div>
    <div className="divide-y divide-slate-100">
      {items.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">No records.</p>
      ) : items.map((item) => (
        <div key={item.id} className="p-4">
          <p className="font-medium text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-600">{item.meta}</p>
          <p className="text-xs text-slate-400 mt-1">{item.time}</p>
        </div>
      ))}
    </div>
  </div>
);

export default SecurityOperationsCenter;

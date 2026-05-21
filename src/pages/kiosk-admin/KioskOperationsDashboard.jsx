import React, { useEffect, useState } from 'react';
import AdminLayout from '../admin/AdminLayout';
import { kioskAdminAPI } from '../../utils/apiService';

const KioskOperationsDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [kiosks, setKiosks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([kioskAdminAPI.getDashboard(), kioskAdminAPI.getKioskHealth()])
      .then(([summaryRes, kiosksRes]) => {
        if (!summaryRes?.success) {
          setError(summaryRes?.error || 'Failed to load kiosk dashboard.');
          return;
        }
        if (!kiosksRes?.success) {
          setError(kiosksRes?.error || 'Failed to load kiosk health.');
          return;
        }
        setSummary(summaryRes.data || null);
        setKiosks(kiosksRes.kiosks || []);
      })
      .catch((e) => setError(e?.error || e?.message || 'Failed to load kiosk operations data.'));
  }, []);

  return (
    <AdminLayout
      title="Kiosk Admin System"
      subtitle="Maintenance, diagnostics, heartbeat and infrastructure monitoring only"
    >
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Kiosk Admin access does not include citizen application workflow, organization documents, or department approvals.
      </div>

      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Kiosks" value={summary?.totalKiosks ?? '-'} />
        <Stat label="Online" value={summary?.onlineKiosks ?? '-'} />
        <Stat label="Stale Heartbeat" value={summary?.staleHeartbeatKiosks ?? '-'} />
        <Stat label="Suspicious 24h" value={summary?.suspiciousEvents24h ?? '-'} />
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Kiosk</th>
              <th className="px-4 py-3 text-left">CPU</th>
              <th className="px-4 py-3 text-left">RAM</th>
              <th className="px-4 py-3 text-left">Network</th>
              <th className="px-4 py-3 text-left">Devices</th>
              <th className="px-4 py-3 text-left">Last Heartbeat</th>
            </tr>
          </thead>
          <tbody>
            {kiosks.map((k) => (
              <tr key={k.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{k.kiosk_code} - {k.location_name}</td>
                <td className="px-4 py-3">{k.cpu_usage ?? '-'}</td>
                <td className="px-4 py-3">{k.ram_usage ?? '-'}</td>
                <td className="px-4 py-3">{k.network_status ?? '-'}</td>
                <td className="px-4 py-3">
                  P:{k.printer_status || '-'} C:{k.camera_status || '-'} M:{k.microphone_status || '-'} B:{k.biometric_status || '-'}
                </td>
                <td className="px-4 py-3">{k.last_heartbeat_at || '-'}</td>
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

export default KioskOperationsDashboard;

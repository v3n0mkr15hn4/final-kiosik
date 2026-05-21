import React, { useEffect, useState } from 'react';
import { adminPortalAPI } from '../../utils/apiService';
import AdminLayout from './AdminLayout';

const KioskOpsDashboard = () => {
  const [kiosks, setKiosks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminPortalAPI.getKioskHealth().then((res) => {
      if (res?.success) setKiosks(res.kiosks || []);
      else setError(res?.error || 'Failed to load kiosk health.');
    }).catch((e) => setError(e?.error || e?.message || 'Failed to load kiosk health.'));
  }, []);

  return (
    <AdminLayout title="Kiosk Operations Dashboard" subtitle="Infrastructure monitoring and diagnostics only">
      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Kiosk</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">CPU</th>
              <th className="px-4 py-3 text-left">RAM</th>
              <th className="px-4 py-3 text-left">Network</th>
              <th className="px-4 py-3 text-left">Last Heartbeat</th>
            </tr>
          </thead>
          <tbody>
            {kiosks.map((k) => (
              <tr key={k.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{k.kiosk_code} - {k.location_name}</td>
                <td className="px-4 py-3">{k.status}</td>
                <td className="px-4 py-3">{k.cpu_usage ?? '-'}</td>
                <td className="px-4 py-3">{k.ram_usage ?? '-'}</td>
                <td className="px-4 py-3">{k.network_status ?? '-'}</td>
                <td className="px-4 py-3">{k.last_heartbeat_at || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default KioskOpsDashboard;

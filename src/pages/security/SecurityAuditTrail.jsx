import React, { useEffect, useState } from 'react';
import AdminLayout from '../admin/AdminLayout';
import { securityCenterAPI } from '../../utils/apiService';

const SecurityAuditTrail = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    securityCenterAPI.getAuditLogs()
      .then((res) => setLogs(res?.logs || []))
      .catch(() => setLogs([]));
  }, []);

  return (
    <AdminLayout title="Security Audit Trail" subtitle="Immutable enterprise event timeline">
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Actor</th>
              <th className="px-4 py-3 text-left">Event</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Resource</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{log.created_at}</td>
                <td className="px-4 py-3">{log.actor_type}:{log.actor_id || '-'}</td>
                <td className="px-4 py-3">{log.event_type}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3">{log.resource_type || '-'}:{log.resource_id || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default SecurityAuditTrail;

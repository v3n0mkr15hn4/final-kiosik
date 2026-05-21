import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../admin/AdminLayout';
import { organizationPortalAPI } from '../../../utils/apiService';

const ACTION_BUTTONS = [
  { key: 'approve', label: 'Approve' },
  { key: 'reject', label: 'Reject' },
  { key: 'escalate', label: 'Escalate' },
  { key: 'request_documents', label: 'Request Documents' },
  { key: 'mark_verified', label: 'Mark Verified' },
  { key: 'complete_workflow', label: 'Complete Workflow' },
];

const OrganizationPortalWorkspace = ({ title, subtitle, organizationCode }) => {
  const [summary, setSummary] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetails, setAppDetails] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [note, setNote] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const orgId = useMemo(() => {
    try {
      const profile = JSON.parse(sessionStorage.getItem('adminProfile') || '{}');
      return profile.organizationId || null;
    } catch {
      return null;
    }
  }, []);

  const refreshDashboard = async () => {
    if (!orgId) return;
    const [summaryRes, appsRes] = await Promise.all([
      organizationPortalAPI.getSummary(orgId),
      organizationPortalAPI.getApplications(orgId, { limit: 50 }),
    ]);

    if (!summaryRes?.success) throw new Error(summaryRes?.error || 'Failed to load organization summary.');
    if (!appsRes?.success) throw new Error(appsRes?.error || 'Failed to load organization applications.');

    setSummary(summaryRes.summary || null);
    setApplications(appsRes.applications || []);
  };

  const loadAppDetails = async (applicationId) => {
    if (!applicationId || !orgId) return;
    const detailsRes = await organizationPortalAPI.getApplicationById(applicationId, orgId);
    const documentsRes = await organizationPortalAPI.getDocuments(applicationId, orgId);

    if (!detailsRes?.success) throw new Error(detailsRes?.error || 'Failed to load application details.');
    if (!documentsRes?.success) throw new Error(documentsRes?.error || 'Failed to load application documents.');

    setAppDetails(detailsRes);
    setDocuments(documentsRes.documents || []);

    const departmentId = detailsRes?.application?.assigned_department_id;
    if (departmentId) {
      const officersRes = await organizationPortalAPI.getDepartmentOfficers(departmentId, orgId);
      if (officersRes?.success) {
        setOfficers(officersRes.officers || []);
      }
    }
  };

  useEffect(() => {
    if (!orgId) {
      setError('No organization context found for this account.');
      return;
    }

    setLoading(true);
    refreshDashboard()
      .catch((e) => setError(e?.message || 'Failed to load organization portal.'))
      .finally(() => setLoading(false));
  }, [orgId]);

  const onSelectApplication = async (app) => {
    setSelectedApp(app);
    setError('');
    setLoading(true);
    try {
      await loadAppDetails(app.request_id);
    } catch (e) {
      setError(e?.message || 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  const withReload = async (runner) => {
    if (!selectedApp?.request_id) return;
    setLoading(true);
    setError('');
    try {
      await runner();
      await refreshDashboard();
      await loadAppDetails(selectedApp.request_id);
    } catch (e) {
      setError(e?.error || e?.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = () => withReload(() => organizationPortalAPI.assignApplication(selectedApp.request_id, {
    officerAdminUserId: selectedOfficerId,
    priority,
  }, orgId));

  const handleAction = (action) => withReload(() => organizationPortalAPI.runApplicationAction(selectedApp.request_id, {
    action,
    comments: actionComment || `${action} from organization portal`,
  }, orgId));

  const handleAddNote = () => withReload(async () => {
    await organizationPortalAPI.addInternalNote(selectedApp.request_id, note, orgId);
    setNote('');
  });

  const handleVerifyDocument = (documentId) => withReload(() => organizationPortalAPI.verifyDocument(
    selectedApp.request_id,
    documentId,
    orgId,
  ));

  return (
    <AdminLayout title={title} subtitle={subtitle}>
      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Organization Scope: <strong>{organizationCode}</strong> | Live workflow controls enabled with audit trail and department isolation.
      </div>

      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Applications" value={summary?.total ?? '-'} />
        <StatCard label="SLA Breaches" value={summary?.slaBreaches ?? '-'} />
        <StatCard label="Active States" value={Array.isArray(summary?.byState) ? summary.byState.length : '-'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <section className="xl:col-span-2 bg-white rounded-xl shadow overflow-hidden">
          <header className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Application Queue</h2>
          </header>
          <div className="max-h-[68vh] overflow-auto">
            {applications.map((app) => {
              const active = selectedApp?.request_id === app.request_id;
              return (
                <button
                  key={app.request_id}
                  onClick={() => onSelectApplication(app)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <p className="font-semibold text-slate-900">{app.request_id}</p>
                  <p className="text-xs text-slate-600">{app.service_type} | {app.citizen_name}</p>
                  <p className="text-xs text-slate-500">{app.workflow_state || 'Submitted'} | Priority: {app.priority || 'normal'}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="xl:col-span-3 bg-white rounded-xl shadow p-4">
          {!selectedApp ? (
            <p className="text-slate-500">Select an application to open details, documents, timeline, assignments, and workflow actions.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 p-3">
                <h3 className="font-semibold text-slate-900 mb-2">Application Details</h3>
                <p className="text-sm">Citizen: {appDetails?.application?.citizen_name || '-'}</p>
                <p className="text-sm">Mobile: {appDetails?.application?.mobile || '-'}</p>
                <p className="text-sm">Workflow: {appDetails?.application?.workflow_state || 'Submitted'}</p>
                <p className="text-sm">Priority: {appDetails?.application?.priority || 'normal'}</p>
                <p className="text-sm">SLA Status: {summary?.slaBreaches > 0 ? 'Attention Required' : 'Within SLA'}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <h3 className="font-semibold text-slate-900 mb-2">Workflow Actions</h3>
                <textarea
                  value={actionComment}
                  onChange={(event) => setActionComment(event.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-sm mb-3"
                  rows={2}
                  placeholder="Add action comments"
                />
                <div className="flex flex-wrap gap-2">
                  {ACTION_BUTTONS.map((button) => (
                    <button
                      key={button.key}
                      onClick={() => handleAction(button.key)}
                      className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                      disabled={loading}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <h3 className="font-semibold text-slate-900 mb-2">Assign Officer</h3>
                <div className="grid md:grid-cols-3 gap-2">
                  <select value={selectedOfficerId} onChange={(event) => setSelectedOfficerId(event.target.value)} className="border border-slate-300 rounded-md p-2 text-sm">
                    <option value="">Select officer</option>
                    {officers.map((officer) => (
                      <option key={officer.id} value={officer.id}>{officer.full_name}</option>
                    ))}
                  </select>
                  <select value={priority} onChange={(event) => setPriority(event.target.value)} className="border border-slate-300 rounded-md p-2 text-sm">
                    <option value="low">low</option>
                    <option value="normal">normal</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                  <button onClick={handleAssign} className="rounded-md bg-emerald-600 text-white text-sm font-semibold px-3 py-2 hover:bg-emerald-700" disabled={!selectedOfficerId || loading}>
                    Assign Officer
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <h3 className="font-semibold text-slate-900 mb-2">Internal Notes</h3>
                <div className="flex gap-2">
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="flex-1 border border-slate-300 rounded-md p-2 text-sm"
                    placeholder="Add investigation or verification note"
                  />
                  <button onClick={handleAddNote} className="rounded-md bg-slate-900 text-white text-sm px-3 py-2" disabled={!note || loading}>
                    Add Note
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3">
                <h3 className="font-semibold text-slate-900 mb-2">Uploaded Documents</h3>
                <div className="space-y-2">
                  {documents.map((document) => (
                    <div key={document.id} className="border border-slate-100 rounded-md px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{document.file_name}</p>
                        <p className="text-xs text-slate-600">OCR/Verification: {document.verification_status}</p>
                      </div>
                      <button
                        onClick={() => handleVerifyDocument(document.id)}
                        className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs"
                        disabled={loading || document.verification_status === 'verified'}
                      >
                        Mark Verified
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 p-3">
                  <h3 className="font-semibold text-slate-900 mb-2">Workflow Timeline</h3>
                  <ul className="space-y-1 text-sm text-slate-700 max-h-44 overflow-auto">
                    {(appDetails?.workflowHistory || []).map((entry) => (
                      <li key={entry.id}>{entry.created_at}: {entry.next_state} {entry.comments ? `- ${entry.comments}` : ''}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <h3 className="font-semibold text-slate-900 mb-2">Assignment History</h3>
                  <ul className="space-y-1 text-sm text-slate-700 max-h-44 overflow-auto">
                    {(appDetails?.assignments || []).map((assignment) => (
                      <li key={assignment.id}>{assignment.assigned_at}: {assignment.assigned_to_admin_user_id || 'Unassigned'} ({assignment.priority})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {loading ? <p className="text-xs text-slate-500 mt-4">Synchronizing live workflow...</p> : null}
    </AdminLayout>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-xs uppercase text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

export default OrganizationPortalWorkspace;

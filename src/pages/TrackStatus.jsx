import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, FileText, Phone, Clock, Printer, Download, ArrowLeft, Ticket, AlertCircle, ChevronsUp } from 'lucide-react';
import {
  Button,
  Input,
  Timeline,
  LoadingSpinner
} from '../components';
import { VK } from '../components/kiosk';
import { mockTrackingData, statusConfig } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import { trackAPI } from '../utils/apiService';

// Parse SLA string like "15 working days" → number of working days
function parseSLADays(slaStr) {
  if (!slaStr) return null;
  const match = slaStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Calculate working days remaining from submission date
function calcSLACountdown(submittedAt, slaDays) {
  if (!submittedAt || !slaDays) return null;
  const submitted = new Date(submittedAt);
  let workingDaysAdded = 0;
  const due = new Date(submitted);
  while (workingDaysAdded < slaDays) {
    due.setDate(due.getDate() + 1);
    const day = due.getDay();
    if (day !== 0 && day !== 6) workingDaysAdded++;
  }
  const now = new Date();
  const msLeft = due - now;
  if (msLeft <= 0) return { overdue: true, daysLeft: 0, dueDate: due };
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  return { overdue: false, daysLeft, dueDate: due };
}

const TrackStatus = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('requestId'); // 'requestId' | 'ticketId' | 'mobile'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
    const [slaCountdown, setSlaCountdown] = useState(null);
  const [escalated, setEscalated] = useState(false);

  // Recalculate SLA countdown every minute once result is loaded
  useEffect(() => {
    if (!result?.submittedAt || !result?.sla) { setSlaCountdown(null); return; }
    const slaDays = parseSLADays(result.sla);
    const update = () => setSlaCountdown(calcSLACountdown(result.submittedAt, slaDays));
    update();
    const interval = setInterval(update, 60 * 1000);
    return () => clearInterval(interval);
  }, [result]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError(t('tracking.enterSearchTerm', 'Please enter a search term'));
      return;
    }
    setError('');
    setLoading(true);
    setSearched(true);

    try {
      let foundResult = null;
      try {
        if (searchType === 'requestId' || searchType === 'ticketId') {
          const data = await trackAPI.byRequestId(searchQuery.toUpperCase());
          if (data?.requestId) foundResult = data;
        } else {
          const data = await trackAPI.byMobile(searchQuery);
          if (data?.requestId) foundResult = data;
        }
      } catch {
        // Fallback to mock data — ticket ID maps to same mock set
        if (searchType === 'requestId' || searchType === 'ticketId') {
          foundResult = mockTrackingData[searchQuery.toUpperCase()] || null;
        } else {
          foundResult = Object.values(mockTrackingData).find(
            item => item.mobile === searchQuery
          ) || null;
        }
      }
      setResult(foundResult || null);
    } catch {
      setError(t('errors.networkError', 'Network error. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.submitted;
    return (
      <span className={`px-4 py-2 rounded-full text-kiosk-base font-semibold ${config.bgColor} ${config.textColor}`}>
        {t(`tracking.${status}`, status)}
      </span>
    );
  };

  const searchTabs = [
    { key: 'requestId', label: t('tracking.requestId', 'Request ID'), icon: FileText, placeholder: 'e.g. SVD-TEST-001' },
    { key: 'ticketId',  label: t('tracking.ticketId', 'Ticket ID'),   icon: Ticket,   placeholder: 'e.g. TKT-2026-001' },
    { key: 'mobile',    label: t('form.mobile', 'Mobile'),            icon: Phone,    placeholder: t('auth.enterMobile', '10-digit mobile') },
  ];

  return (
    <VK bg="var(--surface-1, #f8fafc)">
      <div>
        <div className="text-center mb-8">
          <h1 className="text-kiosk-2xl md:text-kiosk-3xl font-bold text-government-blue">
            {t('tracking.title', 'Track Your Request')}
          </h1>
          <p className="text-kiosk-lg text-gray-600 mt-2">
            {t('tracking.subtitle', 'Enter your Request ID, Ticket ID, or mobile number')}
          </p>
        </div>

        <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8 mb-8">
          {/* Search Type Toggle — 3 tabs */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 rounded-kiosk p-1 flex-wrap gap-1">
              {searchTabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setSearchType(key); setSearchQuery(''); setResult(null); setSearched(false); }}
                  className={`px-5 py-3 rounded-kiosk text-kiosk-base font-semibold transition-all flex items-center gap-2
                    ${searchType === key ? 'bg-government-blue text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  const raw = e.target.value;
                  const value = searchType === 'mobile'
                    ? raw.replace(/\D/g, '').slice(0, 10)
                    : raw.toUpperCase();
                  setSearchQuery(value);
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder={searchTabs.find(t => t.key === searchType)?.placeholder}
                icon={searchTabs.find(t => t.key === searchType)?.icon}
                error={error}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              size="large"
              icon={Search}
              className="md:w-auto"
            >
              {t('tracking.search', 'Search')}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-kiosk border border-blue-200">
            <p className="text-kiosk-sm text-blue-700">
              <strong>Demo:</strong> Request IDs - SVD-TEST-001, SVD-TEST-002, SVD-TEST-003 &nbsp;|&nbsp; Ticket IDs - TKT-2026-001, TKT-2026-002, TKT-2026-003 &nbsp;|&nbsp; Mobile - 9876543210
            </p>
          </div>

          <div className="mt-4 flex justify-start">
            <Button variant="outline" onClick={() => navigate('/home')} size="large" icon={ArrowLeft}>
              {t('home.backToOrgs', 'Back to Home')}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" message={t('app.loading', 'Searching...')} />
          </div>
        )}

        {!loading && searched && (
          result ? (
            <div className="bg-white rounded-kiosk-lg shadow-kiosk overflow-hidden animate-fade-in">
              {/* Status Header */}
              <div className="bg-government-blue text-white p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-kiosk-sm opacity-80">{t('tracking.requestId', 'Request ID')}</p>
                    <p className="text-kiosk-2xl font-bold">{result.requestId}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(result.status)}
                    <button
                      aria-label={t('tracking.downloadPdf')}
                      className="p-2 bg-white/10 rounded-full hover:bg-white/20"
                      onClick={() => window.print()}
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      aria-label={t('tracking.printStatus')}
                      className="p-2 bg-white/10 rounded-full hover:bg-white/20"
                      onClick={() => window.print()}
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* SLA Countdown Banner */}
              {slaCountdown && result.status !== 'resolved' && result.status !== 'closed' && (
                <div className={`px-6 py-3 flex items-center gap-3 ${slaCountdown.overdue ? 'bg-red-50 border-b border-red-200' : 'bg-amber-50 border-b border-amber-200'}`}>
                  {slaCountdown.overdue ? (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    {slaCountdown.overdue ? (
                      <p className="text-sm font-semibold text-red-700">{t('tracking.slaBreached')}</p>
                    ) : (
                      <p className="text-sm font-semibold text-amber-700">
                        {t('tracking.slaDeadline', { count: slaCountdown.daysLeft })}
                        &nbsp;({slaCountdown.dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">{t('tracking.committedSla')}: {result.sla}</p>
                  </div>
                  {slaCountdown.overdue && !escalated && (
                    <button
                      onClick={() => {
                        setEscalated(true);
                        alert(t('tracking.escalationRaised', { requestId: result.requestId }));
                      }}
                      className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 touch-manipulation"
                      aria-label={t('tracking.escalate')}
                    >
                      <ChevronsUp className="w-4 h-4" /> {t('tracking.escalate')}
                    </button>
                  )}
                  {escalated && (
                    <span className="ml-auto text-sm font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-full">
                      ✅ Escalated
                    </span>
                  )}
                </div>
              )}
              {result.status === 'resolved' && (
                <div className="px-6 py-3 bg-green-50 border-b border-green-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-green-700">Resolved within SLA: {result.sla}</p>
                </div>
              )}

              {/* Details */}
              <div className="p-6 border-b">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-kiosk-sm text-gray-500">{t('receipt.citizenName', 'Name')}</p>
                    <p className="text-kiosk-lg font-semibold text-gray-800">{result.citizenName}</p>
                  </div>
                  <div>
                    <p className="text-kiosk-sm text-gray-500">{t('form.mobile', 'Mobile')}</p>
                    <p className="text-kiosk-lg font-semibold text-gray-800">+91 {result.mobile}</p>
                  </div>
                  <div>
                    <p className="text-kiosk-sm text-gray-500">{t('receipt.serviceCategory', 'Service')}</p>
                    <p className="text-kiosk-lg font-semibold text-gray-800">{result.serviceCategory}</p>
                  </div>
                  <div>
                    <p className="text-kiosk-sm text-gray-500">{t('tracking.lastUpdated', 'Last Updated')}</p>
                    <p className="text-kiosk-lg font-semibold text-gray-800">
                      {formatDate(result.lastUpdated, i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'as' ? 'as-IN' : 'en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Officer + Timeline */}
              <div className="p-6">
                {result.assignedOfficer && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-kiosk">
                    <p className="text-xs text-blue-500 uppercase tracking-wider mb-2">Assigned Officer & Department</p>
                    <p className="text-sm font-bold text-blue-900">{result.assignedOfficer.name}</p>
                    <p className="text-sm text-blue-700">{result.assignedOfficer.designation}</p>
                    {result.department && <p className="text-sm text-blue-600 mt-1">Department: {result.department}</p>}
                    {result.assignedOfficer.contact && <p className="text-xs text-blue-500 mt-1">{result.assignedOfficer.contact}</p>}
                  </div>
                )}
                <h3 className="text-kiosk-xl font-bold text-gray-800 mb-6">{t('tracking.timeline', 'Timeline')}</h3>
                <Timeline events={result.timeline} currentStatus={result.status} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-kiosk-lg shadow-kiosk p-12 text-center animate-fade-in">
              <h3 className="text-kiosk-xl font-bold text-gray-600 mb-2">{t('tracking.noResults', 'No results found')}</h3>
              <p className="text-kiosk-base text-gray-500">
                Please check the {searchTabs.find(t => t.key === searchType)?.label} and try again.
              </p>
            </div>
          )
        )}
      </div>
    </VK>
  );
};

export default TrackStatus;

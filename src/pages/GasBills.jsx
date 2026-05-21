import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, Download, IndianRupee, CalendarDays, Gauge } from 'lucide-react';
import { Button } from '../components';
import { VK } from '../components/kiosk';
import { formatDateShort } from '../utils/helpers';

/**
 * Gas Bills Page — View past and current gas bills
 */
const GasBills = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const userName = sessionStorage.getItem('userName') || 'Consumer';
  const [expandedBill, setExpandedBill] = useState(null);

  // Mock bill data
  const bills = [
    { id: 'GB-2026-03', month: 'March 2026', amount: 1850, units: 42, dueDate: '2026-04-15', status: 'unpaid', readingDate: '2026-03-28', previousReading: 4520, currentReading: 4562 },
    { id: 'GB-2026-02', month: 'February 2026', amount: 1620, units: 37, dueDate: '2026-03-15', status: 'paid', readingDate: '2026-02-28', previousReading: 4483, currentReading: 4520 },
    { id: 'GB-2026-01', month: 'January 2026', amount: 2100, units: 48, dueDate: '2026-02-15', status: 'paid', readingDate: '2026-01-30', previousReading: 4435, currentReading: 4483 },
    { id: 'GB-2025-12', month: 'December 2025', amount: 1980, units: 45, dueDate: '2026-01-15', status: 'paid', readingDate: '2025-12-29', previousReading: 4390, currentReading: 4435 },
    { id: 'GB-2025-11', month: 'November 2025', amount: 1450, units: 33, dueDate: '2025-12-15', status: 'paid', readingDate: '2025-11-28', previousReading: 4357, currentReading: 4390 },
    { id: 'GB-2025-10', month: 'October 2025', amount: 1720, units: 39, dueDate: '2025-11-15', status: 'paid', readingDate: '2025-10-30', previousReading: 4318, currentReading: 4357 },
  ];

  const totalDue = bills.filter(b => b.status === 'unpaid').reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = bills.filter(b => b.status === 'paid').length;
  const latestUnits = bills[0]?.units || 0;

  const locale = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'as' ? 'as-IN' : 'en-IN';

  return (
    <VK bg="color-mix(in oklab, #dc2626 4%, white)">
      <div>
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-kiosk-2xl md:text-kiosk-3xl font-bold text-gray-800">
            {t('gasBills.title', 'Gas Bills')}
          </h1>
          <p className="text-kiosk-base text-gray-500 mt-1">
            {userName}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <IndianRupee className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">{t('gasBills.currentDue', 'Current Due')}</p>
                <p className="text-2xl font-bold text-red-600">₹{totalDue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">{t('gasBills.billsPaid', 'Bills Paid')}</p>
                <p className="text-2xl font-bold text-green-600">{totalPaid}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <Gauge className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">{t('gasBills.latestUnits', 'Latest Units')}</p>
                <p className="text-2xl font-bold text-blue-600">{latestUnits} SCM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill List */}
        <div className="space-y-4">
          {bills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <button
                onClick={() => setExpandedBill(expandedBill === bill.id ? null : bill.id)}
                className="w-full flex items-center justify-between p-5 text-left touch-manipulation hover:bg-gray-50 transition-colors"
                aria-label={`${bill.month} - ₹${bill.amount}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${bill.status === 'paid' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <h3 className="text-kiosk-base font-bold text-gray-800">{bill.month}</h3>
                    <p className="text-sm text-gray-500">{bill.units} SCM • Due: {formatDateShort(bill.dueDate, locale)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-kiosk-lg font-bold text-gray-800">₹{bill.amount.toLocaleString()}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {bill.status === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
                  </span>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedBill === bill.id && (
                <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-sm">
                    <div>
                      <p className="text-gray-500">Bill ID</p>
                      <p className="font-semibold text-gray-800">{bill.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Reading Date</p>
                      <p className="font-semibold text-gray-800">{formatDateShort(bill.readingDate, locale)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Previous Reading</p>
                      <p className="font-semibold text-gray-800">{bill.previousReading}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Current Reading</p>
                      <p className="font-semibold text-gray-800">{bill.currentReading}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="small"
                      icon={Download}
                      onClick={() => window.print()}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      icon={Printer}
                      onClick={() => window.print()}
                    >
                      Print
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="large"
            icon={ArrowLeft}
            onClick={() => navigate('/home')}
          >
            {t('home.backToOrgs', 'Back to Home')}
          </Button>
        </div>
      </div>
    </VK>
  );
};

export default GasBills;

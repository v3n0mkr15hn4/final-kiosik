import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Landmark,
  Search,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Header,
  Button,
  Input,
  Modal,
  LoadingSpinner,
} from '../components';
import { VK } from '../components/kiosk';
import { generateRequestId, getCurrentTimestamp } from '../utils/helpers';
import { addReceipt } from '../utils/receipts';

/**
 * Property Tax Payment — Municipal Module
 * SRS requirement: "Property Tax Payment Receipt" as a municipal receipt type
 */
const PropertyTaxPayment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: lookup, 2: details, 3: pay
  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Mock property data (would come from backend in production)
  const [propertyData, setPropertyData] = useState(null);

  const mockProperties = {
    'PROP-2024-001': {
      propertyId: 'PROP-2024-001',
      ownerName: 'Ramesh Kumar',
      address: '42, MG Road, Ward 3, Guwahati',
      propertyType: 'Residential',
      area: '1200 sq.ft',
      zone: 'A (Commercial)',
      lastPaidDate: '2025-12-15',
      currentDue: 8500,
      arrears: 0,
      totalPayable: 8500,
      financialYear: '2026-27',
    },
    'PROP-2024-002': {
      propertyId: 'PROP-2024-002',
      ownerName: 'Lakshmi Devi',
      address: '15, Station Road, Ward 7, Guwahati',
      propertyType: 'Commercial',
      area: '2400 sq.ft',
      zone: 'B (Mixed Use)',
      lastPaidDate: '2025-09-01',
      currentDue: 24000,
      arrears: 12000,
      totalPayable: 36000,
      financialYear: '2026-27',
    },
  };

  const handleLookup = () => {
    if (!propertyId.trim()) {
      setError('Please enter a Property ID or House Number');
      return;
    }
    setError('');
    setLoading(true);

    // Simulate API lookup
    setTimeout(() => {
      const found = mockProperties[propertyId.toUpperCase()];
      if (found) {
        setPropertyData(found);
        setStep(2);
      } else {
        setError('Property not found. Try PROP-2024-001 or PROP-2024-002 for demo.');
      }
      setLoading(false);
    }, 800);
  };

  const handlePay = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = () => {
    setShowConfirmModal(false);
    setLoading(true);

    setTimeout(() => {
      const receiptData = {
        requestId: generateRequestId(),
        citizenName: propertyData.ownerName,
        mobile: sessionStorage.getItem('userMobile') || '9876543210',
        serviceType: 'municipal',
        serviceCategory: 'Property Tax Payment',
        timestamp: getCurrentTimestamp(),
        status: 'submitted',
        sla: 'Instant (Payment Processed)',
        amount: `₹${propertyData.totalPayable.toLocaleString('en-IN')}`,
        propertyId: propertyData.propertyId,
        financialYear: propertyData.financialYear,
      };

      addReceipt(receiptData);
      setLoading(false);
      navigate(`/receipt?org=${encodeURIComponent(receiptData.serviceType)}&id=${encodeURIComponent(receiptData.requestId)}`);
    }, 1500);
  };

  if (loading) {
    return (
      <VK bg="color-mix(in oklab, #4338ca 4%, white)">
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" message={step === 1 ? 'Looking up property...' : 'Processing payment...'} />
        </div>
      </VK>
    );
  }

  return (
    <VK bg="color-mix(in oklab, #4338ca 4%, white)">
      

      <div>
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full mb-4 shadow-lg">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-kiosk-2xl font-bold text-gray-800">
            {t('municipal.propertyTax', 'Property Tax Payment')}
          </h1>
          <p className="text-kiosk-base text-gray-500 mt-1">
            Pay your municipal property tax online
          </p>
        </div>

        {/* Step 1: Property Lookup */}
        {step === 1 && (
          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <h2 className="text-kiosk-lg font-bold text-gray-800 mb-6 text-center">
              Enter Property Details
            </h2>

            <Input
              label={t('municipal.propertyId', 'Property ID / House Number')}
              value={propertyId}
              onChange={(e) => { setPropertyId(e.target.value.toUpperCase()); setError(''); }}
              placeholder={t('municipal.enterPropertyId', 'e.g., PROP-2024-001')}
              error={error}
              icon={Search}
              required
            />

            {/* Demo hint */}
            <div className="mt-4 p-3 bg-blue-50 rounded-kiosk border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Demo:</strong> Try "PROP-2024-001" (₹8,500) or "PROP-2024-002" (₹36,000 with arrears)
              </p>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={() => navigate('/municipal-menu')} size="large" icon={ArrowLeft}>
                {t('app.back')}
              </Button>
              <Button onClick={handleLookup} size="xlarge" icon={Search} iconPosition="right" disabled={!propertyId.trim()}>
                Look Up Property
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Property Details + Payment */}
        {step === 2 && propertyData && (
          <div className="space-y-6">
            {/* Property Details Card */}
            <div className="bg-white rounded-kiosk-lg shadow-kiosk overflow-hidden">
              <div className="bg-indigo-600 text-white p-5">
                <p className="text-xs opacity-80 uppercase tracking-wider">Property Tax Assessment</p>
                <p className="text-kiosk-xl font-bold mt-1">{propertyData.propertyId}</p>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Owner Name</span>
                  <span className="text-sm font-semibold text-gray-800">{propertyData.ownerName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Address</span>
                  <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">{propertyData.address}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Property Type</span>
                  <span className="text-sm font-semibold text-gray-800">{propertyData.propertyType}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Built-Up Area</span>
                  <span className="text-sm font-semibold text-gray-800">{propertyData.area}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Zone</span>
                  <span className="text-sm font-semibold text-gray-800">{propertyData.zone}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Financial Year</span>
                  <span className="text-sm font-semibold text-gray-800">{propertyData.financialYear}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Last Paid</span>
                  <span className="text-sm font-semibold text-gray-800">{propertyData.lastPaidDate}</span>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6">
              <h3 className="text-kiosk-base font-bold text-gray-800 mb-4">Payment Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Current Year Tax</span>
                  <span className="text-sm font-semibold text-gray-800">₹{propertyData.currentDue.toLocaleString('en-IN')}</span>
                </div>
                {propertyData.arrears > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Arrears
                    </span>
                    <span className="text-sm font-semibold text-red-600">₹{propertyData.arrears.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-indigo-200 mt-2">
                  <span className="text-kiosk-base font-bold text-indigo-700">Total Payable</span>
                  <span className="text-kiosk-xl font-bold text-indigo-700">₹{propertyData.totalPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Button variant="outline" onClick={() => { setStep(1); setPropertyData(null); }} size="large" icon={ArrowLeft}>
                Search Again
              </Button>
              <Button onClick={handlePay} size="xlarge" icon={CheckCircle} iconPosition="right">
                Pay ₹{propertyData.totalPayable.toLocaleString('en-IN')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        type="confirm"
        title="Confirm Payment"
        message={`Pay ₹${propertyData?.totalPayable?.toLocaleString('en-IN')} for Property Tax (${propertyData?.propertyId})?`}
        confirmText="Confirm Payment"
        cancelText={t('app.cancel')}
        onConfirm={handleConfirmPayment}
        onCancel={() => setShowConfirmModal(false)}
      />
    
    </VK>
  );
};

export default PropertyTaxPayment;

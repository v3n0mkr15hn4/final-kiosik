import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components';
import { VK, DD, I, ic } from '../components/kiosk';
import { LoadingScreen, SubmissionSteps } from '../components/loading';
import { generateRequestId, getCurrentTimestamp } from '../utils/helpers';
import { addReceipt } from '../utils/receipts';
import { sleep, mockDelayRange } from '../utils/mockDelay';

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
  const [paymentStep, setPaymentStep] = useState(0);

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
    mockDelayRange(2200, 2800).then(() => {
      const found = mockProperties[propertyId.toUpperCase()];
      if (found) {
        setPropertyData(found);
        setStep(2);
      } else {
        setError('Property not found. Try PROP-2024-001 or PROP-2024-002 for demo.');
      }
      setLoading(false);
    });
  };

  const handlePay = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setPaymentStep(0);

    await sleep(900);
    setPaymentStep(1);
    await sleep(800);
    setPaymentStep(2);

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
    await sleep(700);
    setPaymentStep(3);
    setLoading(false);
    navigate(`/receipt?org=${encodeURIComponent(receiptData.serviceType)}&id=${encodeURIComponent(receiptData.requestId)}`);
  };

  if (loading) {
    return (
      <VK bg="color-mix(in oklab, var(--dept-water) 5%, var(--surface-0))">
        {step === 1 ? (
          <LoadingScreen heading="Looking up property…" variant="sweep" size={76} />
        ) : (
          <LoadingScreen
            heading="Processing your payment"
            variant="signal"
            size={62}
            extra={(
              <SubmissionSteps
                step={paymentStep}
                labels={['Saving payment details', 'Generating transaction reference', 'Confirming payment']}
              />
            )}
          />
        )}
      </VK>
    );
  }

  return (
    <VK bg="color-mix(in oklab, var(--dept-water) 5%, var(--surface-0))">
      <div>
        {/* Dept header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginBottom: 48 }}>
          <DD color="var(--dept-water)" glyph={ic.building} size={128} isz={72} />
          <div>
            <h1 className="h2">{t('municipal.propertyTax', 'Property Tax Payment')}</h1>
            <p className="body-l" style={{ marginTop: 14, color: 'var(--ink-500)' }}>
              Pay your municipal property tax online
            </p>
          </div>
        </div>

        {/* Step 1: Property Lookup */}
        {step === 1 && (
          <div className="card">
            <h2 className="h3" style={{ textAlign: 'center', marginBottom: 36 }}>
              Enter Property Details
            </h2>

            <label className="flab">{t('municipal.propertyId', 'Property ID / House Number')} *</label>
            <input
              className="field"
              value={propertyId}
              onChange={(e) => { setPropertyId(e.target.value.toUpperCase()); setError(''); }}
              placeholder={t('municipal.enterPropertyId', 'e.g., PROP-2024-001')}
              required
            />
            {error && <div className="meta" style={{ color: 'var(--err)' }}>{error}</div>}

            {/* Demo hint */}
            <div className="meta" style={{ marginTop: 20, color: 'var(--indigo-700)' }}>
              <strong>Demo:</strong> Try "PROP-2024-001" (₹8,500) or "PROP-2024-002" (₹36,000 with arrears)
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, marginTop: 48, paddingTop: 40, borderTop: '1.5px solid var(--line)' }}>
              <button className="btn btn-ghost" onClick={() => navigate('/municipal-menu')}>
                <I d={ic.back} size={40} /> {t('app.back')}
              </button>
              <button className="btn btn-pri btn-xl" onClick={handleLookup} disabled={!propertyId.trim()}>
                Look Up Property
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Property Details + Payment */}
        {step === 2 && propertyData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Property Details Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: 'var(--indigo-700)', color: 'var(--cream)', padding: 28 }}>
                <div className="label-tag" style={{ color: 'var(--cream)', opacity: 0.8 }}>Property Tax Assessment</div>
                <div className="h3" style={{ marginTop: 8, color: 'var(--cream)' }}>{propertyData.propertyId}</div>
              </div>
              <div style={{ padding: 28 }}>
                <div className="receipt-row"><span className="k">Owner Name</span><span className="v">{propertyData.ownerName}</span></div>
                <div className="receipt-row"><span className="k">Address</span><span className="v">{propertyData.address}</span></div>
                <div className="receipt-row"><span className="k">Property Type</span><span className="v">{propertyData.propertyType}</span></div>
                <div className="receipt-row"><span className="k">Built-Up Area</span><span className="v">{propertyData.area}</span></div>
                <div className="receipt-row"><span className="k">Zone</span><span className="v">{propertyData.zone}</span></div>
                <div className="receipt-row"><span className="k">Financial Year</span><span className="v">{propertyData.financialYear}</span></div>
                <div className="receipt-row"><span className="k">Last Paid</span><span className="v">{propertyData.lastPaidDate}</span></div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="card">
              <h3 className="h3" style={{ marginBottom: 24 }}>Payment Breakdown</h3>
              <div className="receipt-row"><span className="k">Current Year Tax</span><span className="v">₹{propertyData.currentDue.toLocaleString('en-IN')}</span></div>
              {propertyData.arrears > 0 && (
                <div className="receipt-row">
                  <span className="k" style={{ color: 'var(--err)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <I d={ic.sos} size={24} /> Arrears
                  </span>
                  <span className="v" style={{ color: 'var(--err)' }}>₹{propertyData.arrears.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="receipt-row" style={{ borderTop: '2px solid var(--indigo-300)', marginTop: 12, paddingTop: 20 }}>
                <span className="k" style={{ fontWeight: 700, color: 'var(--indigo-700)' }}>Total Payable</span>
                <span className="v" style={{ fontSize: 28, color: 'var(--indigo-700)' }}>₹{propertyData.totalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32 }}>
              <button className="btn btn-ghost" onClick={() => { setStep(1); setPropertyData(null); }}>
                <I d={ic.back} size={40} /> Search Again
              </button>
              <button className="btn btn-pri btn-xl" onClick={handlePay}>
                <I d={ic.check} size={40} /> Pay ₹{propertyData.totalPayable.toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        type="confirm"
        title={t('municipal.confirmPaymentTitle')}
        message={t('municipal.payForPropertyTax', { amount: propertyData?.totalPayable?.toLocaleString('en-IN'), propertyId: propertyData?.propertyId })}
        confirmText={t('municipal.confirmPaymentTitle')}
        cancelText={t('app.cancel')}
        onConfirm={handleConfirmPayment}
        onCancel={() => setShowConfirmModal(false)}
      />
    
    </VK>
  );
};

export default PropertyTaxPayment;

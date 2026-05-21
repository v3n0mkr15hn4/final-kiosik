import React from 'react';
import { RotateCcw } from 'lucide-react';
import Button from '../Button';
import NumericKeypad from '../NumericKeypad';

const OtpVerificationCard = ({
  otp,
  onOtpChange,
  onVerify,
  onResend,
  onEditMobile,
  resendTimer,
  loading,
  maskedMobile,
  error,
}) => (
  <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 sm:p-8 space-y-6">
    <div className="text-center">
      <h2 className="text-kiosk-xl font-bold text-government-blue">Verify OTP</h2>
      <p className="text-gray-600 text-sm sm:text-base mt-2">
        OTP sent to +91 {maskedMobile}
      </p>
    </div>

    <NumericKeypad
      value={otp}
      onChange={onOtpChange}
      maxLength={6}
      onSubmit={onVerify}
      submitLabel={loading ? 'Verifying...' : 'Verify OTP'}
      disabled={loading}
    />

    {error ? (
      <p className="text-center text-sm sm:text-base text-red-600 font-semibold">{error}</p>
    ) : null}

    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <Button variant="ghost" onClick={onEditMobile} disabled={loading}>
        Change Mobile
      </Button>
      <Button
        variant="ghost"
        onClick={onResend}
        disabled={loading || resendTimer > 0}
        icon={RotateCcw}
      >
        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
      </Button>
    </div>
  </div>
);

export default OtpVerificationCard;

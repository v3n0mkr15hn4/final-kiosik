import React from 'react';
import { Phone, ShieldCheck } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import LoadingSpinner from '../LoadingSpinner';

const PhoneOtpRequestCard = ({
  mobile,
  onMobileChange,
  onSendOtp,
  mobileError,
  maskedHint,
  loading,
  disabled = false,
}) => (
  <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 sm:p-8 space-y-5">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
        <ShieldCheck className="w-8 h-8 text-government-blue" />
      </div>
      <h2 className="text-kiosk-xl font-bold text-government-blue">Aadhaar Linked Mobile Verification</h2>
      <p className="text-gray-600 text-sm sm:text-base mt-2">
        Enter your Aadhaar-linked mobile number to receive OTP
      </p>
      {maskedHint ? (
        <p className="text-blue-700 text-sm font-semibold mt-2">Registered number hint: {maskedHint}</p>
      ) : null}
    </div>

    <div className="space-y-1">
      <label htmlFor="mobile-input" className="block text-kiosk-base font-semibold text-gray-700">
        Mobile Number
      </label>
      <div
        className={`flex items-stretch rounded-kiosk border-2 focus-within:ring-4 ${
          mobileError
            ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-200'
            : 'border-gray-300 focus-within:border-government-blue focus-within:ring-blue-200'
        }`}
      >
        <span className="px-4 flex items-center text-kiosk-lg font-bold text-government-blue border-r border-gray-200 bg-gray-50 rounded-l-kiosk">
          +91
        </span>
        <Input
          id="mobile-input"
          type="tel"
          value={mobile}
          onChange={(event) => onMobileChange(event.target.value)}
          placeholder="Enter 10-digit mobile number"
          icon={Phone}
          error={mobileError}
          maxLength={10}
          disabled={disabled || loading}
          className="!mb-0"
          inputClassName="!border-0 !rounded-l-none !focus:ring-0"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="tel-national"
        />
      </div>
    </div>

    <Button
      onClick={onSendOtp}
      disabled={disabled || loading || mobile.length !== 10 || Boolean(mobileError)}
      fullWidth
      size="xlarge"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <LoadingSpinner size="small" />
          Sending OTP...
        </span>
      ) : (
        'Send OTP'
      )}
    </Button>
  </div>
);

export default PhoneOtpRequestCard;

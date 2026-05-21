import axios from 'axios';

const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';
const FAST2SMS_WALLET_URL = 'https://www.fast2sms.com/dev/wallet';

function getFast2SmsKey() {
  const key = (process.env.FAST2SMS_API_KEY || '').trim();
  if (!key) {
    throw new Error('FAST2SMS_API_KEY is not configured.');
  }
  return key;
}

function normalizeProviderMessage(message) {
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string') return message;
  return 'Unknown Fast2SMS error.';
}

function parseFast2SmsError(error) {
  if (!error?.response) {
    return {
      httpStatus: 502,
      providerStatusCode: null,
      message: error?.message || 'Fast2SMS request failed.',
      raw: null,
    };
  }

  const data = error.response.data || {};
  return {
    httpStatus: error.response.status || 502,
    providerStatusCode: data.status_code || null,
    message: normalizeProviderMessage(data.message),
    raw: data,
  };
}

async function postFast2SmsJson({ apiKey, payload }) {
  const response = await axios.post(
    FAST2SMS_URL,
    payload,
    {
      timeout: 15000,
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
    }
  );
  return response?.data || {};
}

function assertFast2SmsSuccess(data) {
  if (!data.return) {
    const reason = normalizeProviderMessage(data.message);
    throw new Error(`Fast2SMS send failed: ${reason}`);
  }
}

export async function checkFast2SmsWallet() {
  const apiKey = getFast2SmsKey();
  const response = await axios.get(FAST2SMS_WALLET_URL, {
    timeout: 10000,
    params: { authorization: apiKey },
  });
  return response?.data || {};
}

export async function sendFast2SmsOtp({ mobile, otp }) {
  const apiKey = getFast2SmsKey();
  const maskedMobile = String(mobile).slice(-4).padStart(10, '*');
  const message = `Your SUVIDHA verification OTP is ${String(otp)}`;

  try {
    const data = await postFast2SmsJson({
      apiKey,
      payload: {
        route: 'q',
        message,
        language: 'english',
        numbers: String(mobile),
      },
    });
    assertFast2SmsSuccess(data);
    console.log('[OTP][Fast2SMS] Route=q success', {
      requestId: data.request_id || null,
      mobile: maskedMobile,
      providerMessage: normalizeProviderMessage(data.message),
      response: data,
    });
    return {
      requestId: data.request_id,
      message: data.message,
      routeUsed: 'q',
    };
  } catch (fast2smsError) {
    const parsed = parseFast2SmsError(fast2smsError);
    console.warn('[OTP][Fast2SMS] Route=q failed', {
      mobile: maskedMobile,
      httpStatus: parsed.httpStatus,
      providerStatusCode: parsed.providerStatusCode,
      providerMessage: parsed.message,
      raw: parsed.raw,
    });
    const error = new Error(parsed.message);
    error.provider = parsed;
    throw error;
  }
}

export function formatFast2SmsActionMessage(providerStatusCode, providerMessage) {
  const code = Number(providerStatusCode);
  if (code === 996) {
    return 'Fast2SMS OTP route not activated. Complete OTP KYC/website verification in Fast2SMS dashboard.';
  }
  if (code === 999) {
    return 'Fast2SMS API route blocked. Complete one transaction of Rs.100+ in Fast2SMS wallet.';
  }
  if (code === 412 || code === 413) {
    return 'Fast2SMS authorization key is invalid or disabled.';
  }
  if (code === 414) {
    return 'Current server IP is blocked in Fast2SMS Dev API settings.';
  }
  if (code === 416) {
    return 'Fast2SMS wallet balance is insufficient.';
  }
  if (providerMessage) return providerMessage;
  return 'Fast2SMS request failed.';
}

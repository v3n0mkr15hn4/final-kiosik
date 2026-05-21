export const normalizeIndianMobile = (value = '') => value.replace(/\D/g, '').slice(0, 10);

export const isValidIndianMobile = (mobile = '') => /^[6-9]\d{9}$/.test(mobile);

export const toIndianE164 = (mobile = '') => `+91${mobile}`;

export const maskMobile = (mobile = '') => {
  const normalized = normalizeIndianMobile(mobile);
  if (!normalized) return '';
  return normalized.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2');
};

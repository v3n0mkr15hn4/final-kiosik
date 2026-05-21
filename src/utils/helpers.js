// Generate unique request ID
export const generateRequestId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SVD-${timestamp}-${random}`;
};

// Generate complaint ID
export const generateComplaintId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CMP-${year}${month}${day}-${random}`;
};

// Format date for display
export const formatDate = (date, locale = 'en-IN') => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Format date short
export const formatDateShort = (date, locale = 'en-IN') => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

// Validate mobile number
export const validateMobile = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

// Validate email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate OTP
export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

// File size check (in bytes)
export const validateFileSize = (file, maxSizeMB = 5) => {
  const maxSize = maxSizeMB * 1024 * 1024;
  return file.size <= maxSize;
};

// File type check
export const validateFileType = (file, allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']) => {
  return allowedTypes.includes(file.type);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Session storage helpers
export const session = {
  set: (key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  get: (key) => {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  remove: (key) => {
    sessionStorage.removeItem(key);
  },
  clear: () => {
    sessionStorage.clear();
  },
};

// Local storage helpers
export const storage = {
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get: (key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  remove: (key) => {
    localStorage.removeItem(key);
  },
};

// Print receipt
export const printReceipt = () => {
  window.print();
};

// Get current timestamp
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const STORAGE_KEY = 'kiosk_receipts';

/**
 * Add a new receipt to the local storage and set it as the last receipt
 * @param {Object} receiptData - The receipt data to save
 */
export const addReceipt = (receiptData) => {
  try {
    const ownerAadhaar = sessionStorage.getItem('aadhaarUid') || '';
    const ownerMobile = sessionStorage.getItem('userMobile') || '';
    const ownerName = sessionStorage.getItem('userName') || '';

    const normalizedReceipt = {
      ...receiptData,
      ownerAadhaar: receiptData.ownerAadhaar || ownerAadhaar,
      ownerMobile: receiptData.ownerMobile || ownerMobile || receiptData.mobile || '',
      ownerName: receiptData.ownerName || ownerName || receiptData.citizenName || '',
      timestamp: receiptData.timestamp || new Date().toISOString(),
    };

    // Save as last receipt for the immediate receipt page
    sessionStorage.setItem('lastReceipt', JSON.stringify(normalizedReceipt));

    // Also keep a history in localStorage if needed by track status
    const existingReceiptsStr = localStorage.getItem(STORAGE_KEY);
    const existingReceipts = existingReceiptsStr ? JSON.parse(existingReceiptsStr) : [];
    
    // Add new receipt to the beginning of the array
    existingReceipts.unshift(normalizedReceipt);
    
    // Keep only the last 50 receipts to prevent localStorage from growing too large
    if (existingReceipts.length > 50) {
      existingReceipts.pop();
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingReceipts));
  } catch (error) {
    console.error('Error saving receipt:', error);
  }
};

/**
 * Get all receipts from local storage
 * @returns {Array} Array of receipt objects
 */
export const getReceipts = () => {
  try {
    const existingReceiptsStr = localStorage.getItem(STORAGE_KEY);
    if (!existingReceiptsStr) return [];

    const parsedReceipts = JSON.parse(existingReceiptsStr);
    if (!Array.isArray(parsedReceipts)) return [];

    return parsedReceipts;
  } catch (error) {
    console.error('Error getting receipts:', error);
    return [];
  }
};

/**
 * Get a specific receipt by ID
 * @param {string} id - The request ID to look for
 * @returns {Object|null} The receipt object or null if not found
 */
export const getReceiptById = (id) => {
  const receipts = getReceipts();
  return receipts.find(r => r.requestId === id) || null;
};

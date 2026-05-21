/**
 * API utilities — connects to real backend server.
 * Falls back to mock/demo behavior if the backend is unreachable.
 * Import the granular API modules from apiService.js for typed access.
 */

import { serviceAPI, complaintAPI, trackAPI, otpAPI } from './apiService';

// Simulated network delay (fallback only)
const simulateDelay = (ms = 1500) => new Promise(r => setTimeout(r, ms));

/**
 * API wrapper — calls real backend, falls back to mock on failure.
 */
export const mockAPI = {
  sendOTP: async ({ uid, mobile }) => {
    try {
      return await otpAPI.sendOtp({ uid, mobile });
    } catch (error) {
      await simulateDelay();
      return { success: false, error: error?.error || 'Unable to send OTP.' };
    }
  },
  verifyOTP: async ({ uid, mobile, otp }) => {
    try {
      return await otpAPI.verifyOtp({ uid, mobile, otp });
    } catch (error) {
      await simulateDelay();
      return { success: false, error: error?.error || 'OTP verification failed.' };
    }
  },
  submitRequest: async (serviceType, data) => {
    try {
      return await serviceAPI.submit({ serviceType, ...data });
    } catch {
      await simulateDelay(2000);
      return { success: true, requestId: `REQ-${Date.now()}` };
    }
  },
  trackRequest: async (requestId) => {
    try {
      return await trackAPI.byRequestId(requestId);
    } catch {
      await simulateDelay();
      return { success: true, status: 'in-progress' };
    }
  },
};

export default mockAPI;

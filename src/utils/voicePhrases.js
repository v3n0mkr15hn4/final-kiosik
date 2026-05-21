/**
 * Common navigation phrases pre-cached for offline TTS.
 * All phrases are in English — the TTS service handles translation/bridging.
 * Grouped by category for maintainability.
 */

export const VOICE_PHRASES = [
  // ── Welcome & Navigation ──
  'Welcome to SUVIDHA',
  'Select an organization',
  'Electricity Department',
  'Assam Gas Department',
  'Municipal Department',
  'Go back',
  'Home',
  'Logout',
  'Session ended',
  'Please select a language to continue',

  // ── Service Names ──
  'New connection',
  'Register complaint',
  'Track request',
  'View receipts',
  'Update profile',
  'Healthcare services',
  'Transport services',
  'Sanitation services',
  'Government schemes',
  'Family profile',
  'Office locator',
  'Track status',

  // ── Electricity Services ──
  'New connection and load extension',
  'Meter replacement and shifting',
  'Complaint registration',
  'Update consumer information',
  'View electricity receipts',

  // ── Gas Services ──
  'New gas connection',
  'Meter malfunction or damage',
  'Check your gas bills',
  'Edit your profile and credentials',

  // ── Municipal Services ──
  'New water connection',
  'Register municipal grievance',
  'Receipt generation',

  // ── Forms & Actions ──
  'Please fill in all required fields',
  'Your request has been submitted successfully',
  'Your application reference number has been generated',
  'Upload your document',
  'Enter your Aadhaar number',
  'Enter your mobile number',
  'Please enter a valid mobile number',

  // ── Voice Commands ──
  'Listening',
  'Speak now',
  'Voice command activated',
  'Say the name of the service you want',
  'Voice command not recognized, please try again',

  // ── Offline & Errors ──
  'You are currently offline',
  'Please try again',
  'Your session has expired',
  'Your form has been saved and will be submitted when you are back online',
  'Connection restored',

  // ── Accessibility ──
  'High contrast mode enabled',
  'Text size increased',
  'Blind mode activated',
  'Screen reader enabled',

  // ── OTP & Auth ──
  'An OTP has been sent to your mobile number',
  'Please enter the OTP',
  'Login successful',
  'Invalid credentials, please try again',
];

/**
 * Returns a subset of critical navigation phrases to cache first.
 * Used when the user just selected a language and we want to cache the most
 * important phrases immediately before they start navigating.
 */
export const CRITICAL_PHRASES = [
  'Welcome to SUVIDHA',
  'Select an organization',
  'Electricity Department',
  'Assam Gas Department',
  'Municipal Department',
  'Go back',
  'Home',
  'Logout',
  'Please fill in all required fields',
  'Your request has been submitted successfully',
  'Listening',
  'Speak now',
  'You are currently offline',
];

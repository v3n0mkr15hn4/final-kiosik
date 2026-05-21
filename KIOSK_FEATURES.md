**Kiosk Features — Smart Urban Digital Helpdesk Assistant (Suvidha 2026)**

**Overview**
- **Purpose:** A public-facing kiosk UI that helps citizens access municipal and utility services quickly and securely.
- **Core capabilities:** multilingual voice/UI interaction, file upload + OCR, mobile/QR handoff, authenticated transactions, complaint filing & tracking, offline support, accessibility features, and AI chat assistance.

**Core Features**
- **Voice Interaction:** Voice wake-word, navigation, and spoken instructions using `src/components/WakeWordListener.jsx`, `src/components/VoiceNavigation.jsx`, and `src/utils/ttsService.js`.
- **Multilingual UI:** Full i18n support with Marathi/Hindi/English/Tamil via `src/i18n/*` and `react-i18next`.
- **Accessibility Suite:** Screen reader overlay, accessibility toolbar, adjustable UI (`src/components/ScreenReaderOverlay.jsx`, `src/components/AccessibilityToolbar.jsx`, `src/components/AccessibilityProvider.jsx`).
- **AI Chatbot:** Conversational assistant component `src/components/AIChatbot.jsx` for guided help and FAQ-like interactions.
- **File Upload + OCR:** Users can upload images/documents via `src/components/FileUpload.jsx` and `src/components/QRUpload.jsx`. OCR is powered by `tesseract.js` (dependency) to extract text for forms.
- **Mobile Handoff / QR & Send-to-Phone:** `src/components/SendToPhone.jsx` and `src/pages/MobileUpload.jsx` let users continue tasks on their phone by scanning a QR code or receiving an SMS/OTP link.
- **Authentication & Guest Modes:** Phone OTP flow and guest gating available (`src/components/auth/PhoneOtpRequestCard.jsx`, `src/components/auth/OtpVerificationCard.jsx`, `src/components/GuestGate.jsx`).
- **Department Services & Templates:** Pre-built pages and flows for Electricity, Gas, Water, Municipal, Transport, Sanitation, Healthcare, Property Tax, Schemes, and more (`src/pages/*` such as `Electricity.jsx`, `Gas.jsx`, `Municipal.jsx`, `PropertyTaxPayment.jsx`, `SchemeDiscovery.jsx`).
- **Complaint Filing & Tracking:** Create complaints, submit attachments, and track status via `src/pages/Complaints.jsx`, `src/pages/TrackStatus.jsx`, and `src/utils/receipts.js`.
- **Payments & Receipts:** Payment-ready flows and printable receipts (`src/pages/Receipt.jsx`, `src/pages/PropertyTaxPayment.jsx`).
- **Office Locator & Contact Info:** `src/pages/OfficeLocator.jsx` and `src/utils/officeData.js` provide nearby office details and contact points.
- **Emergency Quick Access:** Emergency banner and quick actions (`src/components/EmergencyQuickAccess.jsx`, `src/components/EmergencyAlertBanner.jsx`).
- **Offline Mode & Caching:** Offline-safe UI and cached audio/assets via `src/utils/offline.js` and `src/utils/offlineAudioCache.js`.
- **Security & Privacy:** Utility functions in `src/utils/security.js` (sanitization, token handling) and server-side protections expected in the backend `server/` folder.
- **Receipt & Record Export:** `src/utils/receipts.js` to format and export submission receipts.

**Primary User Flows**
- **Kiosk Start:** `Landing` -> `ModeSelection` (Guest / Auth) -> optional OTP login -> `Home` / `Dashboard`.
- **Find Service:** From `Home` choose a department card (`DepartmentUI.jsx`) -> open service page (example `ElectricityMenu.jsx`).
- **Submit Document / Complaint:** Use `FileUpload`/`QRUpload` -> preview (`FilePreviewModal.jsx`) -> OCR extracts fields -> confirm & submit -> show receipt (`Receipt.jsx`) and QR for mobile handoff.
- **Track Status:** Use `TrackStatus.jsx` with receipt ID to view timeline (`Timeline.jsx`) and updates.
- **Send to Phone / Continue on Mobile:** Generate QR or SMS link via `SendToPhone.jsx` / `MobileUpload.jsx`.

**Technical Notes & Where to Look**
- **Frontend entry:** [kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/src/App.jsx](kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/src/App.jsx#L1-L300)
- **Pages:** See `src/pages/` for service-specific flows (`Landing.jsx`, `Home.jsx`, `Login.jsx`, `Complaints.jsx`, `TrackStatus.jsx`, `PropertyTaxPayment.jsx`).
- **Components:** See `src/components/` for upload, auth, voice, accessibility, AI, and UI building blocks.
- **Utils:** API and offline helpers in `src/utils/` (`apiService.js`, `security.js`, `offline.js`, `ttsService.js`, `sarvamAPI.js`).
- **i18n assets:** `src/i18n/locales/` contains language strings.
- **Backend:** A `server/` directory exists for server-side upload, auth, and integration; review its routes and security measures.

**Integrations & Dependencies**
- **OCR:** `tesseract.js` for client-side OCR and text extraction.
- **QR / Mobile Handoff:** `qrcode.react` to render QR codes.
- **Auth & SMS/OTP:** Phone OTP helper in `src/utils/phoneAuth.js` and auth components in `src/components/auth`.
- **AI/Chat:** Client-side chatbot component integrates with backend or an external conversational service (see `AIChatbot.jsx`).
- **i18n:** `i18next` + `react-i18next` for translations and language detection.

**Accessibility & Inclusion**
- **Screen reader-friendly UI:** Overlay and toggleable accessibility toolbar for larger text and contrast.
- **Voice-first navigation:** Wake-word and voice prompts for hands-free operation.
- **Numeric keypad & large controls:** `NumericKeypad.jsx` and large-action `Button.jsx` components for kiosk touch screens.

**Security & Privacy Considerations**
- **Limit PII on kiosk screens:** Use `GuestGate.jsx` and phone handoff flow to transfer sensitive data to a personal device whenever possible.
- **Secure uploads:** Sanitize/validate files server-side; sign/expire mobile handoff links; rate-limit OTP endpoints.
- **Local caching:** Encrypt any cached PII or avoid storing long-term on the kiosk. See `src/utils/security.js`.

**Extensibility & Next Steps**
- Add backend webhooks for payment confirmations and complaint lifecycle updates.
- Add biometric / card reader support if hardware-enabled kiosks are required.
- Replace or augment the AIChatbot with a hosted conversational model for richer dialogs.

**Where this document is saved**
- `KIOSK_FEATURES.md` (this file) — root of the frontend project.

If you'd like, I can: generate a short user-facing one-page quickstart, produce an admin checklist for deploying kiosks, or open any of the referenced files and extract exact code snippets for documentation.

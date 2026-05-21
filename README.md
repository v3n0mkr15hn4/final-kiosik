# SUVIDHA 2026

**Smart Urban Digital Helpdesk Assistant**

A one-stop unified public services kiosk system that bridges the digital divide for inclusive governance. SUVIDHA brings all essential civic services -- electricity, gas, water, sanitation, municipal, transport, healthcare, complaints, and welfare scheme discovery -- into a single accessible, multilingual, voice-enabled touch kiosk.

**Live Demo:** https://suvidha-2026-iota.vercel.app

**Demo Aadhaar Numbers:** 999900001234 (Normal User), 999900005678 (Elderly), 999900009012 (Visually Impaired), 999900003456 (Child), 999900007890 (Physically Impaired), 999900000000 (Admin)

---

## Problem Statement

Millions of citizens, particularly the elderly, visually impaired, and rural populations, struggle to access government welfare schemes due to:

- Complex, fragmented application processes spread across multiple departments
- Language barriers and lack of digital literacy
- No single platform that aggregates all civic services
- Inaccessible interfaces that exclude persons with disabilities

SUVIDHA solves this by providing a unified, accessible, voice-enabled kiosk that any citizen can walk up to and use -- regardless of literacy level, language, or disability.

---

## Key Features

**Multi-Department Service Hub** -- File requests across 7 government departments (Electricity, Gas, Water, Sanitation, Municipal, Transport, Healthcare) from one interface, with cascading location selection (State, City, Ward) and document upload.

**AI-Powered Scheme Discovery** -- Profile-aware matching engine that scores 20+ government welfare schemes (PM-Kisan, PMAY, Ayushman Bharat, and more) against citizen demographic data, showing match percentages and direct apply actions.

**Aadhaar-Based Authentication** -- Two-step login with Aadhaar lookup followed by OTP, QR Code, or Biometric (fingerprint + iris) verification. Iris scan is automatically exempted for visually impaired users.

**Automatic Accessibility Detection** -- The system reads the citizen's disability status and age from their Aadhaar record and auto-selects the appropriate accessibility mode (Blind, Elderly, or Normal) before the user even reaches the home screen.

**"Hey Suvidha" Wake Word** -- Always-listening wake word detection transforms the kiosk into voice-first mode mid-session. Supported in English, Hindi, and Tamil.

**Full Voice Navigation** -- Trilingual voice command system with text-to-speech feedback. In blind mode, the system continuously listens, announces every page change, and reads all on-screen content automatically.

**Screen Reader Overlay** -- MutationObserver-based page reader that detects route changes and reads headings, paragraphs, buttons, links, and ARIA labels aloud (up to 20 elements per page).

**Trilingual Interface** -- Complete localization in English, Hindi, and Tamil. All data -- office names, scheme descriptions, emergency alerts, voice commands -- carry translations in all three languages.

**Complaint Management** -- File civic complaints with photo capture (camera or file upload), GPS location tagging, AI auto-classification badges, and duplicate detection indicators.

**Family Profile and Dependents** -- Add children and elderly parents with optional Aadhaar and disability fields, then use Scheme Discovery to find schemes they qualify for.

**Government Office Locator** -- Find nearby offices filtered by state, city, ward, and service type, with auto-fill from Aadhaar address data. Shows directions, contact info, and working hours.

**QR-Based Document Upload** -- Solves the "kiosk has no file system" problem by generating a QR code that lets users upload documents from their personal phone directly to the kiosk session.

**Emergency Layer (Always Visible)** -- SOS button with 9 emergency numbers (Ambulance 108, Police 100, Fire 101, Women Helpline 1091, etc.) and an alert banner showing IMD/NDMA weather and air quality warnings. Renders above everything, requires no login, and dials directly via tel: links.

**Offline-First Architecture** -- IndexedDB-backed submission queue with service worker caching. Forms submitted offline are stored locally, automatically synced when connectivity returns, and cleaned up after successful delivery.

**Admin Dashboard** -- Four-tab analytics panel with KPI cards, department performance charts, application review workflows, grievance resolution tracking, and a security/compliance checklist (DPDP Act, AES-256, RBAC, SSL).

**Inactivity Auto-Logout** -- 5-minute timeout with a 30-second countdown warning modal, critical for public kiosks to protect the next user's session.

**Progressive Web App** -- Fullscreen, portrait-locked PWA manifest with service worker for installation on kiosk hardware.

---

## Architecture

```
+-----------------------------------------------------------------------+
|                           SUVIDHA Kiosk UI                            |
|                                                                       |
|  +---------------------+  +----------------------------------------+ |
|  |   Global Overlays   |  |           React Router v6              | |
|  |                     |  |                                        | |
|  | EmergencyAlertBanner|  |  Landing --> Login --> ModeSelection   | |
|  | EmergencyQuickAccess|  |                |                       | |
|  | OfflineIndicator    |  |                v                       | |
|  | ScreenReaderOverlay |  |  Home (Service Grid)                   | |
|  | WakeWordListener    |  |    |                                   | |
|  | VoiceNavigation     |  |    +-- Electricity / Gas / Water /     | |
|  | AccessibilityToolbar|  |    |   Sanitation / Municipal /        | |
|  |                     |  |    |   Transport / Healthcare           | |
|  +---------------------+  |    +-- Complaints                      | |
|                            |    +-- SchemeDiscovery                 | |
|                            |    +-- OfficeLocator                   | |
|                            |    +-- FamilyProfile                   | |
|                            |    +-- TrackStatus (public)            | |
|                            |    +-- Receipt                         | |
|                            |    +-- Dashboard (admin only)          | |
|                            +----------------------------------------+ |
+-----------------------------------------------------------------------+
```

### Application Shell

The App component is the outermost shell. It wraps the entire tree in an `AccessibilityProvider` context, registers the service worker on mount, and renders seven global overlay components that are always active regardless of the current route. Inside, an `InactivityHandler` monitors user activity and auto-logs out after 5 minutes.

### Three-Tier Route Protection

Routes are wrapped in one of three guards:

| Guard           | Who Gets In                              | Fallback Behavior                   |
|-----------------|------------------------------------------|-------------------------------------|
| ProtectedRoute  | Any authenticated user (guest or citizen)| Redirects to Landing                |
| CitizenRoute    | Aadhaar-verified citizens only           | Shows inline GuestGate login prompt |
| AdminRoute      | Users with isAdmin flag                  | Redirects to Home                   |

Public routes (Landing, Login, Track Status) require no authentication.

### Authentication Flow

```
Landing
  |
  +-- [Guest] --> sessionStorage(isGuest=true) --> ModeSelection --> Home (limited)
  |
  +-- [Citizen Login]
        |
        +-- Enter 12-digit Aadhaar
        |     |
        |     v
        |   lookupAadhaar() --> Show profile preview
        |
        +-- Choose verification method
        |     |
        |     +-- OTP --> NumericKeypad --> verifyAadhaarOTP()
        |     +-- QR Code --> Simulated QR scan
        |     +-- Biometric --> Fingerprint + Iris (iris exempt if blind)
        |
        +-- On success:
              - Auto-detect accessibility mode from disability/age
              - Auto-switch i18n language from Aadhaar record
              - Store user data in sessionStorage
              - Navigate to ModeSelection --> Home
```

### Accessibility Architecture (WCAG 2.1 AA)

```
AccessibilityProvider (React Context)
  |
  +-- Three user modes: Normal / Blind / Elderly
  |     - Auto-detected from Aadhaar disability field and age
  |     - Blind: high contrast + xlarge font + reduced motion + voice always on
  |     - Elderly: large font + high contrast
  |
  +-- Settings: highContrast, fontSize (4 tiers), reducedMotion
  |     - Persisted in localStorage (contrast, font) and sessionStorage (mode)
  |     - Applied as CSS classes on <html> and <body>
  |
  +-- screenReaderAnnounce() --> hidden aria-live="polite" region
  |
  +-- AccessibilityToolbar (floating FAB)
  |     - High contrast toggle (role="switch", aria-pressed)
  |     - 4-tier font size selector
  |     - Min 48px touch targets
  |
  +-- ScreenReaderOverlay
  |     - MutationObserver on #root detects route changes
  |     - Reads headings, paragraphs, buttons, links, aria-labels
  |     - Announces focused elements with role prefix
  |
  +-- VoiceNavigation
  |     - Trilingual command-to-route maps (EN/HI/TA)
  |     - TTS feedback with language-appropriate voices
  |     - Continuous recognition in blind mode
  |
  +-- WakeWordListener
        - "Hey Suvidha" / "He Suvidha" / "Hey Suvidha" (HI/TA)
        - Full-screen flash animation on detection
        - Activates blind mode + speaks greeting
```

### Offline and Sync Strategy

```
Service Worker (public/sw.js)
  |
  +-- Install: Cache index.html + favicon
  +-- Fetch strategies:
  |     - API calls (/api/*): Network-first, cache fallback
  |     - Static assets: Cache-first, network fallback
  |     - Navigation: Fallback to index.html (SPA)
  +-- Background Sync: sync-submissions tag
  |
  v
IndexedDB (suvidha-offline database)
  |
  +-- pending-submissions object store
  |     - savePendingSubmission() when offline
  |     - getPendingSubmissions() on reconnect
  |     - markAsSynced() after API success
  |     - clearSyncedSubmissions() cleanup
  |     - Falls back to localStorage if IndexedDB unavailable
  |
  v
OfflineIndicator Component
  +-- Red "You are offline" banner
  +-- Green "Back online! Syncing..." banner
  +-- role="alert" aria-live="assertive"
```

### Security Measures

| Layer                   | Implementation                                                      |
|-------------------------|---------------------------------------------------------------------|
| XSS Prevention          | HTML entity encoding, tag stripping, sanitizeFormData() on all inputs |
| CSRF Protection         | Token generated via crypto.getRandomValues(), stored in sessionStorage |
| Session Security        | Expiry timestamps + browser fingerprint (UA, screen, timezone, hardware concurrency) |
| Rate Limiting           | Client-side sliding window rate limiter (Map-based)                  |
| File Upload Validation  | MIME type, file size, dangerous extension, and double extension checks |
| Content Security Policy | CSP meta tag helper with strict source directives                    |
| Kiosk Hardening (CSS)   | No text selection, no tap highlights, no overscroll, touch-manipulation only |

### Voice and Wake Word System

```
WakeWordListener (always-on background)
  |
  +-- Continuous SpeechRecognition listening for "Hey Suvidha"
  |   (English, Hindi, Tamil variants)
  |
  +-- On detection:
        - Full-screen purple flash animation
        - Activate blind mode via AccessibilityProvider
        - Speak trilingual greeting via TTS
        - Yield control to VoiceNavigation
              |
              +-- Trilingual command maps:
              |     "electricity" / "bijli" / "minsaram" --> /electricity
              |     "water" / "paani" / "thanneer" --> /water
              |     "back" / "wapas" / "pin" --> navigate(-1)
              |     "logout" / "bahar" / "veliyeru" --> clear session
              |
              +-- TTS feedback after each navigation
              +-- Help command lists available commands
              +-- Auto-restart recognition on end (blind mode)
```

---

## Technology Stack

| Layer              | Technology                                 |
|--------------------|--------------------------------------------|
| UI Framework       | React 18 with functional components        |
| Build Tool         | Vite 5                                     |
| Routing            | React Router v6 (declarative)              |
| Styling            | Tailwind CSS 3 with kiosk-specific layers  |
| State Management   | React Context + sessionStorage             |
| HTTP Client        | Axios (mock API layer, swappable)          |
| Localization       | i18next + react-i18next + LanguageDetector |
| Offline Storage    | IndexedDB with localStorage fallback       |
| Voice              | Web Speech API (Recognition + Synthesis)   |
| Icons              | Lucide React                               |
| PWA                | Service Worker + Web App Manifest          |
| Deployment         | Vercel with SPA rewrite rules              |

---

## Project Structure

```
src/
  App.jsx                   Application shell, routing, global overlays
  index.jsx                 React entry point
  index.css                 Tailwind base + kiosk-specific styles

  components/
    AccessibilityProvider   WCAG 2.1 AA context (modes, contrast, font, motion)
    AccessibilityToolbar    Floating settings panel (contrast, font size)
    VoiceNavigation         Trilingual voice commands + TTS feedback
    WakeWordListener        "Hey Suvidha" always-on wake word detection
    ScreenReaderOverlay     MutationObserver-based automatic page reader
    EmergencyAlertBanner    IMD/NDMA alert ticker (always visible)
    EmergencyQuickAccess    SOS button with 9 emergency numbers
    OfflineIndicator        Real-time network status banner
    GuestGate               Inline login prompt for guest users
    Header                  Navigation bar with language switcher
    NumericKeypad           Touch-optimized OTP entry (80x80px buttons)
    QRUpload                Phone-to-kiosk document upload via QR
    SendToPhone             SMS/WhatsApp receipt delivery
    FileUpload              Drag-and-drop with type/size validation
    Timeline                Vertical status tracker with animations
    Button, Card, Input,    Reusable UI primitives
    Modal, Select, TextArea

  pages/
    Landing                 Entry point: Guest or Citizen Login
    Login                   Aadhaar lookup + OTP/QR/Biometric auth
    ModeSelection           Accessibility mode + language chooser
    Home                    Service category grid (12 tiles)
    Electricity             Service request form (representative)
    Gas, Water, Sanitation  Department-specific service forms
    Municipal, Transport
    Healthcare
    Complaints              Photo capture + GPS + AI classification
    SchemeDiscovery         Profile-based scheme matching engine
    OfficeLocator           Nearby government office finder
    FamilyProfile           Dependent management for scheme eligibility
    TrackStatus             Public request/complaint tracker
    Receipt                 Printable receipt + Send-to-Phone
    Dashboard               Admin analytics (4 tabs)

  i18n/
    index.js                i18next config (EN, HI, TA)
    locales/
      en.json               English translations
      hi.json               Hindi translations
      ta.json               Tamil translations

  utils/
    api.js                  Mock API layer (swappable with real endpoints)
    constants.js            States, cities, wards, service categories (trilingual)
    helpers.js              Validators, formatters, ID generators, debounce
    offline.js              IndexedDB offline queue + sync lifecycle
    security.js             XSS, CSRF, rate limiting, session fingerprinting
    aadhaarDatabase.js      Mock UIDAI database (6 demo profiles)
    officeData.js           15 government offices (trilingual)

public/
    manifest.json           PWA manifest (fullscreen, portrait, kiosk mode)
    sw.js                   Service worker (cache strategies + background sync)
```

---

## What Makes SUVIDHA Different

**Aadhaar-driven accessibility auto-detection** -- The system reads disability and age data from the citizen's Aadhaar record and automatically configures the interface (blind mode for visually impaired, elderly mode for 60+, child-safe for minors) before the user reaches the home screen.

**Voice-first interaction model** -- A citizen can walk up to the kiosk, say "Hey Suvidha," and navigate every service entirely by voice in their preferred language, with continuous TTS feedback reading every page.

**QR-based phone-to-kiosk upload** -- Public kiosks have no file browser. SUVIDHA generates a QR code that opens an upload session on the citizen's personal phone, transferring documents directly into the kiosk session.

**Emergency layer with zero barriers** -- The SOS button and disaster alert banner are always visible, require no login, and dial emergency services directly. This is non-negotiable for a public-facing terminal.

**Offline-first for rural deployment** -- Every form submission is queued in IndexedDB when offline and automatically synced when connectivity returns. The kiosk never shows a blank screen or loses citizen data.

**Trilingual data model** -- Not just UI labels, but every piece of content (office names, scheme descriptions, emergency alerts, Aadhaar records, voice commands) carries translations in all three languages.

---

## Team

SASTRA Deemed University, Thanjavur, Tamil Nadu

4 Members
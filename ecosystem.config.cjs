/**
 * PM2 ecosystem — local physical kiosk mode.
 * Starts all 3 services with one command: pm2 start ecosystem.config.cjs
 *
 * Requires:
 *   npm run build          (builds React → dist/)
 *   pip install flask pyaadhaar opencv-python pyzbar requests
 */

module.exports = {
  apps: [
    // ── Express API + static React serve ─────────────────────────────────
    {
      name: 'suvidha-api',
      script: 'server/index.js',
      cwd: '.',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        SERVE_STATIC: 'true',           // serves dist/ at localhost:3000
        AADHAAR_DECODER_URL: 'http://127.0.0.1:5001',
        DECODER_API_SECRET: 'suvidha-decoder-dev-2026',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },

    // ── Flask Aadhaar Secure QR decoder ──────────────────────────────────
    {
      name: 'aadhaar-decoder',
      script: 'server/flask-aadhaar/app.py',
      interpreter: 'python',
      cwd: '.',
      env: {
        PORT: 5001,
        DECODER_API_SECRET: 'suvidha-decoder-dev-2026',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },

    // ── Physical camera QR scanner ────────────────────────────────────────
    // Comment this out if no USB webcam is attached.
    {
      name: 'aadhaar-scanner',
      script: 'scanner_service.py',
      interpreter: 'python',
      cwd: '.',
      env: {
        BACKEND_URL: 'http://127.0.0.1:3000/api/kiosk/aadhaar-scan',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};

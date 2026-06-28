#!/usr/bin/env python3
"""
scanner_service.py — Physical Aadhaar QR scanner for SUVIDHA kiosk.

Runs as a PM2 daemon on the kiosk machine. Captures from USB/Pi camera via
OpenCV, decodes Aadhaar Secure QR via pyaadhaar, then POSTs structured citizen
fields to the local Express backend so the React frontend can prefill forms.

Setup:
  pip install opencv-python pyzbar pyaadhaar requests
  pm2 start scanner_service.py --interpreter python3 --name aadhaar-scanner
  pm2 save

The backend endpoint is http://localhost:3000/api/kiosk/aadhaar-scan (localhost only).
"""

import cv2
import json
import logging
import os
import sys
import time
from pathlib import Path

import requests
from pyzbar.pyzbar import decode as pyzbar_decode

try:
    from pyaadhaar.decode import AadhaarSecureQr
    PYAADHAAR_OK = True
except ImportError:
    PYAADHAAR_OK = False

# ── Config ────────────────────────────────────────────────────────────────────
CAMERA_INDEX      = int(os.environ.get("CAMERA_INDEX", "0"))
BACKEND_URL       = os.environ.get("BACKEND_URL", "http://localhost:3000/api/kiosk/aadhaar-scan")
FALLBACK_FILE     = "/tmp/suvidha_aadhaar_latest.json"
LOG_FILE          = "/tmp/suvidha_scanner.log"
SCAN_COOLDOWN_S   = 2.0   # ignore duplicates for N seconds after successful decode
RECONNECT_AFTER   = 10    # reconnect camera after this many consecutive read failures
POST_TIMEOUT_S    = 5

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stderr),
    ],
)
log = logging.getLogger("suvidha-scanner")

# ── Validation ────────────────────────────────────────────────────────────────

def is_secure_qr_candidate(text: str) -> bool:
    """Aadhaar Secure QR v2 is a long all-digit string (typically 1800-2700 chars)."""
    s = text.strip()
    return s.isdigit() and 1800 <= len(s) <= 2700

# ── Decode ────────────────────────────────────────────────────────────────────

def decode_secure_qr(digit_string: str) -> dict | None:
    """
    Decode Aadhaar Secure QR using pyaadhaar.
    Returns a dict of citizen fields or None if decode fails.
    """
    if not PYAADHAAR_OK:
        log.warning("pyaadhaar not installed. Run: pip install pyaadhaar")
        return None
    try:
        qr = AadhaarSecureQr(int(digit_string))

        # address may be an object or a dict depending on pyaadhaar version
        raw_addr = getattr(qr, "address", None)
        if isinstance(raw_addr, dict):
            addr = {
                "house":    raw_addr.get("House", ""),
                "street":   raw_addr.get("Street", ""),
                "locality": raw_addr.get("Loc") or raw_addr.get("VTC", ""),
                "district": raw_addr.get("Dist", ""),
                "state":    raw_addr.get("State", ""),
                "pincode":  raw_addr.get("PC", ""),
            }
        elif raw_addr is not None:
            addr = {
                "house":    getattr(raw_addr, "House", ""),
                "street":   getattr(raw_addr, "Street", ""),
                "locality": getattr(raw_addr, "Loc", "") or getattr(raw_addr, "VTC", ""),
                "district": getattr(raw_addr, "Dist", ""),
                "state":    getattr(raw_addr, "State", ""),
                "pincode":  getattr(raw_addr, "PC", ""),
            }
        else:
            addr = {}

        return {
            "name":               getattr(qr, "name", "") or "",
            "dob":                getattr(qr, "date_of_birth", "") or getattr(qr, "yob", "") or "",
            "gender":             getattr(qr, "gender", "") or "",
            "address":            addr,
            "aadhaar_last_digits": getattr(qr, "aadhaar_last_digits", "") or "",
        }
    except Exception as exc:
        log.warning("pyaadhaar decode failed: %s", exc)
        return None

# ── HTTP POST ─────────────────────────────────────────────────────────────────

def post_to_backend(payload: dict) -> bool:
    try:
        resp = requests.post(BACKEND_URL, json=payload, timeout=POST_TIMEOUT_S)
        if resp.ok:
            log.info("Scan posted — name=%s", payload.get("name", "?"))
            return True
        log.warning("Backend %d: %s", resp.status_code, resp.text[:200])
        return False
    except requests.RequestException as exc:
        log.warning("Backend unreachable (%s) — writing fallback file.", exc)
        try:
            Path(FALLBACK_FILE).write_text(json.dumps(payload), encoding="utf-8")
        except OSError as io_exc:
            log.error("Fallback write failed: %s", io_exc)
        return False

# ── Image preprocessing ───────────────────────────────────────────────────────

def preprocess(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )

# ── Camera ────────────────────────────────────────────────────────────────────

def open_camera(index: int):
    cap = cv2.VideoCapture(index)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open camera index {index}")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    return cap

# ── Main loop ─────────────────────────────────────────────────────────────────

def main():
    log.info("SUVIDHA scanner starting — camera=%d, backend=%s", CAMERA_INDEX, BACKEND_URL)
    if not PYAADHAAR_OK:
        log.error("pyaadhaar NOT installed — Secure QR decode disabled.")

    last_scan_at   = 0.0
    consec_failures = 0

    cap = open_camera(CAMERA_INDEX)
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                consec_failures += 1
                log.warning("Frame read failed (%d/%d)", consec_failures, RECONNECT_AFTER)
                if consec_failures >= RECONNECT_AFTER:
                    log.info("Reconnecting camera…")
                    cap.release()
                    time.sleep(2)
                    try:
                        cap = open_camera(CAMERA_INDEX)
                        consec_failures = 0
                        log.info("Camera reconnected.")
                    except RuntimeError as exc:
                        log.error("Reconnect failed: %s — retrying in 5s.", exc)
                        time.sleep(5)
                time.sleep(0.1)
                continue

            consec_failures = 0

            # Cooldown after a successful scan
            if time.monotonic() - last_scan_at < SCAN_COOLDOWN_S:
                time.sleep(0.05)
                continue

            # Try preprocessed frame first (higher contrast), then raw
            codes = pyzbar_decode(preprocess(frame)) or pyzbar_decode(frame)

            for code in (codes or []):
                raw = code.data.decode("utf-8", errors="replace").strip()
                if not is_secure_qr_candidate(raw):
                    continue

                payload = decode_secure_qr(raw)
                if not payload or not payload.get("name"):
                    log.debug("Candidate QR failed decode or missing name — skipping.")
                    continue

                post_to_backend(payload)
                last_scan_at = time.monotonic()
                break  # one decode per frame

    finally:
        cap.release()
        log.info("Camera released.")

if __name__ == "__main__":
    main()

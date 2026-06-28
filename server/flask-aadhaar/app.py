"""
flask-aadhaar/app.py — Aadhaar Secure QR v2 decoder microservice.

Runs as:
  - LOCAL (physical kiosk): python app.py → binds 127.0.0.1:5001
  - RENDER (cloud deploy):  gunicorn app:app → binds 0.0.0.0:$PORT

Express backend calls POST /decode-secure-qr with shared API key.
Never called by the browser directly.

Setup:
  pip install flask pyaadhaar gunicorn

Local:  python server/flask-aadhaar/app.py
Render: set start command to → gunicorn --chdir server/flask-aadhaar app:app
"""

import os
import sys
import logging
from flask import Flask, request, jsonify

try:
    from pyaadhaar.decode import AadhaarSecureQr
    PYAADHAAR_OK = True
except ImportError:
    PYAADHAAR_OK = False
    print("[ERROR] pyaadhaar not installed. Run: pip install pyaadhaar", file=sys.stderr)

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("aadhaar-decoder")

# Shared secret between Express and Flask.
# Set DECODER_API_SECRET on both Render services (Express + Flask).
# Locally defaults to dev secret — harmless since localhost-only.
DECODER_API_SECRET = os.environ.get("DECODER_API_SECRET", "suvidha-decoder-dev-2026")

# ── Auth ──────────────────────────────────────────────────────────────────────

def check_api_key():
    """Express sends X-Decoder-Secret header. Reject if missing/wrong."""
    incoming = request.headers.get("X-Decoder-Secret", "")
    return incoming == DECODER_API_SECRET

# ── Address extraction ────────────────────────────────────────────────────────

def extract_address(qr) -> dict:
    raw = getattr(qr, "address", None)
    if isinstance(raw, dict):
        return {
            "house":    raw.get("House", ""),
            "street":   raw.get("Street", ""),
            "locality": raw.get("Loc") or raw.get("VTC", ""),
            "district": raw.get("Dist", ""),
            "state":    raw.get("State", ""),
            "pincode":  raw.get("PC", ""),
        }
    if raw is not None:
        return {
            "house":    getattr(raw, "House", ""),
            "street":   getattr(raw, "Street", ""),
            "locality": getattr(raw, "Loc", "") or getattr(raw, "VTC", ""),
            "district": getattr(raw, "Dist", ""),
            "state":    getattr(raw, "State", ""),
            "pincode":  getattr(raw, "PC", ""),
        }
    return {}

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health")
def health():
    return jsonify({"ok": True, "pyaadhaar": PYAADHAAR_OK})


@app.route("/decode-secure-qr", methods=["POST"])
def decode_secure_qr():
    if not check_api_key():
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    if not PYAADHAAR_OK:
        return jsonify({"success": False, "error": "pyaadhaar not installed"}), 503

    body = request.get_json(silent=True) or {}
    qr_text = (body.get("qrText") or "").strip()

    if not qr_text:
        return jsonify({"success": False, "error": "qrText required"}), 400
    if not qr_text.isdigit():
        return jsonify({"success": False, "error": "qrText must be digit string"}), 400
    if not (1800 <= len(qr_text) <= 2700):
        return jsonify({"success": False, "error": f"Length {len(qr_text)} outside 1800-2700"}), 422

    try:
        qr = AadhaarSecureQr(int(qr_text))
        addr = extract_address(qr)
        data = {
            "name":                getattr(qr, "name", "") or "",
            "gender":              getattr(qr, "gender", "") or "",
            "dob":                 getattr(qr, "date_of_birth", "") or getattr(qr, "yob", "") or "",
            "aadhaar_last_digits": getattr(qr, "aadhaar_last_digits", "") or "",
            "address":             addr,
        }
        log.info("Decoded — name=%s state=%s", data["name"], addr.get("state", "?"))
        return jsonify({"success": True, "data": data})
    except Exception as exc:
        log.warning("Decode failed: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 422


if __name__ == "__main__":
    # Local mode — localhost only, no SSL needed
    port = int(os.environ.get("PORT", 5001))
    host = "0.0.0.0" if os.environ.get("RENDER") else "127.0.0.1"
    log.info("Starting on %s:%d", host, port)
    app.run(host=host, port=port, debug=False)

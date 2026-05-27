# UIDAI Public Certificate

Download the UIDAI offline e-KYC public key certificate and place it here as:

  server/certs/uidai_offline_public.cer

Download URL:
  https://uidai.gov.in/images/resource/uidai_offline_publickey_26022021.cer

Without this file the server still works — QR parsing and consent gate remain active,
but RSA signature verification is skipped (logged as "cert_not_loaded").

For hackathon demo this is acceptable. For production uncomment the reject line in
server/routes/auth.js verify-qr handler.

const SMSEDGE_API_KEY = process.env.SMSEDGE_API_KEY || '';
const SMSEDGE_BRAND = process.env.SMSEDGE_FROM || 'BahisMosco';

// Store request_ids for verification
const otpRequests = new Map(); // phone -> request_id

async function sendOtp(phone) {
  // Normalize Turkish phone: 05xx -> +905xx
  let normalized = phone.replace(/\s/g, '');
  if (normalized.startsWith('0')) normalized = '+90' + normalized.slice(1);
  if (!normalized.startsWith('+')) normalized = '+90' + normalized;

  if (!SMSEDGE_API_KEY || SMSEDGE_API_KEY === 'YOUR_SMSEDGE_API_KEY') {
    // Dev mode: generate fake OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[SMS DEV] OTP for ${normalized}: ${otp}`);
    otpRequests.set(phone, { dev: true, otp });
    return { success: true, dev: true, otp };
  }

  const res = await fetch('https://api.smsedge.com/v1/phone-verifier/send-verification-code', {
    method: 'POST',
    headers: {
      'X-API-KEY': SMSEDGE_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      number: normalized,
      country: 'TR',
      brand: SMSEDGE_BRAND,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `SMS gönderilemedi: ${res.status}`);

  // Store request_id for later verification
  if (data.request_id) otpRequests.set(phone, { request_id: data.request_id });

  return { success: true, request_id: data.request_id };
}

async function verifyOtp(phone, code) {
  const stored = otpRequests.get(phone);

  // Dev mode
  if (stored?.dev) {
    return stored.otp === code;
  }

  if (!stored?.request_id) return false;

  const res = await fetch('https://api.smsedge.com/v1/phone-verifier/verify-code', {
    method: 'POST',
    headers: {
      'X-API-KEY': SMSEDGE_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      request_id: stored.request_id,
      code,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (data.valid || data.success || data.status === 'approved') {
    otpRequests.delete(phone);
    return true;
  }
  return false;
}

// Legacy: generate OTP for DB-based verification
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSms(phone, text) {
  // Fallback: send plain SMS
  if (!SMSEDGE_API_KEY || SMSEDGE_API_KEY === 'YOUR_SMSEDGE_API_KEY') {
    console.log(`[SMS DEV] To: ${phone} | ${text}`);
    return { success: true, dev: true };
  }

  let normalized = phone.replace(/\s/g, '');
  if (normalized.startsWith('0')) normalized = '+90' + normalized.slice(1);
  if (!normalized.startsWith('+')) normalized = '+90' + normalized;

  const body = new URLSearchParams({ from: SMSEDGE_BRAND, to: normalized, text });
  const res = await fetch('https://api.smsedge.com/v1/sms/send-single', {
    method: 'POST',
    headers: { 'X-API-KEY': SMSEDGE_API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `SMS gönderilemedi: ${res.status}`);
  return { success: true, data };
}

module.exports = { sendSms, sendOtp, verifyOtp, generateOtp };

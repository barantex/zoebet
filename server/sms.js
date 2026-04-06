const SMSEDGE_API_KEY = process.env.SMSEDGE_API_KEY || '';
const SMSEDGE_FROM = process.env.SMSEDGE_FROM || 'BahisMosco';

async function sendSms(to, text) {
  if (!SMSEDGE_API_KEY || SMSEDGE_API_KEY === 'YOUR_SMSEDGE_API_KEY') {
    // Dev mode: log OTP to console
    console.log(`[SMS DEV] To: ${to} | Message: ${text}`);
    return { success: true, dev: true };
  }

  // Normalize Turkish phone: 05xx -> +905xx
  let phone = to.replace(/\s/g, '');
  if (phone.startsWith('0')) phone = '+90' + phone.slice(1);
  if (!phone.startsWith('+')) phone = '+90' + phone;

  const body = new URLSearchParams({
    from: SMSEDGE_FROM,
    to: phone,
    text,
  });

  const res = await fetch('https://api.smsedge.com/v1/sms/send-single', {
    method: 'POST',
    headers: {
      'X-API-KEY': SMSEDGE_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: body.toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `SMS gönderilemedi: ${res.status}`);
  return { success: true, data };
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { sendSms, generateOtp };


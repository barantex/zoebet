const DRAKON_BASE = process.env.DRAKON_BASE_URL || 'https://gator.drakon.casino/api/v1';
const DRAKON_AUTH_HEADER = process.env.DRAKON_AUTH_HEADER || '';

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${DRAKON_BASE}/auth/authentication`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DRAKON_AUTH_HEADER}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drakon auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Cache for 50 minutes (tokens usually last 60)
  tokenExpiry = Date.now() + 50 * 60 * 1000;
  return cachedToken;
}

async function drakonRequest(path, method = 'GET', body = null) {
  const token = await getAccessToken();
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res = await fetch(`${DRAKON_BASE}/${path.replace(/^\//, '')}`, opts);
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: { raw: text } };
  }
}

module.exports = { drakonRequest, getAccessToken };

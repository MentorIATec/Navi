import crypto from 'node:crypto';

const COOKIE_NAME = 'faro_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSessionSecret() {
  const secret = String(process.env.SESSION_SECRET || '').trim();
  if (secret.length < 32) {
    const error = new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
    error.statusCode = 500;
    throw error;
  }
  return secret;
}

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function decode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(request) {
  return String(request.headers.cookie || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex < 0) return cookies;
      const key = item.slice(0, separatorIndex);
      const value = item.slice(separatorIndex + 1);
      cookies[key] = value;
      return cookies;
    }, {});
}

export function createSessionToken(identity, now = Date.now()) {
  const payload = {
    sub: String(identity.sub || '').trim(),
    email: String(identity.email || '').trim().toLowerCase(),
    issuedAt: now,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  };
  if (!payload.sub || !payload.email) {
    throw new Error('La identidad no contiene los campos requeridos.');
  }
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token, now = Date.now()) {
  const [encodedPayload, signature, extra] = String(token || '').split('.');
  if (!encodedPayload || !signature || extra || !timingSafeEqual(signature, sign(encodedPayload))) {
    return null;
  }
  try {
    const payload = JSON.parse(decode(encodedPayload));
    if (!payload.sub || !payload.email || Number(payload.expiresAt) <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readSession(request) {
  const token = parseCookies(request)[COOKIE_NAME];
  return verifySessionToken(token);
}

export function requireSession(request) {
  const session = readSession(request);
  if (!session) {
    const error = new Error('Tu sesión terminó o no es válida.');
    error.statusCode = 401;
    throw error;
  }
  return session;
}

export function setSessionCookie(response, identity) {
  const token = createSessionToken(identity);
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
  );
}

export function clearSessionCookie(response) {
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
}


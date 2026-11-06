import crypto from 'node:crypto';

const COOKIE_NAME = 'faro_student';
const SESSION_TTL_SECONDS = 4 * 60 * 60;

function getSecret() {
  const secret = String(process.env.SESSION_SECRET || '').trim();
  if (secret.length < 32) {
    const error = new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
    error.statusCode = 500;
    throw error;
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(`student:${value}`).digest('base64url');
}

function parseCookies(request) {
  return String(request.headers.cookie || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separator = item.indexOf('=');
      if (separator > -1) cookies[item.slice(0, separator)] = item.slice(separator + 1);
      return cookies;
    }, {});
}

export function createStudentToken(matricula, now = Date.now()) {
  const normalized = String(matricula || '').trim().toUpperCase();
  if (!/^A\d{8}$/.test(normalized)) throw new Error('La matrícula no es válida.');
  const payload = Buffer.from(JSON.stringify({ matricula: normalized, expiresAt: now + SESSION_TTL_SECONDS * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyStudentToken(token, now = Date.now()) {
  const [payload, signature, extra] = String(token || '').split('.');
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!/^A\d{8}$/.test(parsed.matricula) || Number(parsed.expiresAt) <= now) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function requireStudentSession(request) {
  const session = verifyStudentToken(parseCookies(request)[COOKIE_NAME]);
  if (!session) {
    const error = new Error('Vuelve a ingresar tu matrícula para continuar.');
    error.statusCode = 401;
    throw error;
  }
  return session;
}

export function setStudentSessionCookie(response, matricula) {
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${createStudentToken(matricula)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
  );
}

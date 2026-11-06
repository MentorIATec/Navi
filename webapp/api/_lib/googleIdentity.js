import { OAuth2Client } from 'google-auth-library';

let oauthClient;

function getOAuthClient() {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) {
    const error = new Error('GOOGLE_CLIENT_ID no está configurado.');
    error.statusCode = 500;
    throw error;
  }
  if (!oauthClient) oauthClient = new OAuth2Client(clientId);
  return { client: oauthClient, clientId };
}

export async function verifyWorkspaceCredential(credential) {
  const token = String(credential || '').trim();
  if (!token) {
    const error = new Error('Falta la credencial de Google Workspace.');
    error.statusCode = 400;
    throw error;
  }

  const { client, clientId } = getOAuthClient();
  const ticket = await client.verifyIdToken({ idToken: token, audience: clientId });
  const payload = ticket.getPayload() || {};
  const expectedDomain = String(process.env.GOOGLE_WORKSPACE_DOMAIN || 'tec.mx').trim().toLowerCase();
  const hostedDomain = String(payload.hd || '').trim().toLowerCase();
  const email = String(payload.email || '').trim().toLowerCase();

  if (!payload.sub || payload.email_verified !== true || hostedDomain !== expectedDomain) {
    const error = new Error('Usa una cuenta institucional autorizada.');
    error.statusCode = 403;
    throw error;
  }

  return {
    sub: payload.sub,
    email,
    name: String(payload.name || '').trim(),
    hostedDomain,
  };
}


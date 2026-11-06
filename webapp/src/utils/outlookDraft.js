export const OUTLOOK_SUBJECT = 'Completa tu test faro';
export const OUTLOOK_MESSAGE = `Hola,

Te comparto el acceso a faro para que respondas el test antes de nuestra próxima conversación:

https://faro-me.vercel.app/

Al terminar, podrás revisar tus resultados e identificar los temas que te gustaría conversar.

Gracias.`;

export function buildOutlookComposeUrl({ recipients, subject = OUTLOOK_SUBJECT, body = OUTLOOK_MESSAGE }) {
  // Outlook's composer can display form-encoded '+' literally. Encode spaces as
  // %20, real '+' as %2B, and line breaks explicitly; never replace text content.
  const params = { bcc: recipients.join(';'), subject, body: body.replace(/\r?\n/g, '\r\n') };
  const query = Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
  return `https://outlook.office.com/mail/deeplink/compose?${query}`;
}

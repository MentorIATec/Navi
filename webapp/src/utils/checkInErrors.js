export function getCheckInErrorMessage(error) {
  const code = String(error?.code || '').trim();
  const statusCode = Number(error?.statusCode) || 0;

  if (code === 'STUDENT_NOT_FOUND' || statusCode === 404) {
    return 'No encontramos esta matrícula en el registro. Revísala con tu mentor o mentora antes de continuar.';
  }

  if (code === 'WRITE_OUTCOME_UNKNOWN') {
    return 'La confirmación tardó más de lo esperado. Tu llegada puede haberse registrado; intenta nuevamente con seguridad para continuar.';
  }

  if (code === 'UPSTREAM_TIMEOUT' || code === 'REQUEST_TIMEOUT' || statusCode === 504) {
    return 'La búsqueda tardó más de lo esperado. Tu información no se perdió; intenta nuevamente.';
  }

  if (statusCode === 429 || statusCode === 502 || statusCode === 503) {
    return 'El servicio está tardando más de lo habitual. Espera un momento e intenta nuevamente.';
  }

  return 'No pudimos registrar tu llegada a la sesión. Verifica tu conexión e intenta nuevamente.';
}

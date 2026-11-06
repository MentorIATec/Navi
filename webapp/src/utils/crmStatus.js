// CRM completion requires an explicit saved confirmation linked to this arrival.
export function getCrmStatus(student, latestSession) {
  const arrived = student.hasCheckIn || ['si', 'sí'].includes(String(student.checkIn || '').toLowerCase());
  if (!arrived && !latestSession) return null;
  const linkedId = String(student.checkInSessionId || '');
  const id = String(latestSession?.sessionId || latestSession?.sessionid || '');
  const flag = latestSession?.documentadoCrm ?? latestSession?.documentado_crm ?? latestSession?.documentadocrm;
  const documented = flag === true || flag === 1 || ['si', 'sí', 'true', '1'].includes(String(flag || '').trim().toLowerCase());
  if (linkedId && id === linkedId) return { label: documented ? 'CRM documentado' : 'Pendiente CRM', documented };
  if (arrived && student.encounterManaged && !linkedId) return { label: 'Pendiente CRM', documented: false };
  if (documented || (!arrived && latestSession)) return { label: 'Estado CRM por confirmar', documented: false };
  return { label: 'Pendiente CRM', documented: false };
}

export function keepsakeFilename(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `faro-mis-metas-${value('year')}-${value('month')}-${value('day')}.png`;
}

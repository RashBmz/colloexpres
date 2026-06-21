function cleanString(value, maxLength = 255) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanPhone(value) {
  return cleanString(value, 40)
    .replace(/[^a-zA-Z0-9+\-\s]/g, '')
    .trim();
}

function cleanName(value) {
  return cleanString(value, 80)
    .replace(/\s{2,}/g, ' ');
}

function cleanRole(value) {
  const role = cleanString(value, 20).toLowerCase();
  return ['client', 'livreur', 'admin'].includes(role) ? role : 'client';
}

function cleanTextBlock(value, maxLength = 1000) {
  return String(value || '')
    .replace(/\r/g, '')
    .trim()
    .slice(0, maxLength);
}

function toSafeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

module.exports = {
  cleanName,
  cleanPhone,
  cleanRole,
  cleanString,
  cleanTextBlock,
  toSafeNumber,
};

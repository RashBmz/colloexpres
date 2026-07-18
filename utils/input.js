function stripControlChars(value, { keepNewLines = false } = {}) {
  const pattern = keepNewLines
    ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g;
  return String(value || '').replace(pattern, '');
}

function cleanString(value, maxLength = 255) {
  return stripControlChars(value)
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
  return stripControlChars(value, { keepNewLines: true })
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
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

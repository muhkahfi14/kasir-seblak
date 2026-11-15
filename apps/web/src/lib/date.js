/**
 * Format date to Indonesian locale: dd MMM yyyy
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

/**
 * Format date and time to Indonesian locale
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  });
}

/**
 * Format time only (24h format)
 * @param {string|Date} date
 * @returns {string}
 */
export function formatTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  });
}

/**
 * Get today's date string in YYYY-MM-DD format (Jakarta timezone)
 * @returns {string}
 */
export function getTodayString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

/**
 * Get start of day in Jakarta timezone as ISO string
 * @param {string} dateStr - YYYY-MM-DD format
 * @returns {string}
 */
export function startOfDayJakarta(dateStr) {
  return new Date(`${dateStr}T00:00:00+07:00`).toISOString();
}

/**
 * Get end of day in Jakarta timezone as ISO string
 * @param {string} dateStr - YYYY-MM-DD format
 * @returns {string}
 */
export function endOfDayJakarta(dateStr) {
  return new Date(`${dateStr}T23:59:59.999+07:00`).toISOString();
}

/**
 * Format number as Indonesian Rupiah currency
 * @param {number} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with Indonesian locale
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Parse a Rupiah string back to number
 * @param {string} str
 * @returns {number}
 */
export function parseRupiah(str) {
  if (typeof str === 'number') return str;
  return Number(String(str).replace(/[^0-9-]/g, ''));
}

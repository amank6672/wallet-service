/**
 * Formatting utilities
 */

/**
 * Format amount with currency symbol
 */
export function formatAmount(amount) {
  const num = parseFloat(amount || 0);
  return `₹${num.toFixed(2)}`;
}

/**
 * Format date to localized string
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(num);
}


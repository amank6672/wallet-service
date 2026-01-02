/**
 * Formatting utilities
 */

/**
 * Format amount with currency symbol
 * Shows up to 4 decimal places, removing trailing zeros
 * Examples: 20.5612 -> ₹20.5612, 20.5600 -> ₹20.56, 20.0000 -> ₹20
 */
export function formatAmount(amount) {
  const num = parseFloat(amount || 0);
  if (isNaN(num)) return '₹0';
  
  // Format to 4 decimal places
  const formatted = num.toFixed(4);
  
  // Remove trailing zeros and decimal point if not needed
  // e.g., "20.5600" -> "20.56", "20.0000" -> "20"
  const trimmed = formatted.replace(/\.?0+$/, '');
  
  return `₹${trimmed}`;
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


/**
 * Format numerical amounts in Indian Rupees (INR)
 * e.g. 3100 -> ₹3,100, 125000 -> ₹1,25,000
 */
export function formatINR(val, fallback = '₹0') {
  if (val === null || val === undefined || isNaN(val)) {
    return fallback;
  }
  const num = Number(val);
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
}

/**
 * Format dates cleanly
 */
export function formatDate(val, fallback = '—') {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return fallback;
  }
}

/**
 * Format date & time
 */
export function formatDateTime(val, fallback = '—') {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return fallback;
  }
}

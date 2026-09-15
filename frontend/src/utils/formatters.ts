/**
 * Formats numbers into Indian Rupee Currency format (e.g. ₹24,68,94,148)
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }

  const rounded = Math.round(amount);
  const formattedStr = rounded.toLocaleString('en-IN');
  return `₹${formattedStr}`;
}

/**
 * Formats numbers into Indian Cr / Lakh representation for compact cards
 * e.g. ₹24.69 Cr, ₹8.42 Cr, ₹45.50 Lakh
 */
export function formatINRCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }

  const absAmount = Math.abs(amount);

  if (absAmount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2);
    return `₹${cr} Cr`;
  } else if (absAmount >= 100000) {
    const lakh = (amount / 100000).toFixed(2);
    return `₹${lakh} Lakh`;
  }

  return formatINR(amount);
}

/**
 * Formats date string to DD-MMM-YYYY
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

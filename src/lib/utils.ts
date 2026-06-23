import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee currency.
 * Uses decimal-safe string formatting.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Decimal-safe multiplication to avoid floating point errors.
 * Converts to integers, multiplies, then divides back.
 */
export function safeMultiply(a: number, b: number): number {
  const precision = 100; // 2 decimal places
  return Math.round(a * precision * b) / precision;
}

/**
 * Decimal-safe addition of multiple numbers.
 */
export function safeAdd(...numbers: number[]): number {
  const precision = 100;
  const sum = numbers.reduce((acc, n) => acc + Math.round(n * precision), 0);
  return sum / precision;
}

/**
 * Calculate GST amount from subtotal and rate.
 */
export function calculateGST(subtotal: number, gstRate: number): number {
  return Math.round(subtotal * gstRate) / 100;
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date for input fields (YYYY-MM-DD).
 */
export function toDateInputValue(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get status badge color.
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'partial':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'unpaid':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'draft':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    case 'cancelled':
      return 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

/**
 * Convert number to words (Indian numbering system) for invoice amount.
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertGroup(n % 100) : '');
  }

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  let result = '';
  const crore = Math.floor(intPart / 10000000);
  const lakh = Math.floor((intPart % 10000000) / 100000);
  const thousand = Math.floor((intPart % 100000) / 1000);
  const remainder = intPart % 1000;

  if (crore > 0) result += convertGroup(crore) + ' Crore ';
  if (lakh > 0) result += convertGroup(lakh) + ' Lakh ';
  if (thousand > 0) result += convertGroup(thousand) + ' Thousand ';
  if (remainder > 0) result += convertGroup(remainder);

  result = result.trim() + ' Rupees';

  if (decPart > 0) {
    result += ' and ' + convertGroup(decPart) + ' Paise';
  }
  result += ' Only';

  return result;
}

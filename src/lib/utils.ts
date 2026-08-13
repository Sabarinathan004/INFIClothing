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
 * Format date and time string with hours, minutes, seconds and AM/PM.
 * Example output: "13 Aug 2026 11:47:42 AM"
 */
export function formatDateTime(dateStr?: string, createdAtStr?: string): string {
  if (!dateStr && !createdAtStr) {
    return formatSingleDateTime(new Date());
  }

  let targetDate: Date | null = null;

  // 1. If createdAtStr has a valid timestamp, prefer it for exact time
  if (createdAtStr) {
    const cd = new Date(createdAtStr);
    if (!isNaN(cd.getTime())) {
      targetDate = cd;
    }
  }

  // 2. If dateStr contains full ISO string with time
  if (!targetDate && dateStr && dateStr.includes("T")) {
    const dd = new Date(dateStr);
    if (!isNaN(dd.getTime())) {
      targetDate = dd;
    }
  }

  // 3. If dateStr is YYYY-MM-DD, parse date components + combine with time
  if (dateStr && !dateStr.includes("T")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      let hours = 0, minutes = 0, seconds = 0;
      if (createdAtStr) {
        const cd = new Date(createdAtStr);
        if (!isNaN(cd.getTime())) {
          hours = cd.getHours();
          minutes = cd.getMinutes();
          seconds = cd.getSeconds();
        }
      } else {
        const now = new Date();
        hours = now.getHours();
        minutes = now.getMinutes();
        seconds = now.getSeconds();
      }

      targetDate = new Date(year, month, day, hours, minutes, seconds);
    }
  }

  if (!targetDate || isNaN(targetDate.getTime())) {
    targetDate = new Date();
  }

  return formatSingleDateTime(targetDate);
}

function formatSingleDateTime(date: Date): string {
  const dayMonthYear = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date).toUpperCase();

  return `${dayMonthYear} ${timePart}`;
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
    case 'created': // DB stores 'created' for non-draft invoices; treat as unpaid
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
 * Get human-readable label for an invoice status.
 * Uses payment_status for display when available (paid/unpaid/partial).
 * Falls back gracefully for draft, cancelled, or the DB 'created' value.
 */
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    partial: 'Partially Paid',
    draft: 'Draft',
    cancelled: 'Cancelled',
    created: 'Unpaid', // DB internal value — display as Unpaid
  };
  return map[status] ?? (status.charAt(0).toUpperCase() + status.slice(1));
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

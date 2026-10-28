export const APP_NAME = 'INFI Clothings';

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
] as const;

export const GST_RATES = [
  { value: 0, label: 'No GST (0%)' },
  { value: 5, label: 'GST 5%' },
  { value: 12, label: 'GST 12%' },
  { value: 18, label: 'GST 18%' },
  { value: 28, label: 'GST 28%' },
] as const;

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/invoices/new', label: 'New Invoice', icon: 'Plus' },
  { href: '/invoices', label: 'Invoices', icon: 'FileText' },
  { label: 'Customers', href: '/customers', icon: 'Users' },
  { label: 'Product Store', href: '/bundles', icon: 'Package' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;

/**
 * Official Indian GST State Code Mapping (37 States & Union Territories)
 */
export const GST_STATE_CODES: Record<string, string> = {
  '01': 'JAMMU AND KASHMIR',
  '02': 'HIMACHAL PRADESH',
  '03': 'PUNJAB',
  '04': 'CHANDIGARH',
  '05': 'UTTARAKHAND',
  '06': 'HARYANA',
  '07': 'DELHI',
  '08': 'RAJASTHAN',
  '09': 'UTTAR PRADESH',
  '10': 'BIHAR',
  '11': 'SIKKIM',
  '12': 'ARUNACHAL PRADESH',
  '13': 'NAGALAND',
  '14': 'MANIPUR',
  '15': 'MIZORAM',
  '16': 'TRIPURA',
  '17': 'MEGHALAYA',
  '18': 'ASSAM',
  '19': 'WEST BENGAL',
  '20': 'JHARKHAND',
  '21': 'ODISHA',
  '22': 'CHATTISGARH',
  '23': 'MADHYA PRADESH',
  '24': 'GUJARAT',
  '26': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  '27': 'MAHARASHTRA',
  '28': 'ANDHRA PRADESH (OLD)',
  '29': 'KARNATAKA',
  '30': 'GOA',
  '31': 'LAKSHADWEEP',
  '32': 'KERALA',
  '33': 'TAMIL NADU',
  '34': 'PUDUCHERRY',
  '35': 'ANDAMAN AND NICOBAR ISLANDS',
  '36': 'TELANGANA',
  '37': 'ANDHRA PRADESH',
  '38': 'LADAKH',
  '97': 'OTHER TERRITORY',
  '99': 'CENTRE JURISDICTION',
};

/**
 * Formats a GSTIN or 2-digit State Code into the official GST Place of Supply
 * e.g. "29CELPR5680E1ZX" -> "29-KARNATAKA", "33" -> "33-TAMIL NADU"
 */
export function getPlaceOfSupply(gstinOrCode?: string | null): string {
  if (!gstinOrCode) return '';
  const clean = gstinOrCode.trim().toUpperCase();
  if (/^\d{2}\s*-\s*[A-Z\s()]+$/.test(clean)) {
    return clean;
  }
  const code = clean.length >= 2 ? clean.substring(0, 2) : '';
  const stateName = GST_STATE_CODES[code];
  if (stateName) {
    return `${code}-${stateName}`;
  }
  return clean;
}

/**
 * Derives whether the customer is Inside Tamil Nadu (CGST + SGST) or Outside Tamil Nadu (IGST)
 */
export function getLocationFromGstin(gstin?: string | null): 'Inside Tamil Nadu' | 'Outside Tamil Nadu' {
  if (!gstin) return 'Inside Tamil Nadu';
  const clean = gstin.trim().toUpperCase();
  const code = clean.length >= 2 ? clean.substring(0, 2) : '';
  return code === '33' ? 'Inside Tamil Nadu' : 'Outside Tamil Nadu';
}


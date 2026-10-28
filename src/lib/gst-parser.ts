import { getPlaceOfSupply, GST_STATE_CODES } from './constants';

export interface GSTApiResponse {
  success?: boolean;
  data: any;
}

export function formatGSTAddress(addrObj?: any): string {
  const addr = addrObj?.address || addrObj;
  if (!addr || typeof addr !== 'object') return 'Address not available';

  const cleanPart = (val?: string | null): string => {
    if (!val || typeof val !== 'string') return '';
    return val
      .replace(/\/{2,}/g, '/')             // replace double/multiple slashes with single slash
      .replace(/\s+/g, ' ')                // collapse multiple spaces
      .replace(/^[\s,/-]+|[\s,/-]+$/g, '') // trim leading/trailing separators
      .trim();
  };

  const bldgNum = cleanPart(addr.buildingNumber);
  const bldgName = cleanPart(addr.buildingName);
  const street = cleanPart(addr.street);
  const locality = cleanPart(addr.locality);
  const location = cleanPart(addr.location);
  const district = cleanPart(addr.district);
  const rawState = cleanPart(addr.stateCode || addr.state);
  const pincode = cleanPart(addr.pincode);

  // Combine building info cleanly if both exist
  let premise = '';
  if (bldgNum && bldgName) {
    premise = bldgNum.toLowerCase() === bldgName.toLowerCase() ? bldgNum : `${bldgNum}, ${bldgName}`;
  } else {
    premise = bldgNum || bldgName;
  }

  // Deduplicate location & district
  const loc =
    location &&
    location.toLowerCase() !== district.toLowerCase() &&
    location.toLowerCase() !== locality.toLowerCase()
      ? location
      : '';

  // Format State & Pincode: e.g. "KARNATAKA - 583101"
  let stateDisplay = rawState;
  if (rawState && /^\d{2}$/.test(rawState)) {
    stateDisplay = GST_STATE_CODES[rawState] || rawState;
  }

  let stateAndPin = '';
  if (stateDisplay && pincode) {
    stateAndPin = `${stateDisplay} - ${pincode}`;
  } else {
    stateAndPin = stateDisplay || pincode;
  }

  const parts = [premise, street, locality, loc, district, stateAndPin];

  // Filter out blanks and deduplicate consecutive identical tokens
  const cleanedList: string[] = [];
  for (const p of parts) {
    if (p && !cleanedList.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
      cleanedList.push(p);
    }
  }

  return cleanedList.join(', ') || 'Address not available';
}

export function parseGSTRecord(apiResponse: GSTApiResponse, cleanGstInput?: string) {
  // Defensively handle array or direct object
  const record = Array.isArray(apiResponse.data) ? apiResponse.data[0] : apiResponse.data;

  if (!record) {
    throw new Error('No GST record found in the API response.');
  }

  if (record.status && record.status.toLowerCase() !== 'active') {
    throw new Error(`GSTIN is ${record.status}. Inactive entities cannot be billed.`);
  }

  const cleanGst = (record.gstNumber || record.gstin || cleanGstInput || '').trim().toUpperCase();
  const tradeName = (record.tradeName || record.tradeNam || record.legalName || record.lgnm || '').trim();
  const legalName = (record.legalName || record.lgnm || record.tradeName || record.tradeNam || '').trim();
  // Legal name binds to Customer Name, trade name binds to Company Name
  const customerName = legalName || tradeName || 'Unknown Entity';
  const companyName = tradeName || legalName || '';

  // Automatically extract the 10-character PAN from characters 3 to 12 of the 15-digit GSTIN
  const panNumber = cleanGst.length >= 12 ? cleanGst.substring(2, 12) : record.pan || '';

  // Extract first 2 digits and map to official Indian GST state format (e.g. 29-KARNATAKA)
  const stateCode = cleanGst.length >= 2 ? cleanGst.substring(0, 2) : '';
  const placeOfSupply = getPlaceOfSupply(cleanGst);

  const fullAddress = formatGSTAddress(record.principalAddress || record.address);

  return {
    customerName,
    companyName,
    tradeName,
    legalName,
    panNumber,
    stateCode,
    placeOfSupply,
    customerAddress: fullAddress,
    gstNumber: cleanGst || record.gstNumber,
    status: record.status || 'Active',
  };
}

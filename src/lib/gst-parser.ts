export interface GSTApiResponse {
  success?: boolean
  data: any
}

export function formatGSTAddress(addrObj?: any): string {
  const addr = addrObj?.address || addrObj
  if (!addr) return 'Address not available'

  // Deduplicate location and district if identical
  const location = addr.location && addr.location !== addr.district ? addr.location : null

  const parts = [
    addr.buildingNumber,
    addr.buildingName,
    addr.street,
    addr.locality,
    location,
    addr.district,
    addr.stateCode && addr.pincode ? `${addr.stateCode} - ${addr.pincode}` : addr.stateCode || addr.pincode,
  ]

  return parts
    .map((p) => typeof p === 'string' ? p.trim() : p)
    .filter((p): p is string => Boolean(p && typeof p === 'string' && p.length > 0))
    .join(', ')
}

export function parseGSTRecord(apiResponse: GSTApiResponse) {
  // Defensively handle array or direct object
  const record = Array.isArray(apiResponse.data) ? apiResponse.data[0] : apiResponse.data

  if (!record) {
    throw new Error('No GST record found in the API response.')
  }

  if (record.status && record.status.toLowerCase() !== 'active') {
    throw new Error(`GSTIN is ${record.status}. Inactive entities cannot be billed.`)
  }

  const customerName = record.legalName?.trim() || record.tradeName?.trim() || 'Unknown Entity'
  const fullAddress = formatGSTAddress(record.principalAddress)

  return {
    customerName,
    customerAddress: fullAddress,
    gstNumber: record.gstNumber,
    status: record.status || 'Active',
  }
}

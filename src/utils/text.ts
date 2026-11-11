/**
 * Text-case normalization rules.
 *
 * UPPERCASE_FIELDS   : free-text identity fields that must always be stored in CAPS.
 * PRESERVE_CASE_FIELDS: fields whose original casing must be kept
 *                       (notes/description/purpose are intentionally free-form,
 *                        username/password are credentials).
 *
 * Enum-like fields (role/condition/status/type/action) are stored UPPERCASE
 * and normalized explicitly in each route (see normalizeEnum).
 */

export const UPPERCASE_FIELDS = new Set([
  'name',
  'category',
  'unit',
  'plateNumber',
  'pic',
]);

export const PRESERVE_CASE_FIELDS = new Set([
  // credentials
  'username',
  'password',
  // free-form text (admin may use any casing)
  'notes',
  'description',
  'purpose',
  // identifiers / numbers / dates
  'id',
  'itemId',
  'equipmentId',
  'vehicleId',
  'companyId',
  'adminId',
  'startOdometer',
  'endOdometer',
  'odometer',
  'oilChangeInterval',
  'serviceInterval',
  'quantity',
  'stock',
  'minStock',
  'cost',
  'date',
]);

/**
 * Normalize a request body:
 * - UPPERCASE_FIELDS -> trimmed + uppercased
 * - every other field  -> preserved exactly as received
 */
export function normalizeBody(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = value;
      continue;
    }

    if (UPPERCASE_FIELDS.has(key) && typeof value === 'string') {
      result[key] = value.trim().toUpperCase();
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Normalize an enum-like value to UPPERCASE.
 * Usage: normalizeEnum(req.body.role)
 */
export function normalizeEnum(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

/**
 * Case-insensitive role comparison (keeps old JWT tokens with lowercase
 * roles working during the transition).
 */
export function isRole(userRole: unknown, expected: string): boolean {
  return String(userRole ?? '').trim().toUpperCase() === expected.toUpperCase();
}

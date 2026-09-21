/**
 * Utility for deep sanitization of payloads before sending to Firestore.
 * Firestore throws errors when receiving `undefined` in document fields.
 *
 * Rules:
 * - Recursively removes keys with `undefined` values from plain objects.
 * - Preserves `false`, `0`, `""`, and `null` without modification.
 * - Preserves Date, FieldValue, Timestamp, and other Firebase internal types.
 * - Recursively sanitizes arrays by mapping and filtering out undefined elements.
 */
export function sanitizeFirestorePayload<T>(value: T): T {
  if (value === undefined) {
    return undefined as unknown as T;
  }
  if (value === null || typeof value !== "object") {
    return value;
  }

  // Preserve Dates and special Firestore FieldValues / Timestamps / GeoPoints
  if (
    value instanceof Date ||
    typeof (value as any).toMillis === "function" ||
    typeof (value as any).isEqual === "function" ||
    typeof (value as any)._methodName === "string"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestorePayload(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined) {
      const sanitized = sanitizeFirestorePayload(val);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }
  }
  return result as unknown as T;
}

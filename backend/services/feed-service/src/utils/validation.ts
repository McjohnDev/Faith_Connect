/**
 * Validation Utilities
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 */
export function validateUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Validate and throw if invalid UUID
 */
export function requireUUID(id: string, fieldName: string = 'ID'): void {
  if (!validateUUID(id)) {
    throw new Error(`INVALID_${fieldName.toUpperCase()}_FORMAT`);
  }
}

/**
 * Enforce pagination limits
 */
export function enforcePaginationLimits(limit?: number, offset?: number, maxLimit: number = 100): {
  limit: number;
  offset: number;
} {
  const enforcedLimit = limit !== undefined && limit > 0 
    ? Math.min(limit, maxLimit) 
    : 20;
  
  const enforcedOffset = offset !== undefined && offset >= 0 
    ? offset 
    : 0;

  return { limit: enforcedLimit, offset: enforcedOffset };
}


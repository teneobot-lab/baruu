import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * Hash a password using bcrypt with cost factor 12.
 * NOTE: Existing user password hashes created with the old SHA-256 method
 * are NOT compatible with this function and MUST be reset.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash.
 * Works with hashes created by hashPassword(). Returns false for legacy
 * SHA-256 hashes (which should be replaced via password reset flow).
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  // bcrypt hashes are identified by the $2[aby]$ prefix.
  // Legacy SHA-256 hex strings do not start with this prefix.
  if (!hash.startsWith("$2")) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

/**
 * Sync hash (for seeding / tests where async is inconvenient).
 * Prefer hashPassword() in all other contexts.
 */
export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}
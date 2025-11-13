import crypto from 'crypto';

/**
 * Generate a secure random token
 * @param bytes - Number of random bytes (default: 32)
 * @returns Hexadecimal token string
 */
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a verification token for email verification
 * @returns Verification token
 */
export function generateVerificationToken(): string {
  return generateToken(32);
}

/**
 * Generate a password reset token
 * @returns Password reset token
 */
export function generatePasswordResetToken(): string {
  return generateToken(32);
}

/**
 * Generate TOTP secret for MFA
 * @returns Base32-encoded secret
 */
export function generateMFASecret(): string {
  const secret = crypto.randomBytes(20);
  return base32Encode(secret);
}

/**
 * Generate backup codes for MFA
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase();

    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

/**
 * Base32 encode a buffer (for TOTP secret compatibility)
 * @param buffer - Buffer to encode
 * @returns Base32-encoded string
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Hash a token for storage (prevents rainbow table attacks if DB compromised)
 * @param token - Token to hash
 * @returns Hashed token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token matches a hash
 * @param token - Token to verify
 * @param hash - Hash to compare against
 * @returns True if token matches hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

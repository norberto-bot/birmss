import bcrypt from 'bcryptjs';
import DOMPurify from 'dompurify';

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 4
  errors: string[];
}

/**
 * Validates password strength according to government & healthcare IT standards:
 * - Minimum 10 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one numerical digit (0-9)
 * - At least one special symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (!password || password.length < 10) {
    errors.push('Must be at least 10 characters long.');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter (A-Z).');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter (a-z).');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Must contain at least one numerical digit (0-9).');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Must contain at least one special symbol (!@#$%^&* etc.).');
  } else {
    score += 1;
  }

  return {
    isValid: errors.length === 0,
    score: Math.min(score, 4),
    errors,
  };
}

/**
 * Securely hashes password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export function hashPasswordSync(plainPassword: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainPassword, salt);
}

/**
 * Compares plain text password against bcrypt hash.
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

export function verifyPasswordSync(plainPassword: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plainPassword, hash);
  } catch (err) {
    console.error('Password sync verification error:', err);
    return false;
  }
}

/**
 * Generates a cryptographically secure random token (64 hex characters)
 * using Web Crypto API.
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a CSRF token for forms to prevent cross-site request forgery.
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return 'csrf_' + Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitizes user inputs to prevent XSS (Cross-Site Scripting) and script injection attacks.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input.trim());
}

/**
 * In-memory / local rate limiter to protect against brute-force attacks.
 */
interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const loginRateLimits = new Map<string, RateLimitRecord>();
const resetRateLimits = new Map<string, RateLimitRecord>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

const MAX_RESET_REQUESTS_PER_HOUR = 3;
const RESET_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkLoginRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; retryAfterMinutes?: number } {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const record = loginRateLimits.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  // Check if locked
  if (record.lockedUntil && record.lockedUntil > now) {
    const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
    return { allowed: false, remainingAttempts: 0, retryAfterMinutes: minutesLeft };
  }

  // If lockout expired, reset
  if (record.lockedUntil && record.lockedUntil <= now) {
    loginRateLimits.delete(key);
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - record.attempts);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

export function recordFailedLogin(identifier: string): { locked: boolean; retryAfterMinutes?: number } {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const record = loginRateLimits.get(key) || { attempts: 0, firstAttempt: now };

  record.attempts += 1;
  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOGIN_LOCKOUT_MS;
    loginRateLimits.set(key, record);
    return { locked: true, retryAfterMinutes: 15 };
  }

  loginRateLimits.set(key, record);
  return { locked: false };
}

export function recordSuccessfulLogin(identifier: string): void {
  const key = identifier.toLowerCase().trim();
  loginRateLimits.delete(key);
}

export function checkResetRateLimit(email: string): { allowed: boolean; retryAfterMinutes?: number } {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const record = resetRateLimits.get(key);

  if (!record) {
    return { allowed: true };
  }

  if (now - record.firstAttempt > RESET_WINDOW_MS) {
    resetRateLimits.delete(key);
    return { allowed: true };
  }

  if (record.attempts >= MAX_RESET_REQUESTS_PER_HOUR) {
    const minutesLeft = Math.ceil((RESET_WINDOW_MS - (now - record.firstAttempt)) / 60000);
    return { allowed: false, retryAfterMinutes: minutesLeft };
  }

  return { allowed: true };
}

export function recordResetRequest(email: string): void {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const record = resetRateLimits.get(key);

  if (!record || (now - record.firstAttempt > RESET_WINDOW_MS)) {
    resetRateLimits.set(key, { attempts: 1, firstAttempt: now });
  } else {
    record.attempts += 1;
    resetRateLimits.set(key, record);
  }
}

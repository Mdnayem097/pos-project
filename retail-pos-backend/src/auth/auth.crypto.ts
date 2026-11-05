import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * NIST / OWASP recommended scrypt password hashing with cryptographically secure random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function comparePassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;

  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Standard HMAC SHA-256 (HS256) JWT Signer
 */
export function signJwt(payload: Record<string, any>, secret: string, expiresInSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Standard HMAC SHA-256 (HS256) JWT Verifier
 */
export function verifyJwt<T = any>(token: string, secret: string): T {
  if (!token) throw new UnauthorizedException('Authentication token missing');
  const parts = token.split('.');
  if (parts.length !== 3) throw new UnauthorizedException('Malformed token');

  const [header, body, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');

  if (signature !== expectedSignature) {
    throw new UnauthorizedException('Invalid token signature');
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('Token has expired');
    }
    return payload as T;
  } catch (err: any) {
    if (err instanceof UnauthorizedException) throw err;
    throw new UnauthorizedException('Invalid token payload');
  }
}

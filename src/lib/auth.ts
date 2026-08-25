import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'insurance_crm_session';
const DEFAULT_PIN = process.env.OWNER_PIN || '1234';
const DEFAULT_PASSWORD = process.env.OWNER_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'insurance-crm-secure-session-key-v1';

export async function verifyAuthCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
  if (!sessionCookie) return false;
  return sessionCookie.value === `authenticated_${SESSION_SECRET}`;
}

export function validateCredentials(inputPinOrPass: string): boolean {
  const trimmed = inputPinOrPass.trim();
  return trimmed === DEFAULT_PIN || trimmed === DEFAULT_PASSWORD;
}

export async function setAuthSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, `authenticated_${SESSION_SECRET}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  });
}

export async function clearAuthSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

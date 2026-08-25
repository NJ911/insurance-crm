import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthCookie, validateCredentials, setAuthSession, clearAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const isAuthenticated = await verifyAuthCookie();
    return NextResponse.json({ authenticated: isAuthenticated });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: 'Auth check failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential } = body;

    if (!credential || typeof credential !== 'string') {
      return NextResponse.json({ success: false, message: 'Please enter your PIN or password' }, { status: 400 });
    }

    if (validateCredentials(credential)) {
      await setAuthSession();
      return NextResponse.json({ success: true, message: 'Authenticated successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid PIN or password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Authentication error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearAuthSession();
    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Logout failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'otplib';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Missing 6-digit token' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const storedSecret = cookieStore.get('mfa_secret')?.value;

    if (!storedSecret) {
      return NextResponse.json({ error: 'MFA secret missing. Please restart setup.' }, { status: 400 });
    }

    const result = await verify({ token, secret: storedSecret });

    if (result.valid) {
      // In a real database scenario, we would save the secret to the user's DB record here.
      // We store it in a long-lived cookie so they don't have to rescan the QR code on this device.
      cookieStore.set('mfa_secret', storedSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });

      // Set the active MFA session cookie (allows access to /dashboard)
      cookieStore.set('mfa_session', 'verified', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 12, // 12 hours
        path: '/'
      });
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid authenticator code. Please try again.' }, { status: 401 });
    }
  } catch (err) {
    console.error('MFA Verify Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

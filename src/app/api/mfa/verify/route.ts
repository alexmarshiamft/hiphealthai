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
      // Delete temporary setup secret cookie
      cookieStore.delete('mfa_secret');

      // Set long-lived setup completion cookie (30 days)
      cookieStore.set('mfa_setup_complete', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });

      // Set active MFA session cookie (12 hours)
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

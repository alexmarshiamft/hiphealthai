import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { token, phoneNumber } = await req.json();
    
    if (!token || !phoneNumber) {
      return NextResponse.json({ error: 'Missing token or phone number' }, { status: 400 });
    }

    // For this secure sandbox demo, the SMS code is strictly 123456
    if (token === '123456') {
      const cookieStore = await cookies();
      
      // Clear any hardware authenticator secret if set
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

      // Record a cookie/flag indicating SMS Demo was used
      cookieStore.set('mfa_method', 'sms_sandbox', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 12,
        path: '/'
      });
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid SMS verification code. Use 123456 for the sandbox demo.' }, { status: 401 });
    }
  } catch (err) {
    console.error('MFA SMS Verify Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

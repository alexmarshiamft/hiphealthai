import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateSecret, generateURI } from 'otplib';

const SETUP_COOKIE_MAX_AGE_SECONDS = 10 * 60;

export async function POST() {
  try {
    const secret = generateSecret();
    const otpauth = generateURI({
      label: 'clinician@hiphealthai.com',
      issuer: 'Hip AI Health Secure Scribe',
      secret,
    });

    const cookieStore = await cookies();
    cookieStore.set('pending_mfa_secret', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SETUP_COOKIE_MAX_AGE_SECONDS,
      path: '/',
    });

    return NextResponse.json({ otpauth });
  } catch (err) {
    console.error('MFA Generate Error:', err);
    return NextResponse.json({ error: 'Failed to generate MFA secret' }, { status: 500 });
  }
}

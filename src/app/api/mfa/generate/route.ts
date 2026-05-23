import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateSecret, generateURI } from 'otplib';

export async function POST() {
  try {
    const secret = generateSecret();
    const otpauth = generateURI({
      label: 'clinician@hiphealthai.com',
      issuer: 'Hip Health Secure Scribe',
      secret
    });

    const cookieStore = await cookies();
    cookieStore.set('mfa_secret', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    });

    return NextResponse.json({ otpauth });
  } catch (err) {
    console.error('MFA Generate Error:', err);
    return NextResponse.json({ error: 'Failed to generate MFA secret' }, { status: 500 });
  }
}

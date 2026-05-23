import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateSecret, generateURI } from 'otplib';

export async function POST() {
  const secret = generateSecret();
  const cookieStore = await cookies();

  cookieStore.set('mfa_secret', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 10, // 10 minute setup window
    path: '/'
  });

  const otpauth = generateURI({
    label: 'clinician@hiphealthai.com',
    issuer: 'Hip Health Secure Scribe',
    secret
  });
  return NextResponse.json({ otpauth });
}

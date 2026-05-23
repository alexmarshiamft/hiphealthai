import { NextResponse } from 'next/server';
import { generateSecret, generateURI } from 'otplib';

export async function POST() {
  const secret = generateSecret();
  const otpauth = generateURI({
    label: 'clinician@hiphealthai.com',
    issuer: 'Hip Health Secure Scribe',
    secret
  });
  return NextResponse.json({ secret, otpauth });
}

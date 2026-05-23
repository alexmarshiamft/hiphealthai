import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const hasSecret = cookieStore.has('mfa_secret');
  return NextResponse.json({ hasSecret });
}

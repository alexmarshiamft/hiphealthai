import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const hasVerifiedSetup = cookieStore.get('mfa_setup_complete')?.value === 'true';
    const hasActiveSession = cookieStore.get('mfa_session')?.value === 'verified';
    
    return NextResponse.json({ hasVerifiedSetup, hasActiveSession });
  } catch (err) {
    console.error('MFA Status Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve MFA status' }, { status: 500 });
  }
}

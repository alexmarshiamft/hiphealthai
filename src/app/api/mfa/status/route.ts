import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const hasVerifiedSetup = cookieStore.get('mfa_setup_complete')?.value === 'true';
    const hasActiveSession = cookieStore.get('mfa_session')?.value === 'verified';
    const mfaMethod = cookieStore.get('mfa_method')?.value || 'none';
    const baaSigned = cookieStore.get('baa_signed')?.value === 'true';
    
    return NextResponse.json({ hasVerifiedSetup, hasActiveSession, mfaMethod, baaSigned });
  } catch (err) {
    console.error('MFA Status Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve MFA status' }, { status: 500 });
  }
}

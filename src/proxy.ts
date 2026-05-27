import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check for the active MFA session cookie
  const mfaSession = request.cookies.get('mfa_session');

  // If trying to access protected routes without an active MFA session,
  // aggressively intercept and redirect back to the login wall.
  if (!mfaSession || mfaSession.value !== 'verified') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Otherwise, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  // Apply middleware only to these protected clinical routes.
  // /consent is left public so auditors can inspect and sign the BAA directly.
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};

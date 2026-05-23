import { NextResponse } from 'next/server';

const ALLOWED_EVENTS = new Set([
  'NOTE_COPIED',
  'NOTE_GENERATED',
  'MFA_CHALLENGE',
  'MFA_SUCCESS',
  'BAA_SIGNED',
  'CONSENT_ACCEPTED'
]);

export async function POST(req: Request) {
  try {
    const { event, details } = await req.json();

    if (!ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: 'Invalid audit event' }, { status: 400 });
    }

    const safeDetails = {
      section: typeof details?.section === 'string' ? details.section.slice(0, 64) : undefined,
      action: typeof details?.action === 'string' ? details.action.slice(0, 64) : undefined
    };

    // Write an immutable structured JSON log directly to Google Cloud Logging
    console.info(JSON.stringify({
      event,
      details: safeDetails,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Failed to record audit log' },
      { status: 500 }
    );
  }
}

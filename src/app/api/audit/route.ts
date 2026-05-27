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
    
    // Validate event is a string and resides in the strict allowlist
    if (typeof event !== 'string' || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: 'Invalid or unauthorized event' }, { status: 400 });
    }

    // Process and bound details to prevent log injection or overflow
    const boundedDetails: Record<string, unknown> = {};
    if (details && typeof details === 'object') {
      const detailsObj = details as Record<string, unknown>;
      
      if ('section' in detailsObj) {
        const sec = detailsObj.section;
        boundedDetails.section = typeof sec === 'string' ? sec.slice(0, 64) : sec;
      }
      
      if ('action' in detailsObj) {
        const act = detailsObj.action;
        boundedDetails.action = typeof act === 'string' ? act.slice(0, 64) : act;
      }
    }

    // Write an immutable structured JSON log directly to Google Cloud Logging
    console.info(JSON.stringify({ 
      event, 
      details: boundedDetails,
      timestamp: new Date().toISOString() 
    }));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to record audit log' },
      { status: 500 }
    );
  }
}

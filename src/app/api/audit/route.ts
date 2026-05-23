import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { event, details } = await req.json();
    
    // Write an immutable structured JSON log directly to Google Cloud Logging
    console.info(JSON.stringify({ 
      event: event || 'UNKNOWN_EVENT', 
      details,
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

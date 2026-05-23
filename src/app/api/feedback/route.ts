import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { feedback } = await req.json();
    
    // Enforce string type and non-empty after trimming
    if (typeof feedback !== 'string' || feedback.trim() === '') {
      return NextResponse.json({ error: 'Feedback cannot be empty and must be a string' }, { status: 400 });
    }

    // Prevent log leakage of raw user feedback and maintain zero-retention compliance
    console.info(JSON.stringify({
      event: 'FEEDBACK_SUBMITTED',
      feedbackLength: feedback.length,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

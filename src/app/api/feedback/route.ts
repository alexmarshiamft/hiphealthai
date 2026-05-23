import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { feedback } = await req.json();
    
    if (!feedback || feedback.trim() === '') {
      return NextResponse.json({ error: 'Feedback cannot be empty' }, { status: 400 });
    }

    // Since this is a zero-retention app, we simply dump the feedback into Google Cloud Logging
    // The founder can view these securely in the GCP Console
    console.log(`[USER FEEDBACK]: ${feedback}`);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Error handling feedback:', err);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { feedback } = await req.json();
    
    if (!feedback || feedback.trim() === '') {
      return NextResponse.json({ error: 'Feedback cannot be empty' }, { status: 400 });
    }

    console.info(JSON.stringify({
      event: 'USER_FEEDBACK_SUBMITTED',
      feedbackLength: feedback.length,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Error handling feedback:', err);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

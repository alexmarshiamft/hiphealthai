import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { generateAuditPDF, AuditTrailData } from '@/lib/pdfGenerator';

const CONSENT_TEXT_FOR_HASH = `
At [Practice Name], we are committed to providing you with the best possible treatment. 
To help us manage our practice efficiently and enhance our services, we use secure 
technology, including certain artificial intelligence (AI) tools.
AI tools are used strictly for administrative and supplementary support tasks under the 
direct supervision of your therapist. 
- Assisting your therapist in drafting and organizing session notes.
- Protecting your privacy by aggressively redacting Protected Health Information (PHI).
We do NOT use AI to make independent therapeutic decisions, communicate with you 
directly, or detect/interpret your emotions.
I consent to the use of AI tools to assist my therapist with organizing and formatting 
their written session notes, with the understanding that my identifying information 
is protected and redacted.
`;

export async function POST(req: Request) {
  try {
    const { patientName, signatureBase64 } = await req.json();

    if (!patientName || !signatureBase64) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Capture Audit Trail Data
    const timestamp = new Date().toISOString();
    
    // In Next.js App Router, headers() is read-only.
    // X-Forwarded-For is the standard way to get client IP behind a proxy/Vercel.
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      '127.0.0.1';
                      
    const userAgent = req.headers.get('user-agent') || 'Unknown User Agent';

    // 2. Compute Cryptographic Hash of the Document Text
    const documentHash = crypto
      .createHash('sha256')
      .update(CONSENT_TEXT_FOR_HASH.trim())
      .digest('hex');

    const auditData: AuditTrailData = {
      patientName,
      signatureBase64,
      ipAddress,
      userAgent,
      timestamp,
      documentHash
    };

    // 3. Generate Legally Binding PDF
    const pdfBuffer = generateAuditPDF(auditData);

    // 4. Store PDF securely (Simulated Database storage -> saving to local disk for prototype)
    const fileName = `signed_consent_${Date.now()}.pdf`;
    const savePath = path.join(process.cwd(), 'public', 'signed_documents', fileName);
    
    fs.writeFileSync(savePath, pdfBuffer);

    // Set long-lived BAA signed flag (30 days)
    const cookieStore = await cookies();
    cookieStore.set('baa_signed', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    // Return success and URL to download
    return NextResponse.json({ 
      success: true, 
      downloadUrl: `/signed_documents/${fileName}`,
      auditTrail: {
        timestamp,
        documentHash
      }
    });

  } catch (error) {
    console.error('Error generating signature audit trail:', error);
    return NextResponse.json(
      { error: 'Failed to process signature' },
      { status: 500 }
    );
  }
}

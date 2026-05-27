import { jsPDF } from 'jspdf';

export interface AuditTrailData {
  patientName: string;
  signatureBase64: string; // The data URI from the signature canvas
  ipAddress: string;
  userAgent: string;
  timestamp: string; // ISO String
  documentHash: string; // SHA-256 hash of the consent form text
}

export function generateAuditPDF(data: AuditTrailData): Buffer {
  // Create a new PDF document
  // Note: running jsPDF in Node requires it to not use window/document. 
  // It usually works fine for basic text/image insertion.
  const doc = new jsPDF();
  
  // Page 1: The Consent Form Text
  doc.setFontSize(16);
  doc.text('Consent for Use of Artificial Intelligence (AI) Tools', 14, 20);
  
  doc.setFontSize(10);
  const consentText = `
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
  
  const splitText = doc.splitTextToSize(consentText.trim(), 180);
  doc.text(splitText, 14, 35);
  
  // Add Patient Name
  doc.setFontSize(12);
  doc.text(`Patient Name: ${data.patientName}`, 14, 150);
  doc.text('Signature:', 14, 160);
  
  // Add Signature Image
  if (data.signatureBase64 && data.signatureBase64.startsWith('data:image')) {
    // Add image (x, y, width, height)
    doc.addImage(data.signatureBase64, 'PNG', 14, 165, 80, 30);
  }
  
  // Add Page 2: Audit Trail Certificate
  doc.addPage();
  
  doc.setFontSize(16);
  doc.text('AUDIT TRAIL CERTIFICATE', 14, 20);
  
  doc.setFontSize(10);
  doc.text('This document contains a legally enforceable electronic signature.', 14, 30);
  
  doc.text('SIGNATURE DETAILS', 14, 45);
  doc.text(`Signer Name: ${data.patientName}`, 14, 55);
  doc.text(`Timestamp (UTC): ${data.timestamp}`, 14, 65);
  doc.text(`IP Address: ${data.ipAddress}`, 14, 75);
  doc.text(`User-Agent: ${data.userAgent}`, 14, 85);
  
  doc.text('DOCUMENT INTEGRITY', 14, 105);
  doc.text(`Document SHA-256 Hash:`, 14, 115);
  doc.text(data.documentHash, 14, 125);
  
  // Output as an ArrayBuffer, convert to Node Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

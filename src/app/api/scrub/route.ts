import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import DLP from '@google-cloud/dlp';

export async function POST(req: Request) {
  try {
    // Initialize the Google Gen AI SDK for Vertex AI
    // It will automatically use GOOGLE_APPLICATION_CREDENTIALS for auth
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || 'build-placeholder',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    const formData = await req.formData();
    const rawNotes = formData.get('rawNotes') as string | null;
    const audioFile = formData.get('audio') as File | null;
    const outputFormat = formData.get('outputFormat') as string || 'triwest';
    
    // Premium Add-Ons
    const includeSummary = formData.get('includeSummary') === 'true';
    const customTemplate = formData.get('customTemplate') as string | null;

    if (!rawNotes && !audioFile) {
      return NextResponse.json(
        { error: 'Invalid or missing rawNotes or audio in the request body.' },
        { status: 400 }
      );
    }

    let formatInstructions = '';
    
    if (outputFormat === 'triwest') {
      formatInstructions = `Format the remaining text into a professional SOAP progress note tailored for a TriWest/VA first intake.
      
Checklist for a TriWest/VA first intake:
Your note should nearly always show:
- why the Veteran is here
- symptoms
- functional impairment
- risk assessment findings
- objective / MSE observations
- diagnostic impression or rule-outs
- why outpatient care is appropriate
- treatment plan with frequency
- start/stop time
- signature/authentication.

STRICT FORMATTING RULE: You MUST use Markdown headers with exactly '### ' for each section. 
Example:
### Subjective
[content]
### Objective
[content]
### Assessment
[content]
### Plan
[content]`;
    } else if (outputFormat === 'standard_soap') {
      formatInstructions = `Format the remaining text into a standard clinical SOAP progress note.
      
STRICT FORMATTING RULE: You MUST use Markdown headers with exactly '### ' for each section. 
Example:
### Subjective
[content]
### Objective
[content]
### Assessment
[content]
### Plan
[content]`;
    }

    let customInstructionsText = '';
    if (customTemplate && customTemplate.trim()) {
      customInstructionsText = `
[CLINICIAN CUSTOM SCRIBING INSTRUCTIONS]
You MUST strictly adhere to these additional clinical guidelines or formatting directions provided by the clinician:
=== CUSTOM INSTRUCTIONS START ===
${customTemplate.trim()}
=== CUSTOM INSTRUCTIONS END ===
`;
    }

    let premiumInstructions = `
[CRITICAL BILLING REQUIREMENT]
If the narrative indicates or implies this is a remote/telehealth session, you MUST explicitly state the following at the very top of the structured note:
"Session conducted via telehealth (POS 10 - Patient's Home) with audio and video (Modifier 95)."
This is a strict legal requirement to ensure proper non-facility reimbursement rates. If it is clearly not a telehealth session, ignore this requirement.
`;
    
    
    if (includeSummary) {
      premiumInstructions += `
[PREMIUM FEATURE: PATIENT SUMMARY]
After all other sections, you MUST append a new section titled '### Patient After-Visit Summary'.
Write a warm, empathetic summary of the visit addressed directly to the patient ("Hi [NAME]"). Write this at an 8th-grade reading level, avoiding all medical jargon. Include clear action items or next steps they should take before their next visit.`;
    }

const systemPrompt = `You are an expert clinical documentation assistant for a therapy practice.
Your task is to take raw, stream-of-consciousness session notes (or an audio recording of a therapy session) and do two things:

1. AGGRESSIVELY REDACT any Protected Health Information (PHI) and replace it with placeholders like [NAME], [DATE], [LOCATION], [UNIT]. PHI includes names, dates of birth, specific locations, exact deployment dates, or specific military unit numbers.
2. MILITARY/VA JARGON EXPANSION: If you detect military or VA acronyms (e.g., MST, TBI, OEF/OIF, PTSD, C&P, DBQ), perfectly expand and format them to meet Department of Veterans Affairs compliance standards.
3. ${formatInstructions}
${premiumInstructions}
${customInstructionsText}

IMPORTANT INSTRUCTIONS:
1. Output ONLY the final formatted document. Do not include any introductory conversational text.
2. If the provided raw notes or audio are empty, nonsensical, or too brief to form a meaningful clinical note, DO NOT hallucinate patient details. Instead, output: "**Error:** The provided input is insufficient to generate clinical documentation."`;

    const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
    
    // We removed audioFile handling here because the frontend now uses the Web Speech API 
    // to strictly enforce Zero-Transmission audio. Only text is received.
    
    let scrubbedNotes = rawNotes;

    if (rawNotes) {
      try {
        const dlp = new DLP.DlpServiceClient();
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'hiphealthai';
        const request = {
          parent: `projects/${projectId}/locations/global`,
          inspectConfig: {
            infoTypes: [
              { name: 'PERSON_NAME' },
              { name: 'US_SOCIAL_SECURITY_NUMBER' },
              { name: 'PHONE_NUMBER' },
              { name: 'EMAIL_ADDRESS' }
            ],
            minLikelihood: 'POSSIBLE',
          },
          deidentifyConfig: {
            infoTypeTransformations: {
              transformations: [
                {
                  primitiveTransformation: {
                    replaceConfig: {
                      newValue: { stringValue: '[REDACTED BY DLP]' }
                    }
                  }
                }
              ]
            }
          },
          item: { value: rawNotes },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [dlpResponse] = await dlp.deidentifyContent(request as any);
        if (dlpResponse.item?.value) {
          scrubbedNotes = dlpResponse.item.value;
          console.info(JSON.stringify({ event: 'DLP_SCRUB_SUCCESS', timestamp: new Date().toISOString() }));
        }
      } catch (dlpErr) {
        console.error('DLP Error:', dlpErr);
        // If DLP fails due to permissions in dev, we fallback to Gemini's internal instruction-based scrubbing
      }
      
      parts.push({ text: scrubbedNotes as string });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    const structuredNote = response.text;

    console.info(JSON.stringify({ 
      event: 'NOTE_GENERATED', 
      format: outputFormat,
      timestamp: new Date().toISOString() 
    }));

    return NextResponse.json({ structuredNote });
  } catch (err: unknown) {
    console.error('Error generating structured note:', err);
    return NextResponse.json(
      { error: 'Failed to process notes. Please try again.' },
      { status: 500 }
    );
  }
}

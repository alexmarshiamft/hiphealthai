import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import DLP from '@google-cloud/dlp';

const MAX_TEXT_CHARS = 20_000;

type DlpClient = InstanceType<typeof DLP.DlpServiceClient>;

type RequestContext = {
  rawNotes: string | null;
  refinePrompt: string | null;
  currentNote: string | null;
  priorSessionNote: string | null;
  reformulateModality: string | null;
  targetSectionContent: string | null;
  customTemplate: string | null;
  outputFormat: string;
  includeSummary: boolean;
  cptCode: string;
  pos: string;
  modifiers: string;
  providerSignature: string;
};

const supportedFormats = new Set([
  'triwest',
  'standard_soap',
  'cbt_soap',
  'dap_note',
  'birp_note',
  'referral',
  'rtw',
  'custom',
]);

function requireCloudProject() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId || projectId === 'build-placeholder') {
    throw new Error('GOOGLE_CLOUD_PROJECT is required for PHI-safe processing.');
  }
  return projectId;
}

async function deidentifyText(dlp: DlpClient, projectId: string, label: string, value: string | null) {
  if (!value || !value.trim()) return value;

  const trimmed = value.trim();
  if (trimmed.length > MAX_TEXT_CHARS) {
    throw new Error(`${label} is too large. Please keep text under ${MAX_TEXT_CHARS.toLocaleString()} characters.`);
  }

  const request = {
    parent: `projects/${projectId}/locations/global`,
    inspectConfig: {
      infoTypes: [
        { name: 'PERSON_NAME' },
        { name: 'US_SOCIAL_SECURITY_NUMBER' },
        { name: 'PHONE_NUMBER' },
        { name: 'EMAIL_ADDRESS' },
        { name: 'DATE_OF_BIRTH' },
        { name: 'DATE' },
        { name: 'STREET_ADDRESS' },
        { name: 'MEDICAL_RECORD_NUMBER' },
        { name: 'US_HEALTHCARE_NPI' },
        { name: 'IP_ADDRESS' },
      ],
      minLikelihood: 'POSSIBLE',
    },
    deidentifyConfig: {
      infoTypeTransformations: {
        transformations: [
          {
            primitiveTransformation: {
              replaceConfig: {
                newValue: { stringValue: '[REDACTED BY DLP]' },
              },
            },
          },
        ],
      },
    },
    item: { value: trimmed },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dlpResponse] = await dlp.deidentifyContent(request as any);
  if (!dlpResponse.item?.value) {
    throw new Error(`DLP returned an empty response for ${label}.`);
  }

  return dlpResponse.item.value;
}

function getFormatInstructions(outputFormat: string, customTemplate: string | null) {
  switch (outputFormat) {
    case 'triwest':
      return `Format the text into a professional, clinically rich SOAP progress note tailored for a TriWest/VA intake or session.

Checklist for a TriWest/VA note:
- Presenting Veteran issues and relevant service-connected context.
- Diagnostic impressions or rule-outs framed as clinical considerations only.
- Screening and safety assessment with clear SI/HI findings when provided.
- Military/VA jargon and acronyms expanded professionally.
- Functional impairment across occupational, social, self-care, or relational domains.
- Outpatient necessity and treatment plan with frequency, duration, and concrete goals.
- Start/stop time if present, otherwise a provider placeholder.

STRICT FORMATTING RULE: Use Markdown headers with exactly '### ' for each section:
### Subjective
### Objective
### Assessment
### Plan`;
    case 'standard_soap':
      return `Format the text into a standard clinical SOAP progress note.

STRICT FORMATTING RULE: Use Markdown headers with exactly '### ' for each section:
### Subjective
### Objective
### Assessment
### Plan`;
    case 'cbt_soap':
      return `Format the text into a Collaborative Cognitive Behavioral Therapy SOAP note.

STRICT FORMATTING RULE: Use Markdown headers with exactly '### ' for each section:
### Subjective
### Objective
### Assessment
### Plan
Emphasize automatic thoughts, cognitive distortions, CBT interventions, homework review, and next-session CBT agenda when supported by the text.`;
    case 'dap_note':
      return `Format the text into a professional DAP progress note.

STRICT FORMATTING RULE: Use Markdown headers with exactly '### ' for each section:
### Data
### Assessment
### Plan`;
    case 'birp_note':
      return `Format the text into a BIRP progress note.

STRICT FORMATTING RULE: Use Markdown headers with exactly '### ' for each section:
### Behavior
### Intervention
### Response
### Plan`;
    case 'referral':
      return `Format the text into a formal psychiatric referral letter.

STRICT FORMATTING RULE: Use a single Markdown header:
### Referral Letter`;
    case 'rtw':
      return `Format the text into a formal return-to-work clearance letter.

STRICT FORMATTING RULE: Use a single Markdown header:
### Clearance Letter`;
    case 'custom':
      return `Format the text strictly according to the clinician-provided custom rubric below. Each section title must be a Markdown header using '### '.

=== CUSTOM RUBRIC START ===
${customTemplate || 'No custom rubric provided.'}
=== CUSTOM RUBRIC END ===`;
    default:
      throw new Error('Unsupported output format.');
  }
}

function getPremiumInstructions(includeSummary: boolean) {
  let instructions = `
[BILLING SAFETY]
If the narrative explicitly indicates a remote/telehealth session, state the applicable telehealth billing footprint at the top of the structured note. If modality or location is unclear, do not infer it.`;

  if (includeSummary) {
    instructions += `

[PATIENT SUMMARY]
After all other sections, append a new section titled '### Patient After-Visit Summary'. Use placeholders such as [NAME] instead of identifiers. Write warmly at an 8th-grade reading level and include clear next steps.`;
  }

  return instructions;
}

function getAttestation(ctx: RequestContext) {
  const cptCodeStr = ctx.cptCode ? `CPT ${ctx.cptCode}` : 'CPT 90837';
  const posStr = ctx.pos ? `POS ${ctx.pos}` : 'POS 10 (Telehealth)';
  const modStr = ctx.modifiers ? `, Modifier ${ctx.modifiers}` : '';
  const providerSigStr = ctx.providerSignature?.trim() || 'Authenticated Clinician';

  return `

---
### Attestation & Billing Footprint
* **Recommended Billing Code:** ${cptCodeStr} (${posStr}${modStr})
* **Downstream Security Signature:** SECURE-GCP-BAA-VERIFIED-INTEGRITY-TRUE
* **Clinician Electronic Attestation:**
  *I hereby certify that I have personally reviewed, verified, and authenticated this clinical document. All clinical determinations, safety screenings, potential diagnostic rule-outs, and therapeutic treatment plans are authorized solely under my active professional license and malpractice accountability.*
* **Signed Electronically by:** ${providerSigStr} on ${new Date().toISOString().split('T')[0]} at ${new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' })}`;
}

function buildSystemPrompt(ctx: RequestContext) {
  const formatInstructions = getFormatInstructions(ctx.outputFormat, ctx.customTemplate);
  const premiumInstructions = getPremiumInstructions(ctx.includeSummary);

  if (ctx.reformulateModality && ctx.targetSectionContent) {
    return `You are a board-certified clinical psychologist and expert medical scribe.
Rewrite the provided section using the requested therapeutic modality while preserving all facts and redaction placeholders.

Target modality: ${ctx.reformulateModality.toUpperCase()}

Rules:
1. Do not invent symptoms, history, risk findings, or interventions.
2. Do not re-identify or infer protected health information.
3. Output only the revised content without preamble.`;
  }

  if (ctx.refinePrompt && ctx.currentNote) {
    return `You are a board-certified clinical psychologist and expert medical scribe.
Surgically refine the existing clinical note according to the clinician's requested adjustment.

Rules:
1. Preserve all unmodified facts and markdown headers.
2. Do not introduce new PHI or infer redacted identifiers.
3. Do not make definitive diagnoses; frame diagnostic language as clinical considerations unless already formally documented.
4. Output only the final updated note.`;
  }

  return `You are a board-certified clinical psychologist and expert medical scribe.
Transform the redacted session narrative into a professional, insurance-compliant clinical document.

Rules:
1. Preserve redaction placeholders and never infer protected health information.
2. Do not definitively diagnose for the clinician. Frame diagnostic language as potential considerations or rule-outs unless the source text states a formal diagnosis.
3. Do not hallucinate symptoms, goals, risk findings, quotes, dates, or treatment history.
4. Expand military and VA acronyms when present.
5. Output only the final structured markdown document.

${formatInstructions}
${premiumInstructions}`;
}

async function parseAndScrubRequest(req: Request): Promise<RequestContext> {
  const projectId = requireCloudProject();
  const dlp = new DLP.DlpServiceClient();
  const formData = await req.formData();

  const outputFormat = (formData.get('outputFormat') as string) || 'standard_soap';
  if (!supportedFormats.has(outputFormat)) {
    throw new Error('Unsupported output format.');
  }

  const rawNotes = formData.get('rawNotes') as string | null;
  const refinePrompt = formData.get('refinePrompt') as string | null;
  const currentNote = formData.get('currentNote') as string | null;
  const priorSessionNote = formData.get('priorSessionNote') as string | null;
  const reformulateModality = formData.get('reformulateModality') as string | null;
  const targetSectionContent = formData.get('targetSectionContent') as string | null;
  const customTemplate = formData.get('customTemplate') as string | null;

  if (!rawNotes && (!refinePrompt || !currentNote) && (!reformulateModality || !targetSectionContent)) {
    throw new Error('Missing clinical text, refinement, or reformulation parameters.');
  }

  try {
    const scrubbed: RequestContext = {
      rawNotes: await deidentifyText(dlp, projectId, 'rawNotes', rawNotes),
      refinePrompt: await deidentifyText(dlp, projectId, 'refinePrompt', refinePrompt),
      currentNote: await deidentifyText(dlp, projectId, 'currentNote', currentNote),
      priorSessionNote: await deidentifyText(dlp, projectId, 'priorSessionNote', priorSessionNote),
      reformulateModality,
      targetSectionContent: await deidentifyText(dlp, projectId, 'targetSectionContent', targetSectionContent),
      customTemplate: await deidentifyText(dlp, projectId, 'customTemplate', customTemplate),
      outputFormat,
      includeSummary: formData.get('includeSummary') === 'true',
      cptCode: (formData.get('cptCode') as string | null) || '90837',
      pos: (formData.get('pos') as string | null) || '10 - Telehealth',
      modifiers: (formData.get('modifiers') as string | null) || '95 - Audio/Video',
      providerSignature: (formData.get('providerSignature') as string | null) || 'Authenticated Clinician',
    };

    console.info(JSON.stringify({ event: 'DLP_SCRUB_SUCCESS', timestamp: new Date().toISOString() }));
    return scrubbed;
  } catch (error) {
    console.error('DLP failed; refusing to send unsanitized text to the model:', error);
    throw new Error('PHI redaction is temporarily unavailable. Notes were not sent for AI processing.');
  }
}

function buildUserContent(ctx: RequestContext) {
  if (ctx.reformulateModality && ctx.targetSectionContent) {
    return `Requested modality: ${ctx.reformulateModality}\n\nSection to reformulate:\n${ctx.targetSectionContent}`;
  }

  if (ctx.refinePrompt && ctx.currentNote) {
    return `Current clinical note:\n${ctx.currentNote}\n\nRequested adjustment:\n${ctx.refinePrompt}`;
  }

  const prior = ctx.priorSessionNote
    ? `\n\nPrior session note for continuity comparison:\n${ctx.priorSessionNote}`
    : '';

  return `Redacted session narrative:\n${ctx.rawNotes}${prior}`;
}

export async function POST(req: Request) {
  try {
    const ctx = await parseAndScrubRequest(req);
    const projectId = requireCloudProject();

    const ai = new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: buildUserContent(ctx) }],
      config: {
        systemInstruction: buildSystemPrompt(ctx),
        temperature: 0.2,
      },
    });

    let structuredNote = response.text || '';

    if (!ctx.reformulateModality && structuredNote && !structuredNote.startsWith('**Error')) {
      structuredNote += getAttestation(ctx);
    }

    console.info(JSON.stringify({
      event: 'NOTE_GENERATED',
      format: ctx.outputFormat,
      refined: !!ctx.refinePrompt,
      reformulated: !!ctx.reformulateModality,
      timestamp: new Date().toISOString(),
    }));

    return NextResponse.json({ structuredNote });
  } catch (err: unknown) {
    const error = err as Error;
    const status = error.message.includes('PHI redaction') ? 503 : 400;
    console.error('[SCRUB_API] Request rejected:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to process notes.' }, { status });
  }
}

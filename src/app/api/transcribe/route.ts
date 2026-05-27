import { NextRequest, NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';

// Initialise the Google Cloud Speech Client using Application Default Credentials (ADC)
const speechClient = new SpeechClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob | null;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert in-memory audio blob directly to Buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const audioBytes = buffer.toString('base64');
    
    const audio = {
      content: audioBytes,
    };

    const mimeType = audioFile.type || 'audio/webm';
    
    // Configure recording parameters based on client browser format
    let encoding: 'WEBM_OPUS' | 'MP4_AE' | 'LINEAR16' = 'WEBM_OPUS';
    let sampleRateHertz = 48000;

    if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
      encoding = 'MP4_AE';
      sampleRateHertz = 16000; // Optimal medical sampling rate
    } else if (mimeType.includes('webm')) {
      encoding = 'WEBM_OPUS';
      sampleRateHertz = 48000;
    }

    interface SpeechResult {
      alternatives?: Array<{
        transcript?: string;
      }>;
    }

    interface SpeechResponse {
      results?: SpeechResult[];
    }

    const config = {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: 'en-US',
      model: 'default',
      speechContexts: [{
        phrases: [
          'SOAP note', 'CBT', 'EMDR', 'ACT defusion', 'somatic grounding', 
          'catastrophizing', 'GAD-7', 'PHQ-9', 'EHR', 'SimplePractice',
          'clinician', 'client', 'assessment', 'symptom baseline',
          'cognitive distortions', 'thought record', 'suicidality', 'homicidality',
          'PTSD', 'MDD', 'Generalized Anxiety Disorder', 'behavioral activation'
        ],
        boost: 15.0
      }]
    };

    const request = {
      audio: audio,
      config: config,
    };

    console.info(`[GCP STT]: Transcribing in-memory audio chunk (size: ${buffer.length} bytes, mime: ${mimeType}, encoding: ${encoding})...`);

    const [response] = (await speechClient.recognize(request as unknown as Parameters<typeof speechClient.recognize>[0])) as unknown as [SpeechResponse];
    
    const transcription = response.results
      ?.map((result) => result.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim() || '';

    console.info(`[GCP STT]: Successfully completed transcription. Result length: ${transcription.length} chars.`);
    if (transcription) {
      console.info(`[GCP STT]: Transcribed Text: "${transcription}"`);
    } else {
      console.warn('[GCP STT]: Transcription returned empty text.');
    }

    return NextResponse.json({ text: transcription });
  } catch (err) {
    const error = err as Error;
    console.error('[GCP STT Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to process audio transcription' }, { status: 500 });
  }
}

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/alexandermarshi/Downloads/Hip-AI-scribe';
const INPUT_VIDEO = path.join(ARTIFACT_DIR, 'hip_ai_health_promo.mp4');
const OUTPUT_VIDEO = path.join(ARTIFACT_DIR, 'hip_ai_health_promo_voiced.mp4');
const GEMINI_DIR = '/Users/alexandermarshi/.gemini/antigravity/brain/5099dab5-4374-46b2-815a-c402fdf3e780';
const PARENT_DIR = '/Users/alexandermarshi/.gemini/antigravity/brain/87efc803-ffd7-40f8-bd29-7875cf3bd4e7';

const segments = [
  {
    id: 1,
    timeS: 0.5,
    text: "Welcome to HIP AI Health, the self branding clinical scribe cockpit that completely redefines privacy, compliance, and clinical charting."
  },
  {
    id: 2,
    timeS: 6.5,
    text: "Our strict HIPAA Shared Responsibility gateway enforces signed provider accountability before any patient data can be processed."
  },
  {
    id: 3,
    timeS: 16.0,
    text: "Clinicians can toggle instantly between space dark mode and medical grade light views for high visual comfort."
  },
  {
    id: 4,
    timeS: 30.0,
    text: "Pitching clinical groups? Scrape and morph the cockpit dynamically into their custom colors and practice labels in real time."
  },
  {
    id: 5,
    timeS: 45.5,
    text: "Save patient baselines locally in your browser's Indexed DB. Complete database bypass guarantees absolute data residency."
  },
  {
    id: 6,
    timeS: 66.0,
    text: "Prune conversational noise. Exclude weather talk and scheduling segments checklist to keep transcripts highly concise."
  },
  {
    id: 7,
    timeS: 81.0,
    text: "Automatically map session minutes to precise CPT billing codes, and append a secure cryptographic attestation watermark."
  },
  {
    id: 8,
    timeS: 106.0,
    text: "Review session stress arcs visually, clicking spline nodes to load evidence based CBT tips and interventions in real time."
  },
  {
    id: 9,
    timeS: 124.0,
    text: "Request isolated surgical edits conversationally without any risk of losing clinical facts or altering note structures."
  },
  {
    id: 10,
    timeS: 146.0,
    text: "Finally, trigger EHR autofill to watch de identified SOAP note text type directly into Simple Practice mockup fields."
  }
];

(async () => {
  console.log('--- STARTING CLINICAL PROMOTIONAL VOICEOVER GENERATION (BULLETPROOF CONCAT METHOD) ---');
  
  const voice = 'Ava';
  const voiceWavs = [];
  const gapWavs = [];
  const concatInputs = [];
  
  // 1. Generate speech segments using macOS TTS engine
  console.log('\nSynthesizing speech segments...');
  for (const seg of segments) {
    const aiffPath = path.join(ARTIFACT_DIR, `seg_${seg.id}.aiff`);
    const wavPath = path.join(ARTIFACT_DIR, `seg_${seg.id}.wav`);
    
    console.log(`Segment ${seg.id}: "${seg.text}"`);
    execSync(`say -v "${voice}" -o "${aiffPath}" "${seg.text}"`);
    execSync(`ffmpeg -y -i "${aiffPath}" -ac 2 -ar 44100 "${wavPath}" 2>/dev/null`);
    fs.unlinkSync(aiffPath);
    
    seg.wavPath = wavPath;
    voiceWavs.push(wavPath);
  }
  
  // 2. Mathematically compute silent gaps and generate silent wav files
  console.log('\nCalculating silent gaps to prevent voice overlap...');
  let currentOffset = 0;
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    
    // Read the exact spoken duration in seconds
    const durationStr = execSync(`ffprobe -i "${seg.wavPath}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
    const duration = parseFloat(durationStr);
    
    const gapDuration = seg.timeS - currentOffset;
    console.log(`Segment ${seg.id} duration: ${duration.toFixed(2)}s | Gap before segment: ${gapDuration.toFixed(2)}s`);
    
    if (gapDuration > 0.05) {
      const gapPath = path.join(ARTIFACT_DIR, `gap_${seg.id}.wav`);
      // Create a perfectly formatted 44.1kHz stereo silent wav
      execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${gapDuration} "${gapPath}" 2>/dev/null`);
      gapWavs.push(gapPath);
      
      concatInputs.push(gapPath);
    }
    
    concatInputs.push(seg.wavPath);
    
    // Update offset tracker
    currentOffset = seg.timeS + duration;
  }
  
  // 3. Assemble inputs and filters for bulletproof concatenation
  console.log('\nConcatenating silence gaps and speech tracks sequentially...');
  const inputParams = concatInputs.map(f => `-i "${f}"`).join(' ');
  const filterInputs = concatInputs.map((_, idx) => `[${idx}:a]`).join('');
  const concatFilter = `${filterInputs}concat=n=${concatInputs.length}:v=0:a=1[aout]`;
  
  const masterAudioPath = path.join(ARTIFACT_DIR, 'master_voiceover.wav');
  const mixCommand = `ffmpeg -y ${inputParams} -filter_complex "${concatFilter}" -map "[aout]" "${masterAudioPath}"`;
  console.log(`Running concat command: ${mixCommand}`);
  execSync(mixCommand);
  
  // 4. Merge voiceover audio with the visual H.264 video
  console.log('\nMerging master voiceover track with high-definition MP4 promo video...');
  const mergeCommand = `ffmpeg -y -i "${INPUT_VIDEO}" -i "${masterAudioPath}" -c:v copy -c:a aac -b:a 192k -shortest "${OUTPUT_VIDEO}"`;
  console.log(`Running merge command: ${mergeCommand}`);
  execSync(mergeCommand);
  
  // 5. Cleanup temporary WAV files
  console.log('\nCleaning up temporary audio tracks...');
  for (const file of voiceWavs) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  for (const file of gapWavs) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  if (fs.existsSync(masterAudioPath)) fs.unlinkSync(masterAudioPath);
  
  console.log('\nCopying voiced video to current and parent conversation artifacts folders...');
  try {
    fs.copyFileSync(OUTPUT_VIDEO, path.join(GEMINI_DIR, 'hip_ai_health_promo_voiced.mp4'));
    console.log(`Voiced video copied to GEMINI_DIR: ${path.join(GEMINI_DIR, 'hip_ai_health_promo_voiced.mp4')}`);
  } catch (e) { console.error('Error copying to GEMINI_DIR:', e); }

  try {
    fs.copyFileSync(OUTPUT_VIDEO, path.join(PARENT_DIR, 'hip_ai_health_promo_voiced.mp4'));
    console.log(`Voiced video copied to PARENT_DIR: ${path.join(PARENT_DIR, 'hip_ai_health_promo_voiced.mp4')}`);
  } catch (e) { console.error('Error copying to PARENT_DIR:', e); }
  
  console.log('\n======================================================================');
  console.log('SUCCESS! Voiced clinical promotional commercial generated successfully!');
  console.log(`Voiced Video path: ${OUTPUT_VIDEO}`);
  console.log('======================================================================\n');
})().catch(err => {
  console.error('Fatal error during voiceover generation:', err);
  process.exit(1);
});

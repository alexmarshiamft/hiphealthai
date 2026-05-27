'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, ShieldAlert, CheckCircle2, ArrowRight, Clipboard, Loader2, ShieldCheck, Lock, 
  Server, EyeOff, Mic, Square, MessageSquare, X, Sparkles, Download, Settings, 
  Trash2, Calendar, UserPlus, History, Award, BookOpen, Layers, Sun, Moon
} from 'lucide-react';
import styles from './dashboard.module.css';

import {
  savePatient,
  getPatients,
  deletePatient,
  saveNote,
  getNotesByPatient,
  saveTemplate,
  getTemplates,
  AnonymizedPatient,
  ScrubbedNote,
  CustomTemplate
} from '../../lib/localDB';

const SAMPLE_CASES = {
  caseA: {
    name: 'Anxiety (GAD) Case',
    raw: `Subjective: Client Sarah Connor reports feeling overwhelmed at work, experiencing chest tightness and negative self-talk ('I am failing everyone'). Identified cognitive distortions of catastrophizing. DOB: 11/12/1984, Phone: 415-555-0199.
Objective: Client appeared fatigued, flat affect, speech rapid. Cooperative throughout session.
Assessment: GAD symptoms exacerbated by work stressors. Client responded well to cognitive restructuring exercises.
Plan: Continue CBT weekly, client agreed to complete daily thought records before next session. Goal: reduce baseline anxiety score from 8/10 to 5/10.`,
    soap: `### Subjective
Client reports feeling extremely overwhelmed at work. Specifically experiences physiological symptoms of chest tightness and hyperventilation, paired with cognitive distortions (catastrophizing: "I am failing everyone").

### Objective
Client was cooperative, displayed rapid speech patterns, fatigued facial expressions, and generally flat affect.

### Assessment
Generalized Anxiety Disorder (GAD) symptoms currently exacerbated by professional stressors. Positive response noted to active CBT cognitive restructuring and cognitive restructuring grounding exercises.

### Plan & Treatment Plan
1. Continue weekly CBT session focused on identifying catastrophizing triggers.
2. Clinician instructed client to complete daily thought records before next session.`
  },
  caseB: {
    name: 'MDD Case',
    raw: `Subjective: Client reports low energy, withdrawing from friends, and sleeping 10 hours a day. Reports feeling isolated. DOB: 05/20/1979, Email: patient.b@example.com.
Objective: Client was tearful at times, slow processing speed, poor eye contact.
Assessment: Major Depressive Disorder (MDD) episode, mild severity, characterized by social withdrawal. Client participated in brainstorming behavioral activation ideas.
Plan: Client will schedule one walk with a friend this weekend. Follow up in one week.`,
    soap: `### Subjective
Client presents with high fatigue, marked social withdrawal, feelings of isolation, and hypersomnia (averaging 10 hours of sleep daily).

### Objective
Client displayed limited eye contact, slow verbal processing latency, and was tearful at multiple points in the session.

### Assessment
Mild Major Depressive Disorder (MDD) characterized by isolation. Responsive to collaborative brainstorming for behavioral activation.

### Plan & Treatment Plan
1. Behavioral Activation: Client committed to walking once with a friend over the weekend.
2. Clinical follow-up session scheduled in 7 days to review behavioral activation records.`
  },
  caseC: {
    name: 'PTSD Trigger Case',
    raw: `Subjective: Client experienced an anxiety trigger after hearing a loud bang at their apartment complex. Reports physiological arousal and hypervigilance. DOB: 09/04/1991, SSN: 999-12-3456.
Objective: Client appeared hyper-alert, scanning room, tense posture.
Assessment: PTSD trigger related to previous physical assault. Evaluated safety, client is stable.
Plan: Client will use 5-4-3-2-1 sensory grounding exercise if triggered. Schedule bi-weekly follow-up.`,
    soap: `### Subjective
Client reports physiological hyperarousal and intense hypervigilance triggered by a sudden loud noise near home.

### Objective
Client appeared hyper-alert, actively scanning the workspace, and maintaining a rigid, tense posture.

### Assessment
PTSD trigger related to historic physical assault. Full clinical safety plan evaluated; client stable and safe in current environment.

### Plan & Treatment Plan
1. Sensory Grounding: Clinician reviewed 5-4-3-2-1 technique. Client agreed to implement when triggered.
2. Clinical review session scheduled in two weeks.`
  }
};



const getRecommendedCPT = (duration: number) => {
  if (duration >= 53) {
    return {
      code: '90837',
      desc: 'Psychotherapy, 53+ minutes (typically 60-minute session)',
      reimbursement: '$130 - $180'
    };
  } else if (duration >= 38) {
    return {
      code: '90834',
      desc: 'Psychotherapy, 38-52 minutes (typically 45-minute session)',
      reimbursement: '$90 - $120'
    };
  } else if (duration >= 16) {
    return {
      code: '90832',
      desc: 'Psychotherapy, 16-37 minutes (typically 30-minute session)',
      reimbursement: '$60 - $85'
    };
  } else {
    return {
      code: 'None (Non-billable)',
      desc: 'Psychotherapy session duration is too short for billing (< 16 mins)',
      reimbursement: '$0'
    };
  }
};

export default function Dashboard() {
  const [rawNotes, setRawNotes] = useState('');
  const [structuredNote, setStructuredNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Recording & Transcribing States
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // HIPAA Shared Responsibility Gating State (Hydration-Safe)
  const [hasAcceptedSharedResponsibility, setHasAcceptedSharedResponsibility] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hipaa_responsibility_accepted') === 'true';
    }
    return true;
  });
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Chrome Extension Simulation
  const [isSimulatingAutofill, setIsSimulatingAutofill] = useState(false);
  const [autofillComplete, setAutofillComplete] = useState(false);
  const [autofillText, setAutofillText] = useState('');
  const [activeSampleCase, setActiveSampleCase] = useState('caseA');
  const [isSimulatingMic, setIsSimulatingMic] = useState(false);

  // Interactive Clinical Onboarding Tour state
  const [activeTourTab, setActiveTourTab] = useState('overview');

  // Custom workspace decluttering tabs
  const [activeOutputTab, setActiveOutputTab] = useState('note');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWhitelabel, setShowWhitelabel] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme
  useEffect(() => {
    const savedTheme = typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'dark') : 'dark';
    setIsDarkMode(savedTheme === 'dark');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  // --- NEW ADVANCED CLINICAL STATES ---
  // Anonymous Patient Manager & Local Stitching
  const [patientsList, setPatientsList] = useState<AnonymizedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<AnonymizedPatient | null>(null);
  const [notesHistory, setNotesHistory] = useState<ScrubbedNote[]>([]);
  const [enableTrendStitching, setEnableTrendStitching] = useState(false);
  const [newPatientGoals, setNewPatientGoals] = useState('');
  const [newPatientBaseline, setNewPatientBaseline] = useState('');
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Custom B2B Template Builder
  const [customTemplatesList, setCustomTemplatesList] = useState<CustomTemplate[]>([]);
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateInstructions, setNewTemplateInstructions] = useState('');
  const [newTemplateSections, setNewTemplateSections] = useState<string[]>(['Subjective', 'Objective', 'Assessment', 'Plan']);
  const [activeBuilderSection, setActiveBuilderSection] = useState('');

  // Billing Assistant
  const [sessionDuration, setSessionDuration] = useState(55); // Minutes
  const [isTelehealth, setIsTelehealth] = useState(true);
  const [providerSignature, setProviderSignature] = useState('Dr. Sarah Jenkins, PsyD');

  // Speaker Diarization / Toggle segments
  const [dialogueSegments, setDialogueSegments] = useState<Array<{ id: number; speaker: string; text: string; enabled: boolean }>>([]);
  const [diarizationActive, setDiarizationActive] = useState(true);



  // Modality Reformulating Card indicator
  const [reformulatingCard, setReformulatingCard] = useState<string | null>(null);

  // Interactive Whitelabel Previewer States
  const [whitelabelUrl, setWhitelabelUrl] = useState('');
  const [isScrapingBrand, setIsScrapingBrand] = useState(false);
  const [whitelabelConfig, setWhitelabelConfig] = useState<{
    practiceName: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    logoText: string;
    slogan: string;
    presets: string[];
  } | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('whitelabel') === 'true') {
        return {
          practiceName: params.get('practiceName') || '',
          primaryColor: params.get('primaryColor') || '',
          secondaryColor: params.get('secondaryColor') || '',
          backgroundColor: params.get('backgroundColor') || '',
          logoText: params.get('logoText') || '',
          slogan: params.get('slogan') || '',
          presets: [
            'Anxiety (GAD) Presets & Catastrophizing summary',
            'Depression (MDD) Presets & Outpatient charting',
            'PTSD EMDR Sensory Grounding session summary'
          ]
        };
      }
    }
    return null;
  });
  const getWhitelabelShareLink = () => {
    if (!whitelabelConfig) return '';
    const params = new URLSearchParams();
    params.set('whitelabel', 'true');
    params.set('practiceName', whitelabelConfig.practiceName);
    params.set('primaryColor', whitelabelConfig.primaryColor);
    params.set('secondaryColor', whitelabelConfig.secondaryColor);
    params.set('backgroundColor', whitelabelConfig.backgroundColor);
    params.set('logoText', whitelabelConfig.logoText);
    params.set('slogan', whitelabelConfig.slogan);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleScrapeWhitelabel = async () => {
    if (!whitelabelUrl.trim()) return;
    setIsScrapingBrand(true);
    try {
      const res = await fetch('/api/whitelabel/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: whitelabelUrl }),
      });
      const data = await res.json();
      if (res.ok && data) {
        setWhitelabelConfig(data);
        
        // Dynamically override core CSS variables to morph colors immediately
        document.documentElement.style.setProperty('--bg-color', data.backgroundColor);
        document.documentElement.style.setProperty('--primary', data.primaryColor);
        document.documentElement.style.setProperty('--primary-hover', data.secondaryColor);
        
        // Create an audit log trace for Whitelabel Brand generation
        fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'BRAND_MORPH_APPLIED', details: { url: whitelabelUrl, practiceName: data.practiceName } })
        }).catch(console.error);
      } else {
        alert(data.error || 'Failed to extract branding data.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while connecting to the branding scraper.');
    } finally {
      setIsScrapingBrand(false);
    }
  };

  useEffect(() => {
    if (whitelabelConfig) {
      if (whitelabelConfig.backgroundColor) document.documentElement.style.setProperty('--bg-color', whitelabelConfig.backgroundColor);
      if (whitelabelConfig.primaryColor) document.documentElement.style.setProperty('--primary', whitelabelConfig.primaryColor);
      if (whitelabelConfig.secondaryColor) document.documentElement.style.setProperty('--primary-hover', whitelabelConfig.secondaryColor);
    }
  }, [whitelabelConfig]);

  useEffect(() => {
    fetch('/api/mfa/status')
      .then(res => res.json())
      .then(data => {
        if (!data.hasActiveSession) {
          window.location.href = '/login';
        } else {
          const demo = data.mfaMethod === 'sms_sandbox';
          setIsDemoMode(demo);
          
          if (demo) {
            setRawNotes(SAMPLE_CASES.caseA.raw);
            syncSegmentsFromRawNotes(SAMPLE_CASES.caseA.raw);
          } else {
            if (!data.baaSigned) {
              window.location.href = '/consent';
            }
          }
        }
      })
      .catch(err => {
        console.error(err);
        window.location.href = '/login';
      });

    // Load Local IndexedDB Profiles & Templates on mount
    async function loadLocalDBData() {
      try {
        const loadedPatients = await getPatients();
        setPatientsList(loadedPatients);
        
        const loadedTemplates = await getTemplates();
        setCustomTemplatesList(loadedTemplates);
      } catch (dbErr) {
        console.error('Error loading IndexedDB data on mount:', dbErr);
      }
    }
    loadLocalDBData();
  }, []);

  // Synchronize raw notes into diarized segment toggles automatically
  function syncSegmentsFromRawNotes(text: string) {
    if (!text.trim()) {
      setDialogueSegments([]);
      return;
    }
    const lines = text.split('\n');
    const segments: Array<{ id: number; speaker: string; text: string; enabled: boolean }> = [];
    let currentId = 1;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('Speaker A:') || trimmed.startsWith('Speaker B:') || trimmed.startsWith('Client:') || trimmed.startsWith('Clinician:')) {
        const colonIdx = trimmed.indexOf(':');
        const speaker = trimmed.substring(0, colonIdx).trim();
        const segText = trimmed.substring(colonIdx + 1).trim();
        segments.push({ id: currentId++, speaker, text: segText, enabled: true });
      } else {
        segments.push({ id: currentId++, speaker: 'Narrative Segment', text: trimmed, enabled: true });
      }
    }
    setDialogueSegments(segments);
  }

  // Dialogue segments sync useEffect removed to eliminate cascading renders

  // Load Patient history whenever selected patient changes
  useEffect(() => {
    async function loadNotesHistory() {
      if (selectedPatientId) {
        try {
          const notes = await getNotesByPatient(selectedPatientId);
          setNotesHistory(notes);
          
          const profile = patientsList.find(p => p.id === selectedPatientId) || null;
          setSelectedPatient(profile);
        } catch (err) {
          console.error('Error loading notes history:', err);
        }
      } else {
        setNotesHistory([]);
        setSelectedPatient(null);
      }
    }
    loadNotesHistory();
  }, [selectedPatientId, patientsList]);


  const handleRawNotesChange = (value: string) => {
    setRawNotes(value);
    syncSegmentsFromRawNotes(value);
  };

  const stopRecording = useCallback(() => {
    setIsSimulatingMic(false);

    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder, isRecording]);

  const handleAcceptResponsibility = () => {
    localStorage.setItem('hipaa_responsibility_accepted', 'true');
    setHasAcceptedSharedResponsibility(true);
  };

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const [outputFormat, setOutputFormat] = useState('standard_soap');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Premium Add-Ons
  const [includeSummary, setIncludeSummary] = useState(false);
  const [customTemplate, setCustomTemplate] = useState('');

  // Presets & Note Refiner
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Declarations moved to top of component

  const [isBlurred, setIsBlurred] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Idle Timer Logic ---
  const resetIdleTimer = useCallback(() => {
    setIsBlurred(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    // 3 minutes = blur
    idleTimerRef.current = setTimeout(() => {
      setIsBlurred(true);
    }, 3 * 60 * 1000);

    // 5 minutes = logout
    logoutTimerRef.current = setTimeout(() => {
      window.location.href = '/';
    }, 5 * 60 * 1000);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        // Wipe clipboard on tab switch to be safe
        navigator.clipboard.writeText('');
      } else {
        // Also wipe clipboard when they return (Wipe on Return)
        navigator.clipboard.writeText('');
        resetIdleTimer();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block generic copy shortcuts and print shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'p')) {
        e.preventDefault();
      }
      
      // Block PrintScreen key and instantly blur the screen as a hostile deterrence
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setIsBlurred(true);
        navigator.clipboard.writeText('');
      }
    };

    const handleCopyEvent = (e: ClipboardEvent) => {
      // Only block copy if they aren't copying from our specific button
      // To be strictly secure, we prevent default copying entirely on the document
      e.preventDefault();
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetIdleTimer));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopyEvent);
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetIdleTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopyEvent);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [resetIdleTimer]);
  // ------------------------

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulatingMic && isRecording) {
      timer = setTimeout(() => {
        stopRecording();
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [isSimulatingMic, isRecording, activeSampleCase, stopRecording]);

  const startRecording = async () => {
    setError('');
    
    // Turn on the beautiful glowing visualizer waves in all modes
    setIsSimulatingMic(true);

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Select the optimal MIME type based on client OS support
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }
      
      const mediaRecorderInstance = new MediaRecorder(stream, options);
      setMediaRecorder(mediaRecorderInstance);
      
      mediaRecorderInstance.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderInstance.onstop = async () => {
        setIsTranscribing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderInstance.mimeType });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'speech.bin');
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to transcribe audio.');
          }
          
          if (data.text) {
            setRawNotes((prev) => {
              const next = prev + (prev ? '\n' : '') + data.text;
              syncSegmentsFromRawNotes(next);
              return next;
            });
          }
        } catch (err) {
          console.error(err);
          setError('Transcription error: ' + (err as Error).message);
        } finally {
          setIsTranscribing(false);
          // Terminate microphone stream to release system lock
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderInstance.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setIsSimulatingMic(false);
      setError('Could not access microphone. Please check your browser permissions.');
    }
  };

  // Hoisted stopRecording arrow function removed from this position

  const handleProcess = async () => {
    if (!rawNotes.trim()) {
      setError('Please enter some notes to process.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setStructuredNote('');
    setCopiedSection(null);
    setAutofillComplete(false);

    try {
      // 1. Dialogue Filtration checks
      let activeNotes = rawNotes.trim();
      if (diarizationActive && dialogueSegments.length > 0) {
        activeNotes = dialogueSegments
          .filter(seg => seg.enabled)
          .map(seg => `${seg.speaker}: ${seg.text}`)
          .join('\n');
      }

      const formData = new FormData();
      formData.append('rawNotes', activeNotes);
      formData.append('outputFormat', outputFormat);
      if (includeSummary) formData.append('includeSummary', 'true');
      
      // 2. Dynamic Cross-Session Stitching
      if (enableTrendStitching && selectedPatientId && notesHistory.length > 0) {
        const lastNote = notesHistory[notesHistory.length - 1];
        formData.append('priorSessionNote', lastNote.content);
      }

      // 3. Billing CPT Recommendations & Sign-off parameters
      const durationVal = sessionDuration;
      const cptVal = durationVal >= 53 ? '90837' : durationVal >= 38 ? '90834' : '90832';
      formData.append('cptCode', cptVal);
      formData.append('pos', isTelehealth ? '10 - Patient Home (Telehealth)' : '11 - Office Visit');
      formData.append('modifiers', isTelehealth ? '95' : '');
      formData.append('providerSignature', providerSignature);

      // Check if outputFormat is a custom template
      const matchingTemplate = customTemplatesList.find(t => t.id === outputFormat);
      if (matchingTemplate) {
        formData.append('customTemplate', `${matchingTemplate.instructions}\n\nStrictly divide note into these exact markdown headers: ${matchingTemplate.sections.map(s => `### ${s}`).join(', ')}`);
      } else if (customTemplate.trim()) {
        formData.append('customTemplate', customTemplate.trim());
      }

      const response = await fetch('/api/scrub', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process notes');
      }

      setStructuredNote(data.structuredNote);

      // 4. Save to client-side local database history
      if (selectedPatientId) {
        const newNote: ScrubbedNote = {
          patientId: selectedPatientId,
          date: new Date().toISOString(),
          outputFormat,
          content: data.structuredNote
        };
        await saveNote(newNote);
        const refreshedNotes = await getNotesByPatient(selectedPatientId);
        setNotesHistory(refreshedNotes);
      }
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim() || !structuredNote) return;

    setIsRefining(true);
    setRefineError(null);

    try {
      const formData = new FormData();
      formData.append('refinePrompt', refinePrompt.trim());
      formData.append('currentNote', structuredNote);
      formData.append('outputFormat', outputFormat);
      if (includeSummary) formData.append('includeSummary', 'true');
      
      const durationVal = sessionDuration;
      const cptVal = durationVal >= 53 ? '90837' : durationVal >= 38 ? '90834' : '90832';
      formData.append('cptCode', cptVal);
      formData.append('pos', isTelehealth ? '10 - Patient Home (Telehealth)' : '11 - Office Visit');
      formData.append('modifiers', isTelehealth ? '95' : '');
      formData.append('providerSignature', providerSignature);

      const matchingTemplate = customTemplatesList.find(t => t.id === outputFormat);
      if (matchingTemplate) {
        formData.append('customTemplate', `${matchingTemplate.instructions}\n\nStrictly divide note into these exact markdown headers: ${matchingTemplate.sections.map(s => `### ${s}`).join(', ')}`);
      } else if (customTemplate.trim()) {
        formData.append('customTemplate', customTemplate.trim());
      }

      const response = await fetch('/api/scrub', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refine note');
      }

      setStructuredNote(data.structuredNote);
      setRefinePrompt('');
    } catch (err: unknown) {
      console.error(err);
      setRefineError((err as Error).message || 'An unexpected error occurred during refinement.');
    } finally {
      setIsRefining(false);
    }
  };

  // --- ANONYMOUS PATIENT PROFILE HANDLERS ---
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientGoals.trim() || !newPatientBaseline.trim()) return;

    try {
      const patientId = `Patient-TX-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPat: AnonymizedPatient = {
        id: patientId,
        treatmentGoals: newPatientGoals.trim(),
        symptomBaseline: newPatientBaseline.trim(),
        createdAt: new Date().toISOString()
      };

      await savePatient(newPat);
      setPatientsList(prev => [...prev, newPat]);
      setSelectedPatientId(patientId);
      setNewPatientGoals('');
      setNewPatientBaseline('');
      setIsPatientModalOpen(false);
    } catch (err) {
      console.error('Error saving patient profile:', err);
    }
  };

  const handleDeletePatientProfile = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this anonymous patient profile and all their note history? This action is local and non-reversible.')) {
      try {
        await deletePatient(id);
        setPatientsList(prev => prev.filter(p => p.id !== id));
        if (selectedPatientId === id) {
          setSelectedPatientId('');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- CLINICAL THEORY CARD REFORMULATOR HANDLER ---
  const handleReformulateSection = async (title: string, content: string, modality: string) => {
    if (!structuredNote) return;
    setReformulatingCard(title);

    try {
      const formData = new FormData();
      formData.append('reformulateModality', modality);
      formData.append('targetSectionContent', content);

      const response = await fetch('/api/scrub', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reformulate section');
      }

      // Replace target section inside structuredNote
      const parts = structuredNote.split(/(?:^|\n)###\s+(.*)/).filter(Boolean);
      let updatedNote = '';
      for (let i = 0; i < parts.length; i += 2) {
        const sectTitle = parts[i]?.trim();
        let sectContent = parts[i + 1]?.trim();
        
        if (sectTitle === title) {
          sectContent = data.structuredNote.trim();
        }
        
        if (sectTitle && sectContent) {
          updatedNote += `${updatedNote ? '\n' : ''}### ${sectTitle}\n${sectContent}`;
        }
      }

      setStructuredNote(updatedNote);
    } catch (err: unknown) {
      console.error(err);
      alert((err as Error).message || 'Error reformulating note section.');
    } finally {
      setReformulatingCard(null);
    }
  };

  // --- B2B CUSTOM TEMPLATE BUILDER HANDLERS ---
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newTemplateInstructions.trim()) return;

    try {
      const templateId = `custom_${newTemplateName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const newTemp: CustomTemplate = {
        id: templateId,
        name: newTemplateName.trim(),
        instructions: newTemplateInstructions.trim(),
        sections: newTemplateSections
      };

      await saveTemplate(newTemp);
      setCustomTemplatesList(prev => [...prev, newTemp]);
      setOutputFormat(templateId);
      setNewTemplateName('');
      setNewTemplateInstructions('');
      setNewTemplateSections(['Subjective', 'Objective', 'Assessment', 'Plan']);
      setIsTemplateDrawerOpen(false);
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  // Unused handleDeleteTemplateProfile removed

  const startAutofillSimulation = () => {
    setActiveOutputTab('ehr');
    if (isSimulatingAutofill || !structuredNote) return;
    setIsSimulatingAutofill(true);
    setAutofillComplete(false);
    setAutofillText('');

    // Extract the text to autofill
    const plainTextNote = structuredNote;
    const words = plainTextNote.split(" ");
    let currentWordIndex = 0;

    const interval = setInterval(() => {
      if (currentWordIndex >= words.length) {
        clearInterval(interval);
        setAutofillComplete(true);
        setIsSimulatingAutofill(false);
      } else {
        setAutofillText(prev => prev + (prev ? " " : "") + words[currentWordIndex]);
        currentWordIndex++;
      }
    }, 40); // Fast typing simulation
  };

  const handleCopy = (textToCopy: string, sectionName: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedSection(sectionName);
    
    // Fire immutable audit log
    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'NOTE_COPIED', details: { section: sectionName } })
    }).catch(console.error);

    setTimeout(() => setCopiedSection(null), 3000);
    
    // 60-Second Auto-Wipe
    setTimeout(() => {
      navigator.clipboard.writeText('');
    }, 60000);
  };

  const handleDownloadPDF = () => {
    if (!structuredNote) return;

    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      
      // Header details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(31, 107, 107);
      doc.text('HIP AI HEALTH SECURE SCRIBE', 14, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text('CONFIDENTIAL CLINICAL NOTE (ZERO-RETENTION RECORDBYPASS)', 14, 34);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 38, 196, 38);
      
      // Document text
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      
      // Split by lines to draw paragraphs beautifully
      const textLines = doc.splitTextToSize(structuredNote, 182);
      doc.text(textLines, 14, 48);
      
      // Audit log details
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('This clinical note was securely generated on a local browser workstation with 100% database bypass.', 14, 280);
      doc.text('Verification: Certified zero data logs kept on servers. All diagnostic responsibility is with the signing clinician.', 14, 285);
      
      // Fire immutable audit log
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'NOTE_DOWNLOADED', details: { format: 'PDF' } })
      }).catch(console.error);

      doc.save(`Clinical_Note_${new Date().toISOString().split('T')[0]}.pdf`);
    }).catch(err => {
      console.error('Failed to load jsPDF dynamically:', err);
    });
  };

  const renderParsedSections = () => {
    if (!structuredNote) return null;

    // Split by Markdown headers (e.g., "### Subjective")
    const parts = structuredNote.split(/(?:^|\n)###\s+(.*)/).filter(Boolean);
    
    // If the output doesn't use headers (e.g., an error or unexpected format), return as one block
    if (parts.length === 1) {
      return (
        <div className={styles.sectionCard}>
          <div className={styles.sectionContent}>{parts[0].trim()}</div>
          <button className={styles.copySectionBtn} onClick={() => handleCopy(parts[0].trim(), 'Full Note')}>
            {copiedSection === 'Full Note' ? <><CheckCircle2 size={16}/> Copied!</> : <><Clipboard size={16}/> Copy Note</>}
          </button>
        </div>
      );
    }

    const sections = [];
    for (let i = 0; i < parts.length; i += 2) {
      const title = parts[i]?.trim();
      const content = parts[i + 1]?.trim();
      
      // Skip rendering the Attestation signature as a reformulatable section
      if (title === 'Attestation & Billing Footprint') {
        sections.push(
          <div key={title} className={styles.sectionCard} style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)', width: '100%', boxSizing: 'border-box' }}>
            <h4 className={styles.sectionTitle} style={{ color: '#10b981', borderBottomColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🖋️ Clinician Attestation & Billing Footprint</h4>
            <div className={styles.sectionContent} style={{ fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'pre-wrap', color: 'var(--text-main)', lineHeight: 1.5 }}>{content}</div>
            <button className={styles.copySectionBtn} onClick={() => handleCopy(content, title)}>
              {copiedSection === title ? <><CheckCircle2 size={16}/> Copied!</> : <><Clipboard size={16}/> Copy Attestation</>}
            </button>
          </div>
        );
        continue;
      }

      if (title && content) {
        const isReformulating = reformulatingCard === title;

        sections.push(
          <div key={title} className={styles.sectionCard} style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <h4 className={styles.sectionTitle} style={{ margin: 0, border: 'none', padding: 0 }}>{title}</h4>
              
              {/* Modality Reformulator Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={12} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Theory Reformulate:</span>
                <select
                  disabled={isProcessing || isReformulating}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleReformulateSection(title, content, e.target.value);
                    }
                  }}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.4rem',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="" disabled>(Select Theory)</option>
                  <option value="cbt">CBT Restructuring</option>
                  <option value="act">ACT Defusion</option>
                  <option value="emdr">EMDR Bilateral</option>
                  <option value="ifs">IFS Internal Parts</option>
                  <option value="psychodynamic">Psychodynamic attachment</option>
                  <option value="somatic">Somatic grounding</option>
                </select>
              </div>
            </div>

            <div className={styles.sectionContent} style={{ position: 'relative', whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.92rem' }}>
              {isReformulating && (
                <div style={{
                  position: 'absolute',
                  top: '-10px', left: '-10px', right: '-10px', bottom: '-10px',
                  backgroundColor: 'rgba(6, 9, 14, 0.85)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', zIndex: 10, borderRadius: '6px',
                  backdropFilter: 'blur(3px)',
                  WebkitBackdropFilter: 'blur(3px)'
                }}>
                  <Loader2 className={styles.spinner} size={24} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Applying Theoretical Modality...</span>
                </div>
              )}
              {content}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              <button className={styles.copySectionBtn} onClick={() => handleCopy(content, title)}>
                {copiedSection === title ? <><CheckCircle2 size={16}/> Copied!</> : <><Clipboard size={16}/> Copy {title}</>}
              </button>
            </div>
          </div>
        );
      }
    }
    return <div className={styles.sectionsContainer}>{sections}</div>;
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedbackText })
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setIsFeedbackOpen(false);
        setFeedbackSuccess(false);
        setFeedbackText('');
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Generate repeating watermark text
  const watermarkText = `dr.smith@example.com  |  ${new Date().toISOString().split('T')[0]}  |  HIPAA AUDIT LOGGING ACTIVE   `.repeat(200);

  return (
    <div className={styles.container}>
      {!hasAcceptedSharedResponsibility && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
        }}>
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
            textAlign: 'left'
          }}>
            <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                HIPAA Shared Responsibility Agreement
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Operational security parameters and ultimate clinician clinical liability covenant.
              </p>
            </header>

            {/* Why This is HIPAA-Compliant */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                1. System Privacy Safeguards (Why This is HIPAA-Compliant)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>🔒 End-to-End Encryption</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>All data encrypted in transit using TLS 1.3 and at rest on Google Cloud Enterprise using AES-256.</span>
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>🗄️ Business Associate Agreement (BAA)</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>Requests routed exclusively through Google Vertex AI covered under a legally signed enterprise HIPAA BAA.</span>
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>🚫 Zero Data Retention</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>Transcriptions processed ephemerally in RAM and destroyed. Clipboard wiped clean after 60s.</span>
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>🧠 No Model Training</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block' }}>Google guarantees clinical session recordings are strictly prohibited from being used to train foundational AI models.</span>
                </div>
              </div>
            </div>

            {/* Shared Responsibility Matrix */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                2. Shared Responsibility & Practice Safeguards
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Under HIPAA guidelines, security is a <strong>shared responsibility</strong>. While the software provides a fully encrypted, zero-retention conduit, the practice and clinician hold final clinical, legal, and operational custody:
              </p>
              <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', fontSize: '0.85rem', color: '#c53030', lineHeight: 1.5 }}>
                1. **100% CLINICAL & PRACTICE LIABILITY:** The practice carries exclusive, un-delegable civil, professional, and ethical liability for all progress notes. The software developer and platform owner hold absolutely **zero liability** under any circumstances.<br />
                2. **Device & Idle Locking:** The clinician is ultimately responsible for maintaining physical device security, locking screen access, and not leaving patient records readable on active monitors.<br />
                3. **Intake Patient Consent:** Clinicians must legally secure explicit written patient consent (e.g. using the California SB 903/AB 3030 generator in onboarding) before capturing session transcripts.<br />
                4. **Verification & Review:** The clinician warrants they will manually read, verify, and edit every note draft before signing off in EHR systems (no blind pasting).
              </div>
            </div>

            {/* Official Federal Resources */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                3. Official Federal HIPAA Regulations & Guidelines
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                As a covered entity, you are legally mandated to align your clinical practice with federal regulations. Please review the official Department of Health and Human Services (HHS) resources below:
              </p>
              <ul style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--primary)', listStyleType: 'disc' }}>
                <li>
                  <a href="https://www.hhs.gov/hipaa/for-professionals/security/index.html" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 500 }}>
                    HHS Official Guide: HIPAA Security Rule Standards
                  </a>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Defines administrative, physical, and technical safeguards for electronic PHI (ePHI).</span>
                </li>
                <li>
                  <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 500 }}>
                    HHS Official Guide: HIPAA Privacy Rule Standards
                  </a>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Governs the legal use, disclosure, and patient rights regarding medical records.</span>
                </li>
                <li>
                  <a href="https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 500 }}>
                    HHS Official Guide: HIPAA Breach Notification Standard
                  </a>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Establishes clinical requirements and practice alerts following an unauthorized leak.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleAcceptResponsibility}
              style={{
                width: '100%',
                padding: '1.25rem',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(100, 130, 141, 0.3)'
              }}
            >
              <ShieldCheck size={20} />
              COVENANT AND AGREE: I Accept Ultimate HIPAA and Clinical Responsibility
            </button>
          </div>
        </div>
      )}

      {isBlurred && (
        <div className={styles.blurOverlay} onClick={resetIdleTimer}>
          <div style={{ textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <Lock size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Session Locked for Security</h2>
            <p style={{ color: 'var(--text-muted)' }}>Click anywhere to resume.</p>
          </div>
        </div>
      )}

      {/* Forensic Watermark */}
      <div className={styles.forensicWatermark}>
        {watermarkText}
      </div>

      {/* Dynamic Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        aria-label="Toggle dark/light mode"
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 1000,
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          boxShadow: 'var(--shadow)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer'
        }}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <header className={styles.header}>
        <div className={styles.logoText}>
          <span className={styles.logoTextMain}>
            {whitelabelConfig ? whitelabelConfig.logoText : 'HIP AI HEALTH'}
          </span>
          <span className={styles.logoTextSub}>
            {whitelabelConfig ? 'WHITELABEL PARTNER PORTAL' : 'SECURE AI SCRIBE'}
          </span>
        </div>
        <h1 className={styles.title}>
          {whitelabelConfig ? `${whitelabelConfig.practiceName} Scribe` : 'PHI Scrubber & Note Structurer'}
        </h1>
        <p className={styles.subtitle}>
          {whitelabelConfig ? (
            whitelabelConfig.slogan
          ) : (
            <>
              Securely redact identifiable information and structure your raw session notes into a TriWest/VA compliant SOAP format.<br/>
              System instructions are based on official guidelines found <a href="https://vaccn.triwest.com/en/provider/provider-handbook/medical-documentation/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>here</a>.
            </>
          )}
        </p>
      </header>

      {isDemoMode && (
        <div className={styles.demoBanner}>
          <div className={styles.demoBannerBadge}>DEMO SANDBOX ACTIVE</div>
          <span style={{ fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.4, flex: 1 }}>
            <strong>Privacy Safeguard:</strong> Federal HIPAA laws prohibit active patient PHI processing in demo sessions. Production scribe endpoints are locked behind an executed enterprise BAA.
          </span>
        </div>
      )}

      <main className={styles.grid}>
        {/* Sleek Legal & Compliance Accordion */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div 
            onClick={() => setShowWarnings(!showWarnings)}
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              fontSize: '0.85rem',
              color: '#d97706',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={16} />
              <span><strong>Legal & Compliance Safeguards:</strong> Mandatory clinician responsibility and browser extension security notices.</span>
            </div>
            <span style={{ fontSize: '0.75rem', textDecoration: 'underline', color: 'var(--primary)', fontWeight: 600 }}>
              {showWarnings ? 'Collapse Notices ▲' : 'Expand Notices ▼'}
            </span>
          </div>

          {showWarnings && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeIn 0.3s ease-out' }}>
              <div className={styles.extensionWarning} style={{ margin: 0 }}>
                <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                <span>
                  <strong>CRITICAL SECURITY WARNING:</strong> Please disable Grammarly or any text-reading browser extensions. 
                  Do not use generic Ctrl+C to copy. Use the designated Copy buttons below to maintain HIPAA audit logs.
                </span>
              </div>
              
              <div className={styles.extensionWarning} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#d97706', margin: 0 }}>
                <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                <span>
                  <strong>MANDATORY CLINICAL RESPONSIBILITY WARNING:</strong> You must read, review, and edit every note draft before pasting it. Do not paste blindly. You assume 100% legal, civil, and professional liability for your signed records. The AI is strictly an assistive writing tool; it is never a substitute for your independent clinical judgment.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Onboarding and Whitelabel Quick Toggles */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-start', margin: '0.5rem 0' }}>
          <button 
            type="button"
            onClick={() => setShowOnboarding(!showOnboarding)} 
            style={{
              backgroundColor: showOnboarding ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: showOnboarding ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: showOnboarding ? 'var(--primary)' : 'var(--text-muted)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={14} />
            {showOnboarding ? 'Hide Onboarding Guide' : '🧭 Show Onboarding Guide'}
          </button>
          
          <button 
            type="button"
            onClick={() => setShowWhitelabel(!showWhitelabel)} 
            style={{
              backgroundColor: showWhitelabel ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: showWhitelabel ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: showWhitelabel ? 'var(--primary)' : 'var(--text-muted)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={14} />
            {showWhitelabel ? 'Hide Brand Morpher' : '🎨 Morph Partner Brand'}
          </button>
        </div>

        {/* Interactive Clinical Pilot Onboarding Tour Card */}
        <div style={{
          display: showOnboarding ? 'flex' : 'none',
          gridColumn: '1 / -1',
          background: 'rgba(31, 107, 107, 0.08)',
          border: '1px solid rgba(31, 107, 107, 0.2)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '1rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          flexDirection: 'column',
          gap: '1.25rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
              <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>Compass Onboarding Guide</h3>
              <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.15rem 0.5rem', borderRadius: '4px', marginLeft: 'auto' }}>
                Interactive Clinical Tour
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Welcome to the **HIP AI Health Secure Scribe** pilot cockpit! This interactive simulator lets group clinics evaluate zero-retention EHR documenting workflows safely. Tap on each step below to learn about the clinical boundary safeguards built into each core feature:
            </p>

            {/* Tour Tab Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', scrollbarWidth: 'thin' }}>
              {[
                { id: 'overview', label: '🧭 Overview' },
                { id: 'whitelabel', label: '🎨 B2B Morphing' },
                { id: 'indexeddb', label: '🗄️ Local DB & Stitch' },
                { id: 'diarization', label: '🎙️ Diarization Filter' },
                { id: 'cpt', label: '⏱️ CPT Billing' },
                { id: 'ehr', label: '🖥️ EHR Simulator' }
              ].map(tab => {
                const isSel = activeTourTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTourTab(tab.id)}
                    style={{
                      backgroundColor: isSel ? 'rgba(42, 139, 139, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: isSel ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '20px',
                      color: isSel ? 'var(--primary)' : 'var(--text-muted)',
                      padding: '0.4rem 1rem',
                      fontSize: '0.8rem',
                      fontWeight: isSel ? 600 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tour Tab Content Card */}
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.3)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '8px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {activeTourTab === 'overview' && (
                <>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'white', fontWeight: 600 }}>🧭 Sandbox Overview & Compliance Guardrails</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    This Secure Pilot Sandbox demonstrates a clinical document compiler designed to comply with HIPAA guidelines. The platform processes recordings and text drafts entirely in-memory (RAM) and immediately clears all browser session caches on window exit, preventing persistent medical record leaks.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      🔒 **Clinical Boundary:** RAM-Only Ephemeral Redaction (Zero remote databases)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(42, 139, 139, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(42, 139, 139, 0.15)' }}>
                      💡 **Therapist Tip:** Select any preset (Anxiety, GAD, PTSD) to quickly populate the sandbox with compliant test data.
                    </span>
                  </div>
                </>
              )}

              {activeTourTab === 'whitelabel' && (
                <>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'white', fontWeight: 600 }}>🎨 B2B Custom Whitelabel Brand morpher</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    Enter any clinic or private practice URL in the morpher input box below. Our scraper automatically inspects their public home page, extracts logo slogans, and shifts all application variables (`--primary`, `--bg-color`) dynamically to display a tailored B2B partner pilot portal.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      🔒 **Clinical Boundary:** Client-side CSS overriding leaves zero storage footprints.
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(42, 139, 139, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(42, 139, 139, 0.15)' }}>
                      💡 **Therapist Tip:** Copy the generated Whitelabel Pilot Link to share the customized theme directly with your group clinic board.
                    </span>
                  </div>
                </>
              )}

              {activeTourTab === 'indexeddb' && (
                <>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'white', fontWeight: 600 }}>🗄️ Local IndexedDB Histories & Trend Stitching</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    Create secure anonymous patient profiles (e.g. `Patient-TX-4912`). All session notes are persisted strictly within your browser&apos;s local sandbox IndexedDB. By toggling &quot;Cross-Session Trend Stitching&quot;, the note generator dynamically pulls the prior session progress note to co-create unbroken narrative trends.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      🔒 **Clinical Boundary:** Client-isolated database access guarantees zero-retention cloud residency.
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(42, 139, 139, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(42, 139, 139, 0.15)' }}>
                      💡 **Therapist Tip:** Wipe local data at any time by clicking the &quot;Trash&quot; wipe icon next to patient selection.
                    </span>
                  </div>
                </>
              )}

              {activeTourTab === 'diarization' && (
                <>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'white', fontWeight: 600 }}>🎙️ Dialogue Diarization Checklist Filter</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    Paste or dictate text to automatically split clinical dialogue into speaker segments. To focus AI token processing and minimize text noise, simply uncheck dialogue bubbles containing greeting talk, scheduling logistics, or weather.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      🔒 **Clinical Boundary:** Local filtration checks exclude segments prior to Vertex AI secure transport.
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(42, 139, 139, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(42, 139, 139, 0.15)' }}>
                      💡 **Therapist Tip:** Keep dialogue unchecked to surgically prune down transcripts into concise medical observations.
                    </span>
                  </div>
                </>
              )}

              {activeTourTab === 'cpt' && (
                <>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'white', fontWeight: 600 }}>⏱️ CPT Billing Optimizer & Signature Attestation</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    Psychotherapy documentation requires rigorous direct clinician contact auditing. Slide the session duration to automatically predict the correct CPT billing code (CPT 90837/90834/90832) paired with estimated reimbursement rates.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      🔒 **Clinical Boundary:** Predicated assistants do not guarantee claim payout; signing clinicians assume 100% legal responsibility.
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(42, 139, 139, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(42, 139, 139, 0.15)' }}>
                      💡 **Therapist Tip:** Set your digital provider signature in the billing card to automatically append legal attestation footers to notes.
                    </span>
                  </div>
                </>
              )}



              {activeTourTab === 'ehr' && (
                <>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'white', fontWeight: 600 }}>🖥️ EHR Simulator & Local PDF Generator</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    Watch as our content-script browser simulator transfers clean, structured SOAP components directly into standard SimplePractice mockup input containers with realistic human typing delays, maintaining absolute clipboard hygiene.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      🔒 **Clinical Boundary:** Browser sandboxing prevents local text files from accessing system caches or remote endpoints.
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(42, 139, 139, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(42, 139, 139, 0.15)' }}>
                      💡 **Therapist Tip:** Hit &quot;Export Note PDF&quot; to save a local clinical paper copy directly to your download folder.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

        {/* Dynamic B2B Whitelabel Customizer Card */}
        <div className={styles.whitelabelCustomizer} style={{ display: showWhitelabel ? 'flex' : 'none', animation: 'fadeIn 0.3s ease-out' }}>
            <div className={styles.whitelabelHeader}>
              <Sparkles size={18} className={styles.whitelabelIcon} />
              <h3>B2B Whitelabel Brand Previewer</h3>
              <span className={styles.whitelabelBadge}>Active Sandbox Utility</span>
            </div>
            <p className={styles.whitelabelText}>
              Pitching this scribe platform to a clinical partner or private practice? Enter their website URL below. Our AI will inspect their public site, extract their brand colors, practice name, and clinical areas, and instantly **morph the entire Scribe portal** into their custom branded pilot whitelabel!
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(42, 139, 139, 0.06)', border: '1px solid rgba(42, 139, 139, 0.15)', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--primary)', margin: '0.5rem 0 0.25rem' }}>
              <span>🤖 <strong>AI Guide:</strong> Dynamic B2B scrapers process domain homepages, extracting brand custom properties to instantly shift local workspace CSS rules.</span>
            </div>
            <div className={styles.whitelabelInputGroup}>
              <input 
                type="text" 
                placeholder="e.g. integratedtherapyrecovery.com or https://my-clinic-domain.com" 
                value={whitelabelUrl}
                onChange={(e) => setWhitelabelUrl(e.target.value)}
                className={styles.whitelabelInput}
                disabled={isScrapingBrand}
              />
              <button 
                onClick={handleScrapeWhitelabel}
                className={styles.whitelabelBtn}
                disabled={isScrapingBrand || !whitelabelUrl.trim()}
              >
                {isScrapingBrand ? (
                  <>
                    <Loader2 className={styles.spinner} size={16} />
                    Inspecting Site...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Morph Brand Preview
                  </>
                )}
              </button>
            </div>
            {whitelabelConfig && (
              <div className={styles.whitelabelSuccess} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem', width: '100%', display: 'flex' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem' }}>
                    <strong>Success!</strong> Morphed portal into <strong>{whitelabelConfig.practiceName}</strong> (Colors: {whitelabelConfig.primaryColor} / {whitelabelConfig.backgroundColor}).
                  </span>
                  <button 
                    onClick={() => {
                      setWhitelabelConfig(null);
                      // Clear query string in browser history without reload
                      if (window.history.pushState) {
                        const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                        window.history.pushState({path:newurl},'',newurl);
                      }
                      document.documentElement.style.removeProperty('--bg-color');
                      document.documentElement.style.removeProperty('--primary');
                      document.documentElement.style.removeProperty('--primary-hover');
                    }}
                    className={styles.whitelabelResetBtn}
                    style={{ marginLeft: 'auto' }}
                  >
                    Reset Branding
                  </button>
                </div>
                
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  width: '100%',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    🚀 <strong>Shareable B2B Demo Link:</strong> Send this link directly to clinical partners to let them load their whitelabel brand!
                  </span>
                  <a 
                    href={getWhitelabelShareLink()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.whitelabelResetBtn}
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid #10b981',
                      color: '#10b981',
                      textDecoration: 'none',
                      textAlign: 'center',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    Open Custom Demo in New Tab
                  </a>
                </div>
              </div>
            )}
          </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ marginBottom: '1.25rem' }}>
            <FileText className={styles.icon} size={24} />
            <h2 className={styles.panelTitle}>Raw Session Notes & Local Chart</h2>
          </div>

          {/* SECURE LOCAL INDEXEDDB PATIENT HISTORY MANAGER */}
          <div style={{ marginBottom: '1.5rem', padding: '1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                <History size={16} />
                <span>Client Session History (Local IndexedDB)</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Lock size={10} style={{ color: '#10b981' }} /> Secure Zero-Retention
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(42, 139, 139, 0.06)', border: '1px solid rgba(42, 139, 139, 0.15)', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <span>🤖 <strong>AI Guide:</strong> Zero-retention HIPAA boundaries enforce patient histories and custom practice templates persist 100% locally in browser IndexedDB.</span>
            </div>

            <div className={styles.patientSelectorBlock}>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className={styles.patientSelect}
              >
                <option value="">-- Select Anonymous Client Profile --</option>
                {patientsList.map(pat => (
                  <option key={pat.id} value={pat.id}>{pat.id} (Created {new Date(pat.createdAt).toLocaleDateString()})</option>
                ))}
              </select>
              
              <button 
                type="button" 
                onClick={() => setIsPatientModalOpen(true)}
                className={styles.patientAddBtn}
                title="Create Anonymous Client Profile"
              >
                <UserPlus size={16} />
              </button>
              
              {selectedPatientId && (
                <button
                  type="button"
                  onClick={() => handleDeletePatientProfile(selectedPatientId)}
                  className={styles.patientAddBtn}
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                  title="Wipe Local Profile"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {selectedPatient && (
              <div className={styles.patientGoalsCard} style={{ margin: '0.75rem 0 0' }}>
                <div style={{ marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  <strong>Client Baseline Symptoms:</strong> {selectedPatient.symptomBaseline}
                </div>
                <div style={{ marginBottom: '0.4rem' }}>
                  <strong>Client Goals:</strong> {selectedPatient.treatmentGoals}
                </div>
                
                {/* Cross Session Trend Stitching Trigger */}
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={enableTrendStitching} 
                      onChange={(e) => setEnableTrendStitching(e.target.checked)} 
                      disabled={notesHistory.length === 0}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    Enable Cross-Session Narrative Trend Stitching
                  </label>
                  {notesHistory.length === 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                      (Needs 1 past note compiled to enable)
                    </span>
                  )}
                </div>
                
                {notesHistory.length > 0 && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>Past Session Notes Log ({notesHistory.length}):</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '100px', overflowY: 'auto' }}>
                      {notesHistory.map((note, idx) => (
                        <div key={note.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.72rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={10} /> {new Date(note.date).toLocaleDateString()}
                          </span>
                          <span style={{ color: 'var(--primary)', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>{note.outputFormat.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isDemoMode && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles size={14} />
                <span>Select Clinician Demo Presets (Sample-Only PHI):</span>
              </div>
              <div className={styles.presetContainer}>
                 <button
                  type="button"
                  className={`${styles.presetBtn} ${activeSampleCase === 'caseA' ? styles.presetBtnActive : ''}`}
                  onClick={() => {
                    setActiveSampleCase('caseA');
                    handleRawNotesChange(SAMPLE_CASES.caseA.raw);
                    setStructuredNote('');
                    setAutofillComplete(false);
                    setAutofillText('');
                  }}
                >
                  Anxiety (GAD) Case
                </button>
                <button
                  type="button"
                  className={`${styles.presetBtn} ${activeSampleCase === 'caseB' ? styles.presetBtnActive : ''}`}
                  onClick={() => {
                    setActiveSampleCase('caseB');
                    handleRawNotesChange(SAMPLE_CASES.caseB.raw);
                    setStructuredNote('');
                    setAutofillComplete(false);
                    setAutofillText('');
                  }}
                >
                  MDD Case
                </button>
                <button
                  type="button"
                  className={`${styles.presetBtn} ${activeSampleCase === 'caseC' ? styles.presetBtnActive : ''}`}
                  onClick={() => {
                    setActiveSampleCase('caseC');
                    handleRawNotesChange(SAMPLE_CASES.caseC.raw);
                    setStructuredNote('');
                    setAutofillComplete(false);
                    setAutofillText('');
                  }}
                >
                  PTSD Trigger Case
                </button>
              </div>
              <div style={{
                backgroundColor: 'rgba(217, 119, 6, 0.05)',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.8rem',
                color: '#d97706',
                lineHeight: 1.4,
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>DEMO MODE AMBIENT TRANSCRIBER:</strong> Speak into your microphone to test our secure, real-time GCP Speech-to-Text compilation live! 
                  <strong style={{ color: '#ef4444' }}> WARNING:</strong> You must <strong>never</strong> record or transcribe any patient or individual without their explicit, prior legal consent. Use this sandbox solely to verify how your own spoken summaries are transcribed and structured.
                </span>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
              disabled={isTranscribing || isProcessing}
            >
              {isRecording ? (
                <>
                  <Square className={styles.icon} size={18} />
                  <span>Stop Listening</span>
                  {isSimulatingMic && (
                    <span className={styles.wavePulse}>
                      <span className={styles.waveBar}></span>
                      <span className={styles.waveBar}></span>
                      <span className={styles.waveBar}></span>
                    </span>
                  )}
                </>
              ) : isTranscribing ? (
                <><Loader2 className={styles.spinner} size={18} /> Transcribing...</>
              ) : (
                <><Mic className={styles.icon} size={18} /> Ambient Listen (Secure STT)</>
              )}
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              BAA Covered & Zero Data Retention. Audio is securely processed ephemerally in Google Cloud Enterprise RAM and instantly purged from server memory after transcription.
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(42, 139, 139, 0.06)', border: '1px solid rgba(42, 139, 139, 0.15)', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '1rem' }}>
            <span>🤖 <strong>AI Guide:</strong> High-precision default model combines with Speech Adaptation phrase lists (CBT, grounding, catastrophizing boosted at 15.0) to transcribe medical dictation.</span>
          </div>
          
          <textarea
            id="rawNotes"
            className={styles.textarea}
            placeholder={isTranscribing ? "Transcribing secure clinical audio stream..." : "Paste your raw notes here, OR use Ambient Listening to securely transcribe..."}
            value={rawNotes}
            onChange={(e) => handleRawNotesChange(e.target.value)}
            disabled={isProcessing || isTranscribing}
            spellCheck={false}
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Block A: Dialogue Diarization Filtration segments checkbox list */}
          {rawNotes.trim() && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={diarizationActive}
                    onChange={(e) => setDiarizationActive(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Diarization Dialogue Filter (Exclude Small Talk & Billing)</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {dialogueSegments.filter(s => s.enabled).length} of {dialogueSegments.length} segments included
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(42, 139, 139, 0.06)', border: '1px solid rgba(42, 139, 139, 0.15)', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                <span>🤖 <strong>AI Guide:</strong> Dialogue segmenting checkboxes filter raw notes in browser RAM before transmission, pruning conversational noise from AI synthesis.</span>
              </div>

              {diarizationActive && dialogueSegments.length > 0 && (
                <div className={styles.diarizationBox}>
                  {dialogueSegments.map((seg) => (
                    <div 
                      key={seg.id} 
                      className={`${styles.dialogueBubble} ${!seg.enabled ? styles.disabledBubble : ''}`}
                    >
                      <input 
                        type="checkbox"
                        checked={seg.enabled}
                        onChange={(e) => {
                          setDialogueSegments(prev => prev.map(s => s.id === seg.id ? { ...s, enabled: e.target.checked } : s));
                        }}
                        style={{ accentColor: 'var(--primary)', marginTop: '0.2rem', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          color: seg.speaker === 'Clinician' ? 'var(--primary)' : seg.speaker === 'Client' ? '#818cf8' : 'var(--text-muted)' 
                        }}>
                          {seg.speaker}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                          {seg.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isTranscribing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginTop: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 500 }}>
              <Loader2 className={styles.spinner} size={16} />
              Transcribing securely under GCP Enterprise BAA...
            </div>
          )}
          
          {error && <div style={{ color: '#d9534f', marginTop: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
          
          <div className={styles.controls} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className={styles.formatSelector} style={{ marginBottom: '1rem', justifyContent: 'space-between', display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label htmlFor="outputFormat" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Output Format:</label>
                <select 
                  id="outputFormat" 
                  value={outputFormat} 
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className={styles.selectFormat}
                  disabled={isProcessing}
                  style={{ minWidth: '220px' }}
                >
                  <option value="standard_soap">Standard Clinical SOAP Note</option>
                  <option value="triwest">TriWest/VA Intake Note</option>
                  <option value="cbt_soap">Collaborative CBT Note</option>
                  <option value="dap_note">DAP (Data, Assessment, Plan) Note</option>
                  <option value="birp_note">BIRP (Behavior, Intervention, Response, Plan) Note</option>
                  
                  {customTemplatesList.length > 0 && (
                    <optgroup label="Custom Practice Templates">
                      {customTemplatesList.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              
              <button 
                type="button" 
                onClick={() => setIsTemplateDrawerOpen(true)}
                className={styles.whitelabelResetBtn}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(42, 139, 139, 0.1)', borderColor: 'rgba(42, 139, 139, 0.3)', color: 'var(--primary)', margin: 0 }}
              >
                <Settings size={14} />
                <span>Build B2B Template</span>
              </button>
            </div>
            
            {/* Custom Scribing Instructions & Add-Ons */}
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: 'rgba(42, 139, 139, 0.05)', borderRadius: '12px', border: '1px solid rgba(42, 139, 139, 0.1)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Scribing Enhancements & Instructions</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeSummary} onChange={(e) => setIncludeSummary(e.target.checked)} disabled={isProcessing} style={{ accentColor: 'var(--primary)' }} />
                  Generate Patient-Facing &quot;After-Visit Summary&quot;
                </label>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>AI Scribe Presets:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTemplate("Use extremely concise, high-density clinical sentences. Rely on clear bullet points. Fully insurance-compliant but brief.");
                      setActivePreset("concise");
                    }}
                    className={`${styles.presetBtn} ${activePreset === 'concise' ? styles.activePreset : ''}`}
                    disabled={isProcessing}
                  >
                    Concise Clinical
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTemplate("Focus heavily on automatic thoughts, cognitive distortions, core schema activations, and collaboration in session exercises.");
                      setActivePreset("cbt");
                    }}
                    className={`${styles.presetBtn} ${activePreset === 'cbt' ? styles.activePreset : ''}`}
                    disabled={isProcessing}
                  >
                    CBT Focus
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTemplate("Emphasize client's physical indicators, muscular tension, somatic reactions, trauma responses, nervous system states, and emotional regulation.");
                      setActivePreset("somatic");
                    }}
                    className={`${styles.presetBtn} ${activePreset === 'somatic' ? styles.activePreset : ''}`}
                    disabled={isProcessing}
                  >
                    Somatic & Trauma
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTemplate("Focus note on client's internal resources, strengths, coping abilities, positive exceptions, and future-oriented action plans.");
                      setActivePreset("solution");
                    }}
                    className={`${styles.presetBtn} ${activePreset === 'solution' ? styles.activePreset : ''}`}
                    disabled={isProcessing}
                  >
                    Solution-Focused
                  </button>
                </div>

                <label htmlFor="customTemplate" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>Custom Scribing Instructions (Optional):</label>
                <textarea 
                  id="customTemplate"
                  className={styles.textarea}
                  style={{ minHeight: '100px', padding: '0.75rem', fontSize: '0.9rem' }}
                  placeholder="E.g., Focus heavily on somatic complaints, emphasize risk assessment, use short concise clinical sentences..."
                  value={customTemplate}
                  onChange={(e) => {
                    setCustomTemplate(e.target.value);
                    setActivePreset(null);
                  }}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <button 
              className={styles.button} 
              onClick={handleProcess}
              disabled={isProcessing || !rawNotes.trim()}
              style={{ alignSelf: 'center' }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className={styles.spinner} size={20} />
                  Processing...
                </>
              ) : (
                <>
                  Scrub & Structure
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ justifyContent: 'space-between', width: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldAlert className={styles.icon} size={24} />
              <h2 className={styles.panelTitle}>Compliant Clinical Documentation</h2>
            </div>
            {structuredNote && (
              <button className={styles.exportPdfBtn} onClick={handleDownloadPDF} title="Download structured note as HIPAA-compliant PDF">
                <Download size={16} />
                <span>Export Note PDF</span>
              </button>
            )}
          </div>
          
          {structuredNote && (
            <div style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '30px',
              padding: '0.25rem',
              gap: '0.25rem',
              marginBottom: '1.25rem',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              {[
                { id: 'note', label: '📝 SOAP Notes' },
                { id: 'billing', label: '⏱️ CPT Billing' },
                { id: 'ehr', label: '🖥️ EHR Sandbox' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveOutputTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 1rem',
                    borderRadius: '25px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backgroundColor: activeOutputTab === tab.id ? 'var(--primary)' : 'transparent',
                    color: activeOutputTab === tab.id ? '#05080c' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    minWidth: '100px'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          
          <div className={styles.resultContent}>
            {structuredNote ? (
              <>
                {/* Block C: CPT Billing Recommendation Assistant Card */}
                {(() => {
                  const rec = getRecommendedCPT(sessionDuration);
                  return (
                    <div className={styles.cptSidebarCard} style={{ display: activeOutputTab === 'billing' ? 'block' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Award size={18} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>CPT Billing Optimizer & Attestation</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          CPT {rec.code} Recommender
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        {/* Duration Input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Session Duration (Minutes):</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="range"
                              min="5"
                              max="120"
                              value={sessionDuration}
                              onChange={(e) => {
                                setSessionDuration(Number(e.target.value));
                                setActiveOutputTab('billing');
                              }}
                              style={{ flex: 1, accentColor: 'var(--primary)' }}
                            />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', minWidth: '3.5rem', textAlign: 'right' }}>
                              {sessionDuration} min
                            </span>
                          </div>
                        </div>

                        {/* Telehealth Switch */}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
                            <input 
                              type="checkbox"
                              checked={isTelehealth}
                              onChange={(e) => setIsTelehealth(e.target.checked)}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            <span>Telehealth Session (POS 10)</span>
                          </label>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '1.25rem', marginTop: '0.1rem' }}>
                            {isTelehealth ? 'Place of Service 10, Modifier 95' : 'Place of Service 11 (Office)'}
                          </span>
                        </div>

                        {/* Clinician Signature */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Signing Clinician:</label>
                          <input 
                            type="text"
                            value={providerSignature}
                            onChange={(e) => setProviderSignature(e.target.value)}
                            placeholder="e.g. Dr. Jenkins, PsyD"
                            style={{
                              backgroundColor: 'rgba(15, 23, 42, 0.6)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '6px',
                              padding: '0.4rem 0.6rem',
                              color: 'white',
                              fontSize: '0.8rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended CPT Code</span>
                          <strong style={{ fontSize: '1rem', color: 'var(--primary)', display: 'block', marginTop: '0.15rem' }}>{rec.code}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Reimbursement</span>
                          <strong style={{ fontSize: '1rem', color: '#10b981', display: 'block', marginTop: '0.15rem' }}>{rec.reimbursement}</strong>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', display: 'block', marginTop: '0.15rem' }}>{rec.desc}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(42, 139, 139, 0.06)', border: '1px solid rgba(42, 139, 139, 0.15)', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.75rem' }}>
                        <span>🤖 <strong>AI Guide:</strong> CPT code recommendation engines monitor clinical minutes in real-time, predicting insurance-compliant AMA standard codes dynamically.</span>
                      </div>

                      <div className={styles.billingDisclaimer}>
                        ⚠️ <strong>CMS Clinical Billing Guideline:</strong> Time intervals and documentation specificity must accurately reflect direct patient psychotherapy contact. The AI recommended code represents an assistive prediction based solely on your inputted duration and does not guarantee insurance compliance or payout. Ultimate diagnostic/billing responsibility resides exclusively with the signing therapist.
                      </div>
                    </div>
                  );
                })()}

                {/* Block A & D: Structured SOAP Notes & Surgical Refiner */}
                <div style={{ display: activeOutputTab === 'note' ? 'block' : 'none' }}>
                  {renderParsedSections()}
                  
                  <div className={styles.refineContainer} style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={16} />
                      Iterative Note Refiner (Surgical AI Adjustments)
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Need to change something? Type your instruction below (e.g., &quot;make it more professional,&quot; &quot;add safety assessment details,&quot; or &quot;focus more on cognitive triggers&quot;) and the AI will surgically revise your note.
                    </p>
                    <form onSubmit={handleRefineNote} style={{ display: 'flex', gap: '0.75rem' }}>
                      <input
                        type="text"
                        value={refinePrompt}
                        onChange={(e) => setRefinePrompt(e.target.value)}
                        placeholder="Type surgical correction here (e.g. 'Make the assessment section more detailed' or 'Remove telehealth statement')"
                        disabled={isRefining || isProcessing}
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          color: 'var(--text-main)',
                          fontSize: '0.9rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isRefining || isProcessing || !refinePrompt.trim()}
                        className={styles.button}
                        style={{ padding: '0 1.25rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        {isRefining ? (
                          <><Loader2 className={styles.spinner} size={16} /> Refining...</>
                        ) : (
                          <>Refine Note</>
                        )}
                      </button>
                    </form>
                    {refineError && (
                      <div style={{ color: '#d9534f', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        {refineError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Block E: Chrome Extension Simulated EHR Workspace */}
                <div style={{ display: activeOutputTab === 'ehr' ? 'block' : 'none' }}>
                  <section className={styles.autofillSimulator} id="chrome-extension-sandbox" style={{ marginTop: 0 }}>
                    <div className={styles.simulatorBrowserBar}>
                      <div className={`${styles.browserDot} ${styles.browserDotRed}`}></div>
                      <div className={`${styles.browserDot} ${styles.browserDotYellow}`}></div>
                      <div className={`${styles.browserDot} ${styles.browserDotGreen}`}></div>
                      <div className={styles.browserAddress}>
                        <Lock size={12} style={{ color: '#10b981' }} />
                        <span>https://simplepractice.com/ehr/client/chart/active</span>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Chrome Extension simulated EHR viewport
                      </span>
                    </div>
                    
                    <div className={styles.simulatorContent}>
                      {/* EHR Mock Chart field */}
                      <div className={styles.ehrChart}>
                        <div className={styles.ehrTitle}>
                          <ShieldCheck size={18} style={{ color: '#10b981' }} />
                          <span>SimplePractice EHR — Client Intake Chart</span>
                        </div>
                        <div className={styles.ehrField}>
                          {autofillText ? (
                            autofillText
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Intake note is empty. Click &quot;Trigger EHR Autofill&quot; on the right to simulate secure transfer...
                            </span>
                          )}
                          {isSimulatingAutofill && (
                            <span style={{ display: 'inline-block', width: '2px', height: '15px', backgroundColor: 'var(--primary)', marginLeft: '2px', animation: 'pulse 0.8s infinite' }}></span>
                          )}
                        </div>
                        
                        {autofillComplete && (
                          <div className={styles.successCheckmark}>
                            <CheckCircle2 size={16} />
                            <span>Autofill Simulation Successful — Clinician Review Approved (Notewatermarked and saved)</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(42, 139, 139, 0.06)', border: '1px solid rgba(42, 139, 139, 0.15)', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.75rem' }}>
                          <span>🤖 <strong>AI Guide:</strong> Human-like typewriter simulation isolates the de-identified SOAP fields, executing secure transfer into SimplePractice intake fields without clipboard leakage.</span>
                        </div>
                      </div>

                      {/* Chrome Extension Control Panel & Story */}
                      <div className={styles.extensionPanel}>
                        <div className={styles.extensionBadge}>
                          <Sparkles size={14} />
                          <span>Hip AI Health Extension (v1.2.4)</span>
                        </div>
                        
                        <h3 style={{ margin: '0.5rem 0 0.25rem', color: 'white', fontSize: '1rem' }}>How it Works & Data boundaries:</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                          Our extension connects securely to your local RAM cache. With one click, it automates text input typing directly into your EHR chart elements without clipboard scraping or persistent storage.
                        </p>

                        <div style={{ fontSize: '0.8rem', margin: '0.5rem 0', color: 'var(--text-main)' }}>
                          <strong>Active Boundaries & Integrity safeguards:</strong>
                          <ul style={{ paddingLeft: '1.25rem', listStyleType: 'disc', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <li><strong>Target EHRs:</strong> SimplePractice, TherapyNotes, Jane App, Cliniko, Unified Practice</li>
                            <li><strong>Minimal Permissions:</strong> Requires only standard `activeTab` permissions to locate target charting inputs</li>
                            <li><strong>No Clipboard Hijacking:</strong> Leaves standard clipboards clean and untouched</li>
                            <li><strong>Security Fail-safe:</strong> Automatically logs telemetry alerts on simplepractice layout adjustments; fails safely by defaulting to structured manual clipboard layouts with diagnostic feedback.</li>
                          </ul>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button 
                            type="button" 
                            className={styles.button}
                            onClick={startAutofillSimulation}
                            disabled={isSimulatingAutofill || !structuredNote}
                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                          >
                            {isSimulatingAutofill ? (
                              <><Loader2 className={styles.spinner} size={16} /> Autofilling EHR...</>
                            ) : autofillComplete ? (
                              <><CheckCircle2 size={16} /> Re-run Autofill Simulation</>
                            ) : (
                              <><Sparkles size={16} /> Trigger EHR Autofill</>
                            )}
                          </button>
                          
                          {!structuredNote && (
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontStyle: 'italic', textAlign: 'center' }}>
                              Please scrub and structure a session note first to enable EHR autofill.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Your scrubbed and structured document will appear here...
              </span>
            )}
          </div>
        </div>
      </main>

      <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '1rem' }}>
        <button style={{ 
          color: '#ef4444', 
          background: 'none',
          border: '1px solid #ef4444',
          fontWeight: 600, 
          fontSize: '1rem', 
          padding: '0.75rem 1.5rem',
          borderRadius: '50px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => {
          // Add sign out logic later
          window.location.href = '/';
        }}
        >
          Sign Out & Clear Session
        </button>
      </div>

      <div className={styles.trustSection}>
        <div className={styles.trustContent}>
          <h3>Enterprise-Grade Compliance</h3>
          <p>Processing is performed securely via the Google Gemini API under an executed HIPAA Business Associate Addendum (BAA).</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/baa_certificate.svg" alt="Google Workspace HIPAA BAA Executed Certificate" className={styles.trustImage} />
      </div>



      <footer className={styles.disclaimer}>
        <ShieldAlert size={16} />
        <span>No data is stored in a database. Data is processed ephemerally.</span>
      </footer>

      {/* Floating Feedback Button */}
      <button 
        className={styles.floatingFeedbackBtn} 
        onClick={() => setIsFeedbackOpen(true)}
        aria-label="Report Issue"
      >
        <MessageSquare size={24} />
      </button>

      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeModalBtn} onClick={() => setIsFeedbackOpen(false)}>
              <X size={24} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary)' }}>Report an Issue</h3>
            {feedbackSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', color: '#10b981' }}>
                <CheckCircle2 size={48} style={{ marginBottom: '1rem' }} />
                <p>Feedback sent securely. Thank you!</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Notice a bug or an AI transcription error? Let us know securely.
                </p>
                <textarea
                  className={styles.textarea}
                  style={{ minHeight: '120px', marginBottom: '1rem' }}
                  placeholder="Describe the issue..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  disabled={isSubmittingFeedback}
                />
                <button 
                  className={styles.button} 
                  style={{ width: '100%', padding: '0.75rem' }}
                  onClick={submitFeedback}
                  disabled={isSubmittingFeedback || !feedbackText.trim()}
                >
                  {isSubmittingFeedback ? <Loader2 className={styles.spinner} size={20} /> : 'Submit Feedback'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ANONYMOUS PATIENT PROFILE CREATOR MODAL */}
      {isPatientModalOpen && (
        <div className={styles.modalOverlay} style={{ zIndex: 10002 }}>
          <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <UserPlus size={20} /> Create Anonymized Client Profile
              </h3>
              <button 
                type="button" 
                onClick={() => setIsPatientModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
              <strong>HIPAA Safety Warning:</strong> Never record actual names, SSNs, or DOBs inside the local patient profile. To keep your practice completely insulated legally, use a randomized placeholder identifier (e.g. Patient-TX-420) and outline general treatment goals.
            </p>

            <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>Client Treatment Goals:</label>
                <textarea
                  value={newPatientGoals}
                  onChange={(e) => setNewPatientGoals(e.target.value)}
                  placeholder="e.g. Systematic desensitization of combat trauma, improve cognitive self-talk, homework compliance logs."
                  required
                  className={styles.textarea}
                  style={{ minHeight: '80px', padding: '0.5rem', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>Client Symptom Baseline:</label>
                <textarea
                  value={newPatientBaseline}
                  onChange={(e) => setNewPatientBaseline(e.target.value)}
                  placeholder="e.g. Flashbacks occurring 3x/week, elevated hyperarousal in crowded rooms, avoidance score 8/10."
                  required
                  className={styles.textarea}
                  style={{ minHeight: '80px', padding: '0.5rem', fontSize: '0.85rem' }}
                />
              </div>

              <button 
                type="submit" 
                className={styles.button}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
              >
                Save Secure Local Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* B2B CLINIC CUSTOM TEMPLATE BUILDER DRAWER */}
      {isTemplateDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsTemplateDrawerOpen(false)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <Settings size={20} /> Custom Template Builder
              </h3>
              <button 
                type="button" 
                onClick={() => setIsTemplateDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
              Group practices and group clinics can build bespoke clinical formatting layouts here. Saved templates are synced 100% locally in your secure browser IndexedDB.
            </p>

            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>Template Name:</label>
                <input 
                  type="text" 
                  value={newTemplateName} 
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. My Modality Intensive Intake"
                  required
                  style={{ width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.6rem', color: 'white', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>AI Prompt Custom Guidelines:</label>
                <textarea
                  value={newTemplateInstructions}
                  onChange={(e) => setNewTemplateInstructions(e.target.value)}
                  placeholder="Bespoke instructions: e.g. 'Write notes focusing heavily on emotional containment exercises, map out trauma triggers chronologically, and summarize using short therapeutic blocks...'"
                  required
                  className={styles.textarea}
                  style={{ minHeight: '120px', padding: '0.6rem', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>Bespoke Note Sections ({newTemplateSections.length}):</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input 
                    type="text"
                    value={activeBuilderSection}
                    onChange={(e) => setActiveBuilderSection(e.target.value)}
                    placeholder="Add Section (e.g. Behavior)"
                    style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.4rem', color: 'white', fontSize: '0.8rem', outline: 'none' }}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (activeBuilderSection.trim()) {
                        setNewTemplateSections(prev => [...prev, activeBuilderSection.trim()]);
                        setActiveBuilderSection('');
                      }
                    }}
                    className={styles.patientAddBtn}
                    style={{ padding: '0 0.75rem' }}
                  >
                    Add
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {newTemplateSections.map((sect, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'rgba(42, 139, 139, 0.1)', border: '1px solid rgba(42, 139, 139, 0.3)', borderRadius: '12px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: 'var(--primary)' }}>
                      <span>{sect}</span>
                      <button 
                        type="button"
                        onClick={() => setNewTemplateSections(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.72rem', padding: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.button}
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              >
                Create Custom Practice Template
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


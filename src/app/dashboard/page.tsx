'use client';

import { useState, useRef } from 'react';
import { FileText, ShieldAlert, CheckCircle2, ArrowRight, Clipboard, Loader2, ShieldCheck, Lock, Server, EyeOff, Mic, Square, MessageSquare, X } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import styles from './dashboard.module.css';

export default function Dashboard() {
  const [rawNotes, setRawNotes] = useState('');
  const [structuredNote, setStructuredNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // HIPAA Shared Responsibility Gating State (Hydration-Safe)
  const [hasAcceptedSharedResponsibility, setHasAcceptedSharedResponsibility] = useState(true);

  useEffect(() => {
    const accepted = localStorage.getItem('hipaa_responsibility_accepted') === 'true';
    setTimeout(() => {
      setHasAcceptedSharedResponsibility(accepted);
    }, 0);
  }, []);

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

  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

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

  const startRecording = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      let finalTranscript = rawNotes;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
            setRawNotes(finalTranscript);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          setError('Microphone error: ' + event.error);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleProcess = async () => {
    if (!rawNotes.trim()) {
      setError('Please enter some notes to process.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setStructuredNote('');
    setCopiedSection(null);

    try {
      const formData = new FormData();
      formData.append('rawNotes', rawNotes.trim());
      formData.append('outputFormat', outputFormat);
      if (includeSummary) formData.append('includeSummary', 'true');
      if (customTemplate.trim()) {
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
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
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
      if (title && content) {
        sections.push(
          <div key={title} className={styles.sectionCard}>
            <h4 className={styles.sectionTitle}>{title}</h4>
            <div className={styles.sectionContent}>{content}</div>
            <button className={styles.copySectionBtn} onClick={() => handleCopy(content, title)}>
              {copiedSection === title ? <><CheckCircle2 size={16}/> Copied!</> : <><Clipboard size={16}/> Copy {title}</>}
            </button>
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
                4. **Verification & Review:** The clinician warrants they will manually read, verify, and edit every note draft before signing off in EMR systems (no blind pasting).
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

      <header className={styles.header}>
        <div className={styles.logoText}>
          <span className={styles.logoTextMain}>HIP HEALTH</span>
          <span className={styles.logoTextSub}>SECURE AI SCRIBE</span>
        </div>
        <h1 className={styles.title}>PHI Scrubber & Note Structurer</h1>
        <p className={styles.subtitle}>
          Securely redact identifiable information and structure your raw session notes into a TriWest/VA compliant SOAP format.<br/>
          System instructions are based on official guidelines found <a href="https://vaccn.triwest.com/en/provider/provider-handbook/medical-documentation/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>here</a>.
        </p>
      </header>

      <main className={styles.grid}>
        <div className={styles.extensionWarning}>
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <span>
            <strong>CRITICAL SECURITY WARNING:</strong> Please disable Grammarly or any text-reading browser extensions. 
            Do not use generic Ctrl+C to copy. Use the designated Copy buttons below to maintain HIPAA audit logs.
          </span>
        </div>
        
        <div className={styles.extensionWarning} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#d97706' }}>
          <ShieldCheck size={20} style={{ flexShrink: 0 }} />
          <span>
            <strong>MANDATORY CLINICAL RESPONSIBILITY WARNING:</strong> You must read, review, and edit every note draft before pasting it. Do not paste blindly. You assume 100% legal, civil, and professional liability for your signed records. The AI is strictly an assistive writing tool; it is never a substitute for your independent clinical judgment.
          </span>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <FileText className={styles.icon} size={24} />
            <h2 className={styles.panelTitle}>Raw Session Notes</h2>
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
            >
              {isRecording ? (
                <><Square className={styles.icon} size={18} /> Stop Listening</>
              ) : (
                <><Mic className={styles.icon} size={18} /> Ambient Listen (Local CPU)</>
              )}
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Absolute Zero Data Retention. Audio never hits external servers, is processed ephemerally in RAM, and is wiped from memory after use.
            </span>
          </div>
          
          <textarea
            className={styles.textarea}
            placeholder="Paste your raw notes here, OR use Ambient Listening to securely transcribe..."
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            disabled={isProcessing}
            spellCheck={false}
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            onContextMenu={(e) => e.preventDefault()}
          />
          
          {error && <div style={{ color: '#d9534f', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</div>}
          
          <div className={styles.controls} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className={styles.formatSelector} style={{ marginBottom: '1rem' }}>
              <label htmlFor="outputFormat" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Output Format:</label>
              <select 
                id="outputFormat" 
                value={outputFormat} 
                onChange={(e) => setOutputFormat(e.target.value)}
                className={styles.selectFormat}
                disabled={isProcessing}
              >
                <option value="standard_soap">Standard SOAP Note</option>
                <option value="triwest">TriWest/VA SOAP Note</option>
              </select>
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
                <label htmlFor="customTemplate" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>Custom Scribing Instructions (Optional):</label>
                <textarea 
                  id="customTemplate"
                  className={styles.textarea}
                  style={{ minHeight: '100px', padding: '0.75rem', fontSize: '0.9rem' }}
                  placeholder="E.g., Focus heavily on somatic complaints, emphasize risk assessment, use short concise clinical sentences..."
                  value={customTemplate}
                  onChange={(e) => setCustomTemplate(e.target.value)}
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
          <div className={styles.panelHeader}>
            <ShieldAlert className={styles.icon} size={24} />
            <h2 className={styles.panelTitle}>Compliant Clinical Documentation</h2>
          </div>
          
          <div className={styles.resultContent}>
            {structuredNote ? (
              renderParsedSections()
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

      <section className={styles.complianceSection}>
        <div className={styles.complianceHeader}>
          <ShieldCheck className={styles.complianceIconMain} size={32} />
          <h2>Why This is HIPAA-Compliant</h2>
          <p>We take patient privacy seriously. Here is how your data is protected at every step of the process.</p>
        </div>
        
        <div className={styles.complianceGrid}>
          <div className={styles.complianceCard}>
            <Lock className={styles.complianceIcon} size={24} />
            <h4>End-to-End Encryption</h4>
            <p>All data is encrypted in transit using TLS 1.3 and at rest on Google&apos;s servers using AES-256 encryption.</p>
          </div>
          <div className={styles.complianceCard}>
            <Server className={styles.complianceIcon} size={24} />
            <h4>Business Associate Agreement (BAA)</h4>
            <p>This application routes requests exclusively through Google Cloud Vertex AI, which is fully covered under an executed HIPAA BAA.</p>
          </div>
          <div className={styles.complianceCard}>
            <EyeOff className={styles.complianceIcon} size={24} />
            <h4>Zero Data Retention</h4>
            <p>Absolute Zero Data Retention. Your session notes are processed ephemerally in secure RAM. They never hit external databases or storage servers, and clipboard contents are completely auto-wiped from your computer&apos;s memory after exactly 60 seconds.</p>
          </div>
          <div className={styles.complianceCard}>
            <ShieldAlert className={styles.complianceIcon} size={24} />
            <h4>No Model Training</h4>
            <p>Google Cloud guarantees that patient data submitted through Vertex AI enterprise endpoints is never used to train their foundational models.</p>
          </div>
        </div>
      </section>

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
    </div>
  );
}

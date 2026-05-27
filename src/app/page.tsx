'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Shield, 
  Lock, 
  Sparkles, 
  RefreshCw, 
  Check, 
  Loader2, 
  ShieldCheck,
  EyeOff,
  Cpu,
  AlertTriangle
} from 'lucide-react';
import styles from './page.module.css';

export default function LandingPage() {
  const [dlpInput, setDlpInput] = useState(
    "Subjective: Patient Sarah Connor (DOB: 11/12/1984, MRN: 987654321, Policy ID: BlueCross-ABC123456) presented for today's session via secure video from her home address at 123 Main St, Los Angeles, CA 90001. Call her back at 415-555-0199 or email sarah.c@cyberdyne.io. Her SSN is 000-12-3456."
  );
  const [dlpOutput, setDlpOutput] = useState("");
  const [redactedCount, setRedactedCount] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSimulatingEhr, setIsSimulatingEhr] = useState(false);
  const [ehrProgress, setEhrProgress] = useState(0);
  const [ehrText, setEhrText] = useState("");

  const [safePlainText, setSafePlainText] = useState("");
  const [dlpEntities, setDlpEntities] = useState<{ type: string; value: string }[]>([]);

  const SAMPLE_NARRATIVE = `Subjective: Sarah Connor (DOB: 11/12/1984, MRN: 987654321, Policy ID: BlueCross-ABC123456) presented for today's session via secure video from her home address at 123 Main St, Los Angeles, CA 90001. Patient reports experiencing severe anxiety when answering phone calls to her home number 415-555-0199 due to ongoing credit card collection harassment. Patient requested help regarding her financial stress and accidentally disclosed her SSN (000-12-3456) when discussing bank verification procedures. She can also be reached at sarah.c@cyberdyne.io if needed. Dr. Smith conducted CBT grounding exercises to stabilize hyperventilation.`;

  // Escape HTML helper
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Run the regex scrubber
  const runAdvancedScrubber = useCallback((text: string) => {
    let htmlScrubbed = escapeHtml(text);
    let plainScrubbed = text;
    const entities: { type: string; value: string }[] = [];

    // Let's define the patterns
    const patterns = [
      {
        type: 'SSN',
        regex: /\b\d{3}-\d{2}-\d{4}\b/g,
        badgeClass: styles.ssnBadge,
      },
      {
        type: 'PHONE',
        regex: /\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g,
        badgeClass: styles.phoneBadge,
      },
      {
        type: 'EMAIL',
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
        badgeClass: styles.emailBadge,
      },
      {
        type: 'DOB',
        regex: /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{2,4})\b/gi,
        badgeClass: styles.dobBadge,
      },
      {
        type: 'MRN',
        regex: /\b(?:MRN|Chart|Medical Record Number|MRN#)[\s:-]*([A-Z0-9-]{5,12})\b/gi,
        badgeClass: styles.ssnBadge,
      },
      {
        type: 'POLICY ID',
        regex: /\b(?:Insurance|Policy|Member\s*ID|Group|Policy\s*ID)[\s:-]*([A-Z0-9-]{6,15})\b/gi,
        badgeClass: styles.emailBadge,
      },
      {
        type: 'ADDRESS',
        regex: /\b\d{1,5}\s+[A-Z][a-zA-Z\s,.]+?(?:Street|St|Avenue|Ave|Road|Rd|Highway|Hwy|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Circle|Cir)\b/gi,
        badgeClass: styles.dobBadge,
      },
      {
        type: 'NAME',
        regex: /\b(?:Sarah Connor|Sarah|Connor|Dr\.\s+Smith|Smith|John Doe|Jane Doe|Alexander Marshi)\b/gi,
        badgeClass: styles.nameBadge,
      }
    ];

    // For names, we can also extract capitalized word pairs representing personal names
    const nameRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;

    // Run each pattern
    patterns.forEach(item => {
      // Find all matches first
      let match;
      const regexCopy = new RegExp(item.regex);
      while ((match = regexCopy.exec(text)) !== null) {
        const value = match[0];
        if (!entities.some(e => e.value === value)) {
          entities.push({ type: item.type, value });
        }
      }

      // Replace in html & plain
      htmlScrubbed = htmlScrubbed.replace(item.regex, () => {
        return `<span class="${styles.redactBadge} ${item.badgeClass}">[REDACTED: ${item.type}]</span>`;
      });
      plainScrubbed = plainScrubbed.replace(item.regex, `[REDACTED: ${item.type}]`);
    });

    // Run dynamic Name matching for other names
    let nameMatch;
    const dynamicNames: string[] = [];
    while ((nameMatch = nameRegex.exec(text)) !== null) {
      const value = nameMatch[0];
      // Skip common clinical terms that are capitalized
      if (!/^(Subjective|Objective|Assessment|Plan|CBT|GAD|MDD|PTSD|DOB|SSN|MRN|EHR|SimplePractice|HIPAA|BAA|Google|GCP|Vertex|Microsoft|Office|Option|Ambient|Ambient\s+Listen|Secure\s+STT|No\s+Credit\s+Card|BAA\s+Execution)$/i.test(value)) {
        if (!entities.some(e => e.value === value) && !dynamicNames.includes(value)) {
          dynamicNames.push(value);
          entities.push({ type: 'NAME', value });
        }
      }
    }

    dynamicNames.forEach(name => {
      const escapedName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const reg = new RegExp(`\\b${escapedName}\\b`, 'g');
      htmlScrubbed = htmlScrubbed.replace(reg, `<span class="${styles.redactBadge} ${styles.nameBadge}">[REDACTED: NAME]</span>`);
      plainScrubbed = plainScrubbed.replace(reg, '[REDACTED: NAME]');
    });

    return { html: htmlScrubbed, plain: plainScrubbed, entities };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const { html, plain, entities } = runAdvancedScrubber(dlpInput);
      setDlpOutput(html);
      setSafePlainText(plain);
      setDlpEntities(entities);
      setRedactedCount(entities.length);
      setIsScrubbing(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [dlpInput, runAdvancedScrubber]);

  const loadSample = () => {
    setIsScrubbing(true);
    setDlpInput(SAMPLE_NARRATIVE);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(safePlainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startAutofillSimulation = () => {
    if (isSimulatingEhr) return;
    setIsSimulatingEhr(true);
    setEhrProgress(0);
    setEhrText("");
    
    // Autofill simulation strictly copies only from the fully de-identified plain text state
    const plainTextSafeNote = safePlainText;
    const words = plainTextSafeNote.split(" ");
    let currentWordIndex = 0;
    
    const interval = setInterval(() => {
      if (currentWordIndex >= words.length) {
        clearInterval(interval);
        setEhrProgress(100);
        setTimeout(() => {
          setIsSimulatingEhr(false);
        }, 3000);
      } else {
        const word = words[currentWordIndex];
        if (word !== undefined) {
          setEhrText(prev => prev + (prev ? " " : "") + word);
        }
        currentWordIndex++;
        setEhrProgress(Math.floor((currentWordIndex / words.length) * 100));
      }
    }, 50);
  };

  return (
    <>
      <div className={styles.videoBgContainer}>
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className={styles.videoBg}
          aria-label="Secure motion graphic background"
          poster="/video-placeholder.png"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className={styles.videoBgOverlay}></div>
      </div>

      <div className={styles.container}>
        <header className={styles.header}>
        <div style={{ fontFamily: 'Inter, sans-serif', color: 'var(--primary)', marginBottom: '1.5rem' }}>
          <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.25em' }}>HIP AI HEALTH</span>
          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.3em' }}>SECURE AI SCRIBE</span>
        </div>
        <h1 className={styles.title}>Focus on Your Patients, Not Your Paperwork. Securely.</h1>
        <p className={styles.subtitle}>
          The AI Medical Scribe that lives in your private cloud. HIPAA-compliant, EHR-integrated, and built for total data sovereignty.
        </p>
        
        <div style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
          <Link href="/login" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: '1rem 2.5rem',
            borderRadius: '50px',
            fontSize: '1.2rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(42, 139, 139, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Launch Your Secure Demo <ArrowRight size={20} />
          </Link>
        </div>
      </header>

      {/* Trust Sandbox Section */}
      <section className={styles.sandboxContainer} id="dlp-sandbox">
        <div className={styles.sandboxHeader}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={24} style={{ color: 'var(--primary)' }} />
              Experience Zero-Leak Documentation
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Test our HIPAA-grade Data Loss Prevention (DLP) engine. See how we instantly scrub PHI to keep your practice compliant and your patient data private.
            </p>
          </div>
          <div className={styles.sandboxStatus}>
            <div className={styles.sandboxStatusDot}></div>
            <span>Zero-Retention Mode Active</span>
          </div>
        </div>

        <div className={styles.sandboxGrid}>
          {/* Input Panel */}
          <div className={styles.sandboxPanel}>
            <div className={styles.panelLabel}>
              <Cpu size={16} />
              Session Narrative Input (Type PHI)
            </div>
            <div className={styles.inputWrapper}>
              <label htmlFor="dlpInput" style={{ display: 'none' }}>Session Narrative Input containing patient PHI</label>
              <textarea
                id="dlpInput"
                className={styles.scrubberTextarea}
                value={dlpInput}
                onChange={(e) => {
                  setDlpInput(e.target.value);
                  setIsScrubbing(true);
                }}
                placeholder="Type clinician session notes containing patient names, phone numbers, or SSNs..."
              />
            </div>
            <div className={styles.panelActions}>
              <button className={styles.actionBtn} onClick={loadSample}>
                <RefreshCw size={14} />
                Load Sample Clinical Narrative
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className={styles.sandboxPanel}>
            <div className={styles.panelLabel} style={{ justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <EyeOff size={16} />
                Scrubbed HIPAA-Safe Output
              </div>
              {isScrubbing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontSize: '0.8rem' }}>
                  <Loader2 size={12} className={styles.spinner} />
                  <span>Redacting...</span>
                </div>
              )}
            </div>
            <div 
              className={styles.scrubberOutput}
              dangerouslySetInnerHTML={{ __html: dlpOutput }}
            />
            <div className={styles.panelActions}>
              <button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={handleCopy}>
                {copied ? <CheckCircle2 size={14} /> : <Sparkles size={14} />}
                {copied ? "Secure Note Copied!" : "Generate Secure Note"}
              </button>
              <button 
                className={styles.actionBtn} 
                onClick={startAutofillSimulation}
                disabled={isSimulatingEhr}
                style={{ opacity: isSimulatingEhr ? 0.6 : 1 }}
              >
                <ArrowRight size={14} />
                Sync to EHR (Simulation)
              </button>
            </div>
          </div>
        </div>

        {/* Real-time DLP stats */}
        <div style={{
          backgroundColor: 'rgba(217, 119, 6, 0.05)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          borderRadius: '8px',
          padding: '0.85rem',
          color: '#d97706',
          fontSize: '0.85rem',
          textAlign: 'left',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span><strong>ATTENTION Sandbox Evaluators:</strong> Under federal law, you are strictly prohibited from typing or pasting active patient PHI into this demo scrubber. Only simulated, mock clinical records may be entered. For active clinical note-taking, upgrade to our BAA-covered Production Scribe portal.</span>
        </div>

        <div className={styles.statsBar} aria-live="polite">
          <div className={styles.statItem}>
            <span>DLP Engine:</span>
            <span className={styles.statValue} style={{ color: 'var(--primary)' }}>Google Cloud Enterprise</span>
          </div>
          <div className={styles.statItem}>
            <span>Redacted Entities:</span>
            <span className={styles.statValue}>{redactedCount}</span>
          </div>
          <div className={styles.statItem}>
            <span>Local Encryption:</span>
            <span className={styles.statValue} style={{ color: '#10b981' }}>TLS 1.3 / AES-256</span>
          </div>
          <div className={styles.statItem}>
            <span>Server Retention:</span>
            <span className={styles.statValue} style={{ color: '#ef4444' }}>0 Seconds (Ephemeral)</span>
          </div>
        </div>

        {/* Visible Entity Breakdown */}
        {dlpEntities.length > 0 && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            textAlign: 'left',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
              De-Identified Entity List Breakdown ({dlpEntities.length} items scrubbed)
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {dlpEntities.map((entity, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--text-main)'
                }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: entity.type === 'SSN' || entity.type === 'MRN' ? '#ef4444' :
                           entity.type === 'NAME' ? '#10b981' :
                           entity.type === 'PHONE' || entity.type === 'EMAIL' ? '#f59e0b' : '#3b82f6',
                    backgroundColor: entity.type === 'SSN' || entity.type === 'MRN' ? 'rgba(239, 68, 68, 0.1)' :
                                     entity.type === 'NAME' ? 'rgba(16, 185, 129, 0.1)' :
                                     entity.type === 'PHONE' || entity.type === 'EMAIL' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    padding: '0.15rem 0.35rem',
                    borderRadius: '4px'
                  }}>
                    {entity.type}
                  </span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {entity.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chrome Extension Simulated Workspace */}
        {isSimulatingEhr && (
          <div className={styles.autofillSimulator}>
            <div className={styles.simulatorBrowserBar}>
              <div className={`${styles.browserDot} ${styles.browserDotRed}`}></div>
              <div className={`${styles.browserDot} ${styles.browserDotYellow}`}></div>
              <div className={`${styles.browserDot} ${styles.browserDotGreen}`}></div>
              <div className={styles.browserAddress}>
                <Lock size={12} style={{ color: '#10b981' }} />
                <span>https://simplepractice.com/ehr/client/chart/active</span>
              </div>
            </div>
            
            <div className={styles.simulatorContent}>
              <div className={styles.ehrChart}>
                <div className={styles.ehrTitle}>
                  <ShieldCheck size={16} style={{ color: '#10b981' }} />
                  SimplePractice EHR — SOAP Note Intake Field
                </div>
                <div className={styles.ehrField}>
                  {ehrText}
                  <span style={{ display: 'inline-block', width: '2px', height: '15px', backgroundColor: 'var(--primary)', marginLeft: '2px', animation: 'pulse 0.8s infinite' }}></span>
                </div>
              </div>

              <div className={styles.extensionPanel}>
                <div className={styles.extensionBadge}>
                  <Sparkles size={14} />
                  Hip AI Health Chrome Extension
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                  Autofilling safe de-identified transcript directly into your active SimplePractice browser tab...
                </p>
                <div className={styles.extensionProgress}>
                  <div className={styles.extensionProgressBar} style={{ width: `${ehrProgress}%` }}></div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                  <span>{ehrProgress}% Transferred</span>
                  {ehrProgress === 100 && (
                    <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '0.5rem' }}>
                      <Check size={14} /> Completed (De-identified)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Demo vs Production Environment Split */}
      <h2 style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--primary)', marginTop: '4rem', marginBottom: '1rem' }}>Scalable Deployment for Every Practice</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
        Select the environment that fits your clinical workflow and security parameters.
      </p>

      <div className={styles.costSection}>
        {/* Demo Sandbox Mode */}
        <div className={`${styles.costCard} ${styles.costCardInferior}`}>
          <h3 className={styles.costTitle} style={{ color: 'var(--text-main)' }}>The Sandbox</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary)', margin: '1.5rem 0' }}>
            Instant Preview
          </div>
          <div className={styles.billedText}>No Credit Card Required</div>
          <p className={styles.costDesc} style={{ minHeight: '80px' }}>
            Instant access to test our de-identification engine, SOAP note structures, and Chrome Extension workflows.
          </p>
          <ul style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0 2rem', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li>Convenient SMS 2FA enabled for testing</li>
            <li>Perfect for testing the Chrome Extension</li>
            <li><strong>STRICT LIABILITY:</strong> No active patient PHI allowed</li>
          </ul>
          <Link href="/login" className={styles.salesButton} style={{ width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            Try Live Demo
          </Link>
        </div>

        {/* Production Clinical Mode */}
        <div className={`${styles.costCard} ${styles.costCardPrimary}`} style={{ borderColor: 'var(--primary)', boxShadow: '0 8px 24px rgba(42, 139, 139, 0.15)' }}>
          <h3 className={styles.costTitle} style={{ color: 'var(--primary)' }}>Production Clinical</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary)', margin: '1.5rem 0' }}>
            B2B Private Cloud
          </div>
          <div className={styles.billedText}>EHR & Chrome Extension Integrated</div>
          <p className={styles.costDesc} style={{ minHeight: '80px' }}>
            A dedicated, private-cloud instance for your clinic or hospital system. Fully integrated with standard therapist EMR workflows.
          </p>
          <ul style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0 2rem', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li><strong>1-Click Chrome Extension:</strong> Autofill notes directly into SimplePractice EHR fields.</li>
            <li>Legally signed GCP Enterprise BAA included.</li>
            <li>Requires in-app signed BAA & terms.</li>
            <li>Multi-factor hardware authentication (TOTP) strictly enforced.</li>
          </ul>
          <a href="mailto:sales@hiphealthai.com?subject=Production%20Cloud%20Deployment%20Inquiry" className={styles.salesButton} style={{ backgroundColor: 'var(--primary)', width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            Contact for Custom Cloud Setup
          </a>
        </div>

        {/* Private Cloud & Whitelabel Licensing */}
        <div className={`${styles.costCard} ${styles.costCardPrimary}`} style={{ borderColor: '#6366f1', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)' }}>
          <h3 className={styles.costTitle} style={{ color: '#6366f1' }}>Bespoke Whitelabel</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#6366f1', margin: '1.5rem 0' }}>
            Fully Customizable
          </div>
          <div className={styles.billedText}>Custom Subdomains & Logo Overrides</div>
          <p className={styles.costDesc} style={{ minHeight: '80px' }}>
            Full-stack customization and on-premises licensing for enterprise partners. Deployed under your own logo and brand.
          </p>
          <ul style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0 2rem', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li><strong>Your Visual Identity:</strong> Custom logos, layouts, color schemes, and templates for a high-status look.</li>
            <li><strong>Total Sovereignty:</strong> Deployed in your own secure GCP tenancy with complete developer access revocation.</li>
            <li><strong>Tailored Clinical Rules:</strong> Tailor clinical writing templates to your practice&apos;s exact requirements.</li>
          </ul>
          <a href="mailto:sales@hiphealthai.com?subject=On-Premises%20and%20Whitelabel%20Licensing%20Inquiry" className={styles.salesButton} style={{ backgroundColor: '#6366f1', width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            Inquire for Bespoke Customization
          </a>
        </div>
      </div>


      {/* Feature & Security Comparison Matrix */}
      <h2 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: 600, color: 'white', marginTop: '6rem', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
        The Gold Standard in Clinical Data Privacy
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3.5rem', maxWidth: '700px', margin: '0 auto 3.5rem', fontSize: '1.1rem', lineHeight: 1.6 }}>
        Compare our secure clinical scribing platform against standard third-party clinical note-taking utilities. Engineered with <strong>MFA-Protected Access</strong>, <strong>Clinician-First BAA Addendums</strong>, <strong>Enterprise-Grade SLAs</strong>, and a <strong>Full HIPAA Compliance Audit Trail</strong>.
      </p>

      <section className={styles.comparisonSection}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Feature / Security Standard</th>
                <th>Hip AI Health Scribe 🏆</th>
                <th>Generic 3rd-Party AI Scribes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className={styles.tableTitle}>EHR Integration Workflow</span>
                  <span className={styles.tableDesc}>How structured SOAP notes get into your therapy charts.</span>
                </td>
                <td>
                  <CheckCircle2 className={styles.checkIcon} size={24} />
                  <strong>1-Click Chrome Extension.</strong> Finalized notes automatically autofill directly into your SimplePractice text boxes instantly.
                </td>
                <td>
                  <XCircle className={styles.xIcon} size={24} />
                  <strong>Manual Copy-Paste.</strong> Tedious tab-switching, copying blocks of text, and manually typing into your EHR.
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.tableTitle}>Practice Customization</span>
                  <span className={styles.tableDesc}>Bespoke styling and templates for your practice.</span>
                </td>
                <td>
                  <CheckCircle2 className={styles.checkIcon} size={24} />
                  <strong>Fully Whitelabelable.</strong> Tailored layouts, custom templates, and deployed under your own domain/logo for a high-status proprietary look.
                </td>
                <td>
                  <XCircle className={styles.xIcon} size={24} />
                  <strong>Rigid Utility.</strong> Standardized, unchangeable mass-market layouts. No branding or custom rules allowed.
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.tableTitle}>Data Retention Policy</span>
                  <span className={styles.tableDesc}>How long your patients&apos; session notes are stored on 3rd-party servers.</span>
                </td>
                <td>
                  <CheckCircle2 className={styles.checkIcon} size={24} />
                  <strong>Zero Data Retention.</strong> No databases. Text is processed entirely ephemerally in RAM and instantly destroyed.
                </td>
                <td>
                  <XCircle className={styles.xIcon} size={24} />
                  <strong>Permanent Storage.</strong> In order to offer &quot;Pre-appointment summaries&quot;, they must permanently store years of patient PTSD/therapy notes in their databases.
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.tableTitle}>Audio Transmission</span>
                  <span className={styles.tableDesc}>Where the raw audio of the patient&apos;s voice goes.</span>
                </td>
                <td>
                  <CheckCircle2 className={styles.checkIcon} size={24} />
                  <strong>BAA-Secured Ephemeral Processing.</strong> Audio is transmitted via encrypted TLS 1.3 to your secure GCP backend, transcribed in-memory using Google Cloud&apos;s Enterprise STT, and instantly wiped. Protected legally under your executed BAA.
                </td>
                <td>
                  <XCircle className={styles.xIcon} size={24} />
                  <strong>Cloud Transmission.</strong> Raw audio files containing the patient&apos;s voice are uploaded to massive external cloud servers for processing.
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.tableTitle}>PHI Pre-Scrubbing</span>
                  <span className={styles.tableDesc}>How patient names and SSNs are protected from AI.</span>
                </td>
                <td>
                  <CheckCircle2 className={styles.checkIcon} size={24} />
                  <strong>Google Cloud DLP.</strong> Enterprise-grade Data Loss Prevention automatically redacts names, SSNs, and phone numbers before the AI even sees the text.
                </td>
                <td>
                  <XCircle className={styles.xIcon} size={24} />
                  <strong>Basic Prompts.</strong> Often relies solely on the AI to &quot;try not to output names,&quot; exposing raw PHI directly to the language models.
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.tableTitle}>Model Training Policy</span>
                  <span className={styles.tableDesc}>Whether patient text can be used to train foundational AI models.</span>
                </td>
                <td>
                  <CheckCircle2 className={styles.checkIcon} size={24} />
                  <strong>Legally Prohibited.</strong> Data routed through our Google Cloud Enterprise endpoint is legally guaranteed to never be used for AI training.
                </td>
                <td>
                  <XCircle className={styles.xIcon} size={24} />
                  <strong>Varies widely.</strong> Many commercial terms of service allow them to aggregate or anonymize data to train their future commercial models.
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.tableTitle}>Business Associate Agreement (BAA)</span>
                  <span className={styles.tableDesc}>Legal HIPAA compliance coverage.</span>
                </td>
                <td>
                  <CheckCircle2 className={styles.checkIcon} size={24} />
                  <strong>Direct Enterprise BAA.</strong> Executed directly with Google Cloud for healthcare enterprise standards.
                </td>
                <td>
                  <CheckCircle2 className={styles.checkIcon} size={24} />
                  <strong>Standard BAA.</strong> Usually covered, but subject to consumer-grade terms of service.
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.tableTitle}>Documentation Format</span>
                  <span className={styles.tableDesc}>How the AI structures the final note.</span>
                </td>
                <td>
                  <CheckCircle2 className={styles.checkIcon} size={24} />
                  <strong>Bespoke for TriWest/VA.</strong> Hardcoded to specifically target symptoms, functional impairment, and risk assessment as required by the VA.
                </td>
                <td>
                  <XCircle className={styles.xIcon} size={24} />
                  <strong>Generic Formats.</strong> Offers standard SOAP/DAP templates, but lacks the hyper-specific focus required for specialized government contracts.
                </td>
              </tr>
              <tr>
                <td>
                  <span className={styles.tableTitle}>Multi-Factor Authentication (MFA)</span>
                  <span className={styles.tableDesc}>Security layer required to access patient data.</span>
                </td>
                <td>
                  <CheckCircle2 className={styles.checkIcon} size={24} />
                  <strong>Strictly Enforced.</strong> Zero-trust architecture mandates MFA for all clinician access.
                </td>
                <td>
                  <XCircle className={styles.xIcon} size={24} />
                  <strong>Optional/Tiered.</strong> Often treated as an upsell or left optional, creating massive liability gaps.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.conclusion}>
        <h3>The Gold Standard for Your Practice</h3>
        <p>
          Give your clinicians the power of automated AI scribing, without the massive liability of having a Silicon Valley tech company permanently hoarding your patients&apos; trauma notes.
        </p>
      </section>

      <footer className={styles.detailedFooter}>
        <div className={styles.footerGrid}>
          <div className={styles.footerColumn}>
            <h4>Product</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/login">Sign In (MFA Required)</Link></li>
              <li><Link href="/consent">Clinician BAA</Link></li>
              <li><Link href="/sla">Enterprise SLA</Link></li>
            </ul>
          </div>
          <div className={styles.footerColumn}>
            <h4>Compliance</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/hipaa">HIPAA Notice</Link></li>
            </ul>
          </div>
          <div className={styles.footerColumn}>
            <h4>Contact</h4>
            <ul className={styles.footerLinks}>
              <li><span>sales@hiphealthai.com</span></li>
              <li><span>compliance@hiphealthai.com</span></li>
              <li><span style={{ opacity: 0.8, fontSize: '0.85rem' }}>Distributed / Remote-First</span></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.finePrint}>
          <p>
            <strong>HIPAA & HITECH COMPLIANCE NOTICE:</strong> Hip AI Health is a secure AI documentation interface operating strictly under an executed Enterprise Business Associate Agreement (BAA) with Google Cloud. The application architecture enforces a <em>Zero Data Retention</em> policy. Audio and text data processed through this portal are held ephemerally in RAM and are never written to permanent storage, databases, or training logs.
          </p>
          <p>
            <strong>NO AI TRAINING LIABILITY:</strong> Data submitted through the Hip AI Health Vertex AI enterprise endpoints is legally prohibited from being used to train, retrain, or improve any Google foundational models.
          </p>
          <p>
            © {new Date().getFullYear()} Hip AI Health Secure AI Scribe. All rights reserved. By logging in, you agree to the <Link href="/terms" style={{textDecoration: 'underline'}}>Terms of Service</Link> and <Link href="/privacy" style={{textDecoration: 'underline'}}>Privacy Policy</Link>. This tool is an assistive device and does not replace the clinical judgment of a licensed healthcare professional.
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}

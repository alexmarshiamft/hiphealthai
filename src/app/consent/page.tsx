'use client';

import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { ShieldCheck, Download, Loader2, ShieldAlert, Key, RefreshCw, EyeOff, FileText, Clipboard, Printer, Lock } from 'lucide-react';
import styles from './consent.module.css';

export default function ConsentPage() {
  const [clinicianName, setClinicianName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorLicense, setSupervisorLicense] = useState('');
  const [practiceName, setPracticeName] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ url: string; timestamp: string } | null>(null);
  
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clinicianName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    
    if (sigCanvas.current?.isEmpty()) {
      setError('Please provide your signature.');
      return;
    }

    if (!hasConsented) {
      setError('You must check the box to consent to electronic signatures and terms.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const signatureBase64 = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

      const response = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName: clinicianName, signatureBase64 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit signature');
      }

      setSuccessData({
        url: data.downloadUrl,
        timestamp: data.auditTrail.timestamp,
      });

      // Redirect to the protected dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);

    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Signature & Terms Captured Successfully</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Your legally binding electronic signature and compliance verification have been recorded with a secure audit trail.
            <br />
            Timestamp: {new Date(successData.timestamp).toLocaleString()}
          </p>
          <a href={successData.url} download className={styles.downloadButton}>
            <Download size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Download Signed Agreement PDF
          </a>
          <p style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 500 }}>
            Redirecting to secure dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Generate dynamic Patient AI Consent Form text
  const getPatientConsentText = () => {
    const cName = clinicianName.trim() || '[Clinician Name, AMFT]';
    const sName = supervisorName.trim() || '[Supervisor Name, LMFT/LCSW]';
    const sLicense = supervisorLicense.trim() || '[Supervisor License #]';
    const pName = practiceName.trim() || '[Practice Name / ITR]';

    return `CONSENT FOR THE USE OF ASSISTIVE ARTIFICIAL INTELLIGENCE (AI) TECHNOLOGY

At ${pName}, we are dedicated to maintaining the highest clinical standards of care. To ensure documentation accuracy and maximize direct therapy time, your therapist, ${cName}, operates under the clinical supervision of ${sName} (License #${sLicense}) and utilizes secure clinical AI assistive scribing tools.

DATA PRIVACY & ZERO DATA RETENTION SAFEGUARDS:
This technology operates under a strict, legally binding HIPAA Business Associate Agreement (BAA) directly with Google Cloud Enterprise. To protect your privacy to the absolute maximum extent:
1. NO PERMANENT STORAGE: Patient session recordings and text drafts are never saved, cached, or written to any permanent storage or database.
2. EPHEMERAL PROCESSING: Session data is processed entirely in temporary server RAM and is permanently flushed and destroyed immediately upon note generation.
3. SECURE AUDIO INTUBATION: Audio is streamed securely using browser-native in-memory buffers (MediaRecorder) over encrypted TLS 1.3 connections directly to our secure GCP STT Enterprise endpoints. Raw audio is processed in-memory and immediately destroyed, never saved to server disk or cloud storage.
4. AUTO-WIPE MEMORY: For maximum local device security, copied note text is completely auto-purged from the computer's clipboard after 60 seconds.
5. NO MODEL TRAINING: Patient information is strictly prohibited from being used to train foundational AI models.

CLINICAL RESPONSIBILITY DISCLOSURE:
All AI-generated notes are strictly treated as draft administrative aids. ${cName} reviews, edits, and verifies every note for clinical accuracy, assuming full professional, civil, and ethical liability for all medical records. AI is not a substitute for clinical judgment.

By signing below, I consent to the use of secure clinical AI scribing tools as outlined above.`;
  };

  const handleCopyConsent = () => {
    navigator.clipboard.writeText(getPatientConsentText());
    alert('Patient Consent Form copied to clipboard! You can now paste this directly into your SimplePractice intake templates.');
  };

  return (
    <div className={styles.container} style={{ maxWidth: '1000px' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'Inter, sans-serif', color: 'var(--primary)', marginBottom: '1rem' }}>
          <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '0.15em' }}>HIP AI HEALTH</span>
          <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.25em' }}>SECURE ONBOARDING portal</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Onboarding Compliance & Liability Sign-off</h1>
      </header>

      {/* Security Alert Banner */}
      <div className={styles.document} style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'rgba(42, 139, 139, 0.05)', border: '1px solid rgba(42, 139, 139, 0.2)', borderRadius: '12px' }}>
        <h3 style={{ margin: '0 0 1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={24} /> Active Practice Security Systems
        </h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
          Your portal is protected by multiple active enterprise clinical safeguards:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <Key size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <span><strong>Strict MFA Session Gate:</strong> Enforces mandatory 12-hour session expirations and 30-day device re-authentications.</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <RefreshCw size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <span><strong>Forensic Watermarking:</strong> Overlays your email address and timestamps in a repeating diagonal pattern to strictly prevent and audit unauthorized screen captures.</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <EyeOff size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <span><strong>Idle Screen-Lock Overlay:</strong> Automatically blurs the screen after 3 minutes of inactivity and logs out after 5 minutes of idle state.</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <span><strong>60-Second Clipboard Auto-Wipe:</strong> Text copied to your clipboard is automatically completely cleared from local device memory after 60 seconds to prevent lingering PHI.</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Onboarding Form & BAA */}
        <div className={styles.document} style={{ padding: '2rem' }}>
          <div className={styles.documentContent}>
            <h2 style={{ marginTop: 0, color: 'var(--primary)' }}>1. Secure Clinician Terms & BAA Agreement</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              By signing below and accessing Hip AI Health AI, you enter into a legally binding BAA and waiver of liability with the developer. This tool routes requests exclusively through Google Cloud Vertex AI under a secure BAA.
            </p>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px', color: '#4f46e5', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              <strong>Production Mode Upgrade:</strong> Signing this BAA unlocks Production Mode. Upon signature, your email verification status is verified, SMS 2FA is permanently deactivated, and Hardware Authenticator TOTP is strictly enforced and required to process any active patient PHI.
            </div>

            <div style={{
              backgroundColor: 'rgba(217, 119, 6, 0.06)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              borderRadius: '8px',
              padding: '1rem',
              color: '#b45309',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              marginBottom: '1.5rem'
            }}>
              <strong>⚠️ CRITICAL PHI GATE & DEMO ACKNOWLEDGEMENT:</strong>
              <br />
              Under federal HIPAA guidelines, processing active, real patient Protected Health Information (PHI) is strictly legally prohibited while running under SMS 2FA or in Demo mode. Clinicians are explicitly restricted to using simulated case records. Real-world patient transcription is strictly gated and unlocked ONLY after this electronic Clinician BAA is cryptographically signed and Hardware TOTP is fully enabled. No real clinical records may be entered before executing this agreement.
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldAlert size={18} /> CRITICAL ASSUMPTION OF LIABILITY WAIVER (PRACTICE CARRIES 100% LIABILITY):
              </strong>
              1. **NO BLIND PASTING:** You are legally and ethically prohibited from pasting AI notes blindly into SimplePractice or any EHR. You must read, review, and manually edit every word to ensure clinical accuracy.<br />
              2. **100% CLINICAL & PRACTICE LIABILITY:** Absolutely 100% of all legal, regulatory, civil, ethical, and clinical liability is assumed solely by the practice and the individual clinician. The software, developer, platform owners, and affiliates bear **absolute zero liability** under any circumstances.<br />
              3. **DEVELOPER INDEMNIFICATION:** You agree to indemnify, defend, and hold harmless the platform owner/developer from any and all malpractice claims, BBS licensing complaints, HIPAA audits, or civil lawsuits arising from your use of this software.
            </div>

            {/* User details inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className={styles.inputGroup}>
                <label htmlFor="clinicianName" className={styles.label}>Your Full Name (AMFT/APCC)</label>
                <input
                  type="text"
                  id="clinicianName"
                  className={styles.input}
                  value={clinicianName}
                  onChange={(e) => setClinicianName(e.target.value)}
                  placeholder=""
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="practiceName" className={styles.label}>Clinic/Practice Name</label>
                <input
                  type="text"
                  id="practiceName"
                  className={styles.input}
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  placeholder=""
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="supervisorName" className={styles.label}>Clinical Supervisor Name</label>
                <input
                  type="text"
                  id="supervisorName"
                  className={styles.input}
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder=""
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="supervisorLicense" className={styles.label}>Supervisor License Number</label>
                <input
                  type="text"
                  id="supervisorLicense"
                  className={styles.input}
                  value={supervisorLicense}
                  onChange={(e) => setSupervisorLicense(e.target.value)}
                  placeholder=""
                  required
                />
              </div>
            </div>

            <div className={styles.checkboxGroup}>
              <input 
                type="checkbox" 
                id="ai-consent" 
                className={styles.checkbox}
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
              />
              <label htmlFor="ai-consent" className={styles.checkboxLabel} style={{ fontSize: '0.85rem' }}>
                <strong>I accept full legal, civil, and professional liability</strong> for the notes processed. I agree that all liability is held strictly by the practice and clinician, and hold the developer completely harmless from any licensing or legal claims.
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.signatureSection} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Electronic Signature</label>
              <div className={styles.canvasContainer} style={{ border: '1px solid rgba(42, 139, 139, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{
                    width: 500,
                    height: 120,
                    className: 'sigCanvas',
                    style: { width: '100%', height: '120px', backgroundColor: '#fcfcfc' }
                  }}
                />
              </div>
              <button type="button" onClick={clearSignature} className={styles.clearButton} style={{ marginTop: '0.5rem' }}>
                Clear Canvas
              </button>
            </div>

            {error && <div style={{ color: '#d9534f', margin: '1rem 0', fontSize: '0.9rem' }}>{error}</div>}

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting || !hasConsented || !clinicianName || !supervisorName || !supervisorLicense}
              style={{ width: '100%', padding: '0.85rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
            >
              {isSubmitting ? (
                <><Loader2 className={styles.spinner} size={20} /> Processing...</>
              ) : (
                <><ShieldCheck size={20} /> Sign & Onboard to Platform</>
              )}
            </button>
          </form>
        </div>

        {/* Dynamic Patient AI Consent Form Generator */}
        {clinicianName.trim() !== '' && practiceName.trim() !== '' && supervisorName.trim() !== '' && supervisorLicense.trim() !== '' ? (
          <div className={styles.document} style={{ padding: '2rem', border: '1px dashed var(--primary)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={24} /> 2. Patient AI Consent Form Generator
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              California SB 903/AB 3030 mandates that you obtain explicit patient consent before using AI tools in clinical settings. 
              We have dynamically generated your compliant intake template. You can now copy and upload it directly to SimplePractice.
            </p>

            <pre style={{ 
              backgroundColor: 'rgba(255,255,255,0.6)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '1.5rem', 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: 'var(--text-main)',
              maxHeight: '350px',
              overflowY: 'auto'
            }}>
              {getPatientConsentText()}
            </pre>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                onClick={handleCopyConsent}
                className={styles.submitButton}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary)', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
              >
                <Clipboard size={18} /> Copy Consent Template
              </button>
              <button 
                type="button" 
                onClick={() => window.print()}
                className={styles.submitButton}
                style={{ flex: 1, padding: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
              >
                <Printer size={18} /> Print Form
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.document} style={{ padding: '2.5rem', border: '1.5px dashed var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: '400px' }}>
            <Lock size={48} color="var(--text-muted)" style={{ marginBottom: '1.5rem', opacity: 0.6 }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontWeight: 600 }}>Consent Form Generator Locked</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.5, margin: 0 }}>
              To generate your CA SB 903/AB 3030 compliant Patient AI Consent Form, please complete Section 1 (Clinician Name, Clinic/Practice Name, Supervisor Name, and Supervisor License Number) first. 
              <br /><br />
              All data must be legally filled to compile your custom patient-facing intake contract.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}


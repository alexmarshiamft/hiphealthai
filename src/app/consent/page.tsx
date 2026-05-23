'use client';

import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { ShieldCheck, Download, Loader2 } from 'lucide-react';
import styles from './consent.module.css';

export default function ConsentPage() {
  const [patientName, setPatientName] = useState('');
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
    
    if (!patientName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    
    if (sigCanvas.current?.isEmpty()) {
      setError('Please provide your signature.');
      return;
    }

    if (!hasConsented) {
      setError('You must check the box to consent to electronic signatures.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const signatureBase64 = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

      const response = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName, signatureBase64 }),
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
          <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Signature Captured Successfully</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Your legally binding electronic signature has been recorded with a secure audit trail.
            <br />
            Timestamp: {new Date(successData.timestamp).toLocaleString()}
          </p>
          <a href={successData.url} download className={styles.downloadButton}>
            <Download size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Download Signed PDF Copy
          </a>
          <p style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 500 }}>
            Redirecting to secure dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.document}>
        <div className={styles.documentContent}>
          <h1>Clinician Terms of Service & Business Associate Agreement</h1>
          
          <p>
            By accessing this AI Scribing tool, you are entering into a binding agreement with the platform developer.
            This tool uses Google Cloud Vertex AI to process sensitive Protected Health Information (PHI).
          </p>
          
          <p>
            While the underlying infrastructure maintains &quot;Zero Data Retention&quot; and is covered under an Enterprise BAA, 
            <strong>you, the licensed clinician, retain ultimate legal responsibility</strong> for ensuring your use of this tool complies with your organization&apos;s HIPAA policies.
          </p>

          <h2>Your Responsibilities</h2>
          <ul>
            <li>
              <strong>Verification:</strong> You must review all AI-generated notes for clinical accuracy before submitting them to your official EHR.
            </li>
            <li>
              <strong>Indemnification:</strong> You agree to hold the developer of this application harmless from any claims, damages, or liabilities arising from the use of this tool.
            </li>
            <li>
              <strong>Data Security:</strong> You agree to protect your login credentials and to clear any cached data from your local device after use.
            </li>
          </ul>

          <div className={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="ai-consent" 
              className={styles.checkbox}
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
            />
            <label htmlFor="ai-consent" className={styles.checkboxLabel}>
              <strong>I accept full clinical and legal liability</strong> for the notes generated by this tool. I agree to the Terms of Service, acknowledge the Business Associate Agreement provisions, and hold the platform developer harmless.
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.signatureSection}>
          <div className={styles.inputGroup}>
            <label htmlFor="patientName" className={styles.label}>Clinician Name</label>
            <input
              type="text"
              id="patientName"
              className={styles.input}
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter your full legal name"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Signature</label>
            <div className={styles.canvasContainer}>
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 150,
                  className: 'sigCanvas',
                  style: { width: '100%', height: '150px' }
                }}
              />
            </div>
            <button type="button" onClick={clearSignature} className={styles.clearButton}>
              Clear Signature
            </button>
          </div>

          {error && <div style={{ color: '#d9534f', margin: '1rem 0' }}>{error}</div>}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting || !hasConsented || !patientName}
          >
            {isSubmitting ? (
              <><Loader2 className={styles.spinner} size={20} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
            ) : (
              <><ShieldCheck size={20} /> Sign & Submit Document</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

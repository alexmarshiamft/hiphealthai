import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Hipaacontrols() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={20} /> Back
          </Link>
          <div style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.2em' }}>
            HIP AI HEALTH
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>HIPAA Compliance & Technical Safeguards</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Platform Compliance Standard: 45 CFR § 164.312</p>
        </div>

        <div style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-main)' }}>
          
          <div style={{ padding: '1.5rem', backgroundColor: 'rgba(42, 139, 139, 0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '3rem' }}>
            <strong>HIPAA STATEMENT OF EPHEMERALITY</strong><br/>
            Hip AI Health is officially architected under a zero-retention, zero-database paradigm. We do not store, write, cache, or maintain any Protected Health Information (PHI) in persistent storage. All data is held strictly in temporary server memory (RAM) and immediately destroyed upon session completion.
          </div>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>1. Technical Safeguards (45 CFR § 164.312)</h2>
            <p style={{ marginBottom: '1rem' }}>
              The HIPAA Security Rule mandates specific technical safeguards to control access, protect data integrity, and guarantee complete transmission security. Hip AI Health implements these controls natively in our codebase:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Access Control (§ 164.312(a)):</strong> Enforces secure Multi-Factor Authentication (MFA) via SMS and hardware TOTP codes before any dashboard routing is authorized.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Inactivity Controls:</strong> Automatic CSS blur overlays trigger after 3 minutes of idle mouse/keyboard states, and complete session cookie destruction logs the clinician out after 5 minutes of inactivity.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Transmission Security (§ 164.312(e)):</strong> Encrypts all data in transit using TLS 1.3 cryptographic protocols, preventing interception.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>2. Regional Cloud Security & Domestic Routing</h2>
            <p style={{ marginBottom: '1rem' }}>
              To satisfy geographical data compliance, our serverless architecture is statically locked to domestic regions:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>GCP us-central1 Locking:</strong> All transcription, DLP redacting, and generative compiling APIs execute strictly within secure Google Cloud zones in the United States (us-central1, Iowa).</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Google Cloud BAA:</strong> All underlying GCP compute services operate under an executed Business Associate Agreement (BAA) with Google Cloud, ensuring HIPAA-compliant infrastructure hosting.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>3. Data Loss Prevention (DLP) Redaction</h2>
            <p style={{ marginBottom: '1rem' }}>
              Prior to generative processing, clinical session drafts pass through a multi-category Google Cloud DLP inspection pipeline. 
              This pipeline dynamically scans and replaces identifiers with de-identified placeholders (e.g. `[REDACTED BY DLP]`) for all major HIPAA identifiers:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Patient Names and Dates of Birth</li>
              <li style={{ marginBottom: '0.5rem' }}>Social Security Numbers (SSN) and Medical Record Numbers (MRN)</li>
              <li style={{ marginBottom: '0.5rem' }}>Street Addresses, Telephone Numbers, and Email Addresses</li>
              <li style={{ marginBottom: '0.5rem' }}>Health Insurance Policy IDs</li>
            </ul>
            <p>
              By sanitizing these tokens before they hit generative compilers, we ensure patient identities are never processed, cached, or memorized by language models.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>4. Workstation Protection & Clipboard Safety</h2>
            <p style={{ marginBottom: '1rem' }}>
              To protect clinical records at the clinician&apos;s workstation, the platform enforces local browser-level shields:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Clipboard Auto-Wipe:</strong> Copies of generated notes to the local workstation clipboard are automatically cleared by the browser after exactly 60 seconds.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Keylogger and Extension Blocking:</strong> Interactive text areas utilize `spellCheck={false}` and standard Grammatic extensions overrides, blocking third-party browser plugins from reading or logging clinical entries.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

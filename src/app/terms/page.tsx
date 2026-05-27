import Link from 'next/link';
import { ArrowLeft, FileText, AlertTriangle, CheckSquare } from 'lucide-react';

export default function TermsOfService() {
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
          <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Terms of Service & User Agreement</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Last Updated: May 2026</p>
        </div>

        <div style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-main)' }}>
          
          <div style={{ padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '0.5rem', fontWeight: 600 }}>
              <AlertTriangle size={20} />
              CLINICAL RESPONSIBILITY DISCLAIMER
            </div>
            <p style={{ fontSize: '0.95rem' }}>
              Hip AI Health is an AI-assisted documentation tool, not a medical device or a substitute for professional clinical judgment. By using this service, you acknowledge that you are a licensed healthcare professional and retain ultimate legal and ethical responsibility for all documentation generated and submitted to your Electronic Health Record (EHR) system.
            </p>
          </div>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>1. Acceptance of Terms</h2>
            <p style={{ marginBottom: '1rem' }}>
              By accessing or using the Hip AI Health secure AI scribe (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you are agreeing to these Terms for that organization and representing that you have the authority to bind that organization to these terms.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>2. HIPAA & Business Associate Agreement (BAA)</h2>
            <p style={{ marginBottom: '1rem' }}>
              The Service is designed to process Protected Health Information (PHI) in compliance with HIPAA. However, your use of the Service requires the execution of a valid Business Associate Agreement (BAA) between your organization and Hip AI Health prior to the transmission of any PHI.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              You agree to use the Service exclusively through the secure, multi-factor authenticated portal and agree not to bypass any implemented security controls, including but not limited to our 5-minute inactivity auto-logout policies.
            </p>
            <p>
              By using the Service, you acknowledge and consent to the recording of Immutable Audit Logs. While we never store patient notes, we do permanently log metadata regarding system access (e.g., timestamps of when notes are generated or copied) to maintain strict HIPAA compliance and defend against unauthorized access.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>3. Clinician Obligations</h2>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'none' }}>
              <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                <CheckSquare size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
                <span><strong>Verification:</strong> You must rigorously review all AI-generated text for clinical accuracy, omissions, and hallucinations before finalizing any medical record.</span>
              </li>
              <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                <CheckSquare size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
                <span><strong>Consent:</strong> You represent and warrant that you have obtained all necessary patient consents and authorizations required by law to record and process their audio/data through an AI transcription service.</span>
              </li>
              <li style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                <CheckSquare size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
                <span><strong>Account Security:</strong> You are strictly prohibited from sharing your login credentials. Multi-Factor Authentication (MFA) must remain enabled at all times.</span>
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>4. Indemnification</h2>
            <p style={{ marginBottom: '1rem' }}>
              You agree to defend, indemnify, and hold harmless Hip AI Health, its affiliates, licensors, and service providers, from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys&apos; fees) arising out of or relating to your violation of these Terms of Service or your use of the Service, including, but not limited to, clinical errors in documentation, failure to obtain patient consent, or HIPAA violations originating from your endpoint.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>5. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without giving effect to any choice or conflict of law provision.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}

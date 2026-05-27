import Link from 'next/link';
import { ArrowLeft, Server } from 'lucide-react';

export default function EnterpriseSLA() {
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
          <Server size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Enterprise Service Level Agreement</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Service Level Agreement & B2B Performance Commitments</p>
        </div>

        <div style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-main)' }}>
          
          <div style={{ padding: '1.5rem', backgroundColor: 'rgba(42, 139, 139, 0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '3rem' }}>
            <strong>SERVICE LEVEL AVAILABILITY COMMITMENT</strong><br/>
            Hip AI Health commits to providing B2B enterprise clients with <strong>99.9% Uptime availability</strong> on all primary clinical transcription and SOAP note compilation endpoints.
          </div>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>1. Performance & Latency Benchmarks</h2>
            <p style={{ marginBottom: '1rem' }}>
              We recognize that clinical documentation speed is vital to clinic operational efficiency. Hip AI Health commits to meeting the following performance latencies under normal load conditions:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Audio Processing Latency:</strong> Speech-to-Text dynamic transcription returns within 8 seconds for up to 10 minutes of audio dictation.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>SOAP Note Compilation:</strong> Clinical draft summaries (SOAP structure) compile and return within 3.5 seconds from script transmission.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>DLP Sanitization:</strong> Entity inspection and redacting completes in under 800ms per transaction.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>2. Technical Support Response SLAs</h2>
            <p style={{ marginBottom: '1rem' }}>
              For whitelabeled and enterprise group partnerships (such as whitelabeled clinics or practice deployments), Hip AI Health provides dedicated support channels:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Priority Support:</strong> Direct support line via <a href="mailto:support@hiphealthai.com" style={{ color: 'var(--text-main)', textDecoration: 'underline' }}>support@hiphealthai.com</a> with a maximum **4-hour response time** for all operational priority issues.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Systems Monitoring:</strong> Automated infrastructure logging is reviewed hourly by our operations team. In the event of standard GCP service degradation, notifications are dispatched within 15 minutes of occurrence.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>3. Shared Responsibility & Liability Model</h2>
            <p style={{ marginBottom: '1rem' }}>
              To guarantee B2B operational predictability, the Service Level Agreement operates under a strict **Shared Responsibility Model**:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Platform Responsibility:</strong> Hip AI Health commits to maintaining high-performance technical safeguards, zero data retention pipelines, encryption standards, and domestic data boundaries (locked to us-central1).</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Clinician Responsibility:</strong> The licensed healthcare practitioner carries **100% of all legal, clinical, civil, and professional liability** for documentation accuracy and diagnosis validity.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Administrative Aid Status:</strong> All structured notes compiled by the platform are legally classified as &quot;draft administrative writing aids.&quot; Clinicians are contractually required to review, edit, and verify all texts before saving them to their EMR/EHR system. The platform owner is held entirely harmless from diagnostic claims or clinical errors.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

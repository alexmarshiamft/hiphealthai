import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Server } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={20} /> Back
          </Link>
          <div style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.2em' }}>
            HIP HEALTH
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Last Updated: May 2026</p>
        </div>

        <div style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-main)' }}>
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>1. Zero Data Retention Architecture</h2>
            <p style={{ marginBottom: '1rem' }}>
              Unlike commercial consumer AI tools, Hip Health operates on a strict <strong>Zero Data Retention</strong> architecture. This means that any Protected Health Information (PHI) processed through our systems is processed entirely ephemerally in RAM.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              Once your clinical session note is generated and returned to your dashboard, <strong>all text and metadata are immediately and permanently destroyed</strong>. We do not maintain databases of patient information, nor do we store session logs for &quot;history&quot; features.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>2. Zero-Transmission Audio Processing</h2>
            <p style={{ marginBottom: '1rem' }}>
              To completely eliminate the risk of intercepted audio files, we utilize native Web Speech APIs to process all audio <strong>locally on your device</strong>. 
            </p>
            <p>
              The raw recording of your patient&apos;s voice never leaves your physical device and is never transmitted over the internet to our servers. Only the text transcript is securely routed for processing.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>3. Enterprise Data Loss Prevention (DLP)</h2>
            <p style={{ marginBottom: '1rem' }}>
              Before any transcript is processed by our AI structurer, it passes through Google Cloud&apos;s Data Loss Prevention (DLP) engine. 
            </p>
            <p>
              This enterprise-grade system actively hunts for and redacts personally identifiable information (such as names, Social Security Numbers, phone numbers, and emails), ensuring the language model never interacts with raw PHI.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>2. HIPAA Compliance & Business Associate Agreements</h2>
            <p style={{ marginBottom: '1rem' }}>
              We maintain full compliance with the Health Insurance Portability and Accountability Act (HIPAA) and the Health Information Technology for Economic and Clinical Health (HITECH) Act.
            </p>
            <p>
              All processing is executed under a rigorous Enterprise Business Associate Agreement (BAA) with our infrastructure provider, Google Cloud. You, the clinician, must also sign our Clinician BAA prior to accessing the dashboard.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>3. No AI Model Training</h2>
            <p style={{ marginBottom: '1rem' }}>
              Your patient data is yours. Period. We use Google Cloud Vertex AI enterprise endpoints to process your data. Under the terms of our enterprise agreement:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '0.5rem' }}>Your data is <strong>never</strong> used to train, retrain, or improve foundational AI models.</li>
              <li style={{ marginBottom: '0.5rem' }}>Your data is <strong>never</strong> reviewed by human evaluators.</li>
              <li style={{ marginBottom: '0.5rem' }}>Your data is completely isolated within a secure, ephemeral processing environment.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>4. Security & Encryption</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <Lock size={24} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>In Transit</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>All data transmitted between your browser and our secure endpoints is encrypted using TLS 1.3 cryptographic protocols.</p>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <Server size={24} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>At Rest (Ephemeral)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>While data is temporarily held in memory during the 3-5 second processing window, it is encrypted using AES-256 standards.</p>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>5. Contact Information</h2>
            <p>If you have any questions regarding this Privacy Policy or our security infrastructure, please contact our Compliance Team:</p>
            <div style={{ marginTop: '1rem', padding: '1.5rem', backgroundColor: 'rgba(42, 139, 139, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
              <strong>Hip Health Compliance Office</strong><br/>
              Email: compliance@hiphealthai.com<br/>
              Address: 100 Enterprise Way, Suite 300, Tech District, CA 94000
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

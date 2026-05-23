'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ fontFamily: 'Inter, sans-serif', color: 'var(--primary)', marginBottom: '2rem' }}>
          <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.25em' }}>HIP HEALTH</span>
          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.3em' }}>SECURE AI SCRIBE</span>
        </div>
        <h1 className={styles.title}>The Premier Private-Cloud Zero-Retention Scribe</h1>
        <p className={styles.subtitle}>
          Commercial AI scribes are built for the masses, permanently storing your patients&apos; most sensitive trauma notes. We built a bespoke, ephemeral architecture designed specifically for high-security practice environments. 
          <strong> Audio is never saved to a database or storage bucket—it is processed strictly inline in ephemeral RAM and instantly destroyed.</strong>
        </p>
        
        <div style={{ marginTop: '2.5rem', marginBottom: '4rem' }}>
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
            Try Live Demo <ArrowRight size={20} />
          </Link>
        </div>

        <div className={styles.videoHeroContainer}>
          <div className={styles.videoHeroWrapper}>
            <video 
              className={styles.videoHero} 
              autoPlay 
              loop 
              muted 
              playsInline 
              poster="/video-placeholder.png"
            >
              <source src="/hero-demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className={styles.videoOverlay}>
              <div className={styles.videoPlayIcon}></div>
            </div>
          </div>
        </div>
      </header>

      {/* Demo vs Production Environment Split */}
      <h2 style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--primary)', marginTop: '4rem', marginBottom: '1rem' }}>Platform Environments</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
        Select your environment. To maintain strict HIPAA compliance, real patient data is legally prohibited in our sandbox environments before executing a BAA.
      </p>

      <div className={styles.costSection}>
        {/* Demo Sandbox Mode */}
        <div className={`${styles.costCard} ${styles.costCardInferior}`}>
          <h3 className={styles.costTitle} style={{ color: 'var(--text-main)' }}>Demo Sandbox</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary)', margin: '1.5rem 0' }}>
            Instant Preview
          </div>
          <div className={styles.billedText}>No Credit Card Required</div>
          <p className={styles.costDesc} style={{ minHeight: '80px' }}>
            Evaluate transcription speed, SOAP note scrubbing, and auto-fill extensions instantly in a secure sandbox.
          </p>
          <ul style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0 2rem', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li>Convenient SMS 2FA enabled for testing</li>
            <li><strong>STRICT LIABILITY:</strong> No active patient PHI allowed</li>
            <li>Zero-retention local audio processing</li>
          </ul>
          <Link href="/login" className={styles.salesButton} style={{ width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            Try Live Demo
          </Link>
        </div>

        {/* Production Clinical Mode */}
        <div className={`${styles.costCard} ${styles.costCardPrimary}`} style={{ borderColor: 'var(--primary)', boxShadow: '0 8px 24px rgba(42, 139, 139, 0.15)' }}>
          <h3 className={styles.costTitle} style={{ color: 'var(--primary)' }}>Production Clinical</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary)', margin: '1.5rem 0' }}>
            HIPAA Authorized
          </div>
          <div className={styles.billedText}>BAA Execution Required</div>
          <p className={styles.costDesc} style={{ minHeight: '80px' }}>
            Unlock secure, legally authorized clinical note drafting and BAA certifications for your active patient roster.
          </p>
          <ul style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0 2rem', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li>Requires in-app signed BAA & terms</li>
            <li><strong>Hardware Authenticator (TOTP) strictly required</strong></li>
            <li>MANDATORY automated email verification</li>
            <li>Cleared for full HIPAA & VA CCN billing</li>
            <li>Private-cloud dedicated deployments available</li>
          </ul>
          <a href="mailto:sales@hiphealthai.com?subject=Production%20Cloud%20Deployment%20Inquiry" className={styles.salesButton} style={{ backgroundColor: 'var(--primary)', width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            Contact for Custom Cloud Setup
          </a>
        </div>

        {/* Private Cloud & Whitelabel Licensing */}
        <div className={`${styles.costCard} ${styles.costCardPrimary}`} style={{ borderColor: '#6366f1', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)' }}>
          <h3 className={styles.costTitle} style={{ color: '#6366f1' }}>On-Prem & Whitelabel</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#6366f1', margin: '1.5rem 0' }}>
            Full Software Ownership
          </div>
          <div className={styles.billedText}>100% On-Premises Hosting</div>
          <p className={styles.costDesc} style={{ minHeight: '80px' }}>
            Deploy a fully customized, whitelabeled version of the scribe software directly onto your own local servers or secure GCP/AWS cloud tenancy.
          </p>
          <ul style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0 2rem', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li><strong>Total Data Privacy:</strong> All code, databases, and credentials reside entirely on your servers.</li>
            <li><strong>Zero Platform Access:</strong> Complete revocation of Hip Health AI access post-installation.</li>
            <li><strong>Customized to Your Practice:</strong> Tailored clinical templates, branding, custom styling, and local integrations.</li>
            <li><strong>Tiered Subscription Support:</strong> Priority updates, SLA-backed technical assistance, and customized tooling tiers.</li>
          </ul>
          <a href="mailto:sales@hiphealthai.com?subject=On-Premises%20and%20Whitelabel%20Licensing%20Inquiry" className={styles.salesButton} style={{ backgroundColor: '#6366f1', width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            Inquire for Whitelabel Licensing
          </a>
        </div>
      </div>


      <section className={styles.comparisonSection}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Feature / Security Standard</th>
                <th>Our Architecture</th>
                <th>Commercial AI Scribes (e.g. SimplePractice)</th>
              </tr>
            </thead>
            <tbody>
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
                  <strong>Zero-Transmission Local Processing.</strong> Audio is translated to text live on the clinician&apos;s local CPU via Web Speech API. The recording never leaves the room.
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
              <li><span>Enterprise SLA</span></li>
            </ul>
          </div>
          <div className={styles.footerColumn}>
            <h4>Compliance</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><span>HIPAA Notice</span></li>
            </ul>
          </div>
          <div className={styles.footerColumn}>
            <h4>Contact</h4>
            <ul className={styles.footerLinks}>
              <li><span>sales@hiphealthai.com</span></li>
              <li><span>compliance@hiphealthai.com</span></li>
              <li><span>100 Enterprise Way, Suite 300</span></li>
              <li><span>Tech District, CA 94000</span></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.finePrint}>
          <p>
            <strong>HIPAA & HITECH COMPLIANCE NOTICE:</strong> Hip Health is a secure AI documentation interface operating strictly under an executed Enterprise Business Associate Agreement (BAA) with Google Cloud. The application architecture enforces a <em>Zero Data Retention</em> policy. Audio and text data processed through this portal are held ephemerally in RAM and are never written to permanent storage, databases, or training logs.
          </p>
          <p>
            <strong>NO AI TRAINING LIABILITY:</strong> Data submitted through the Hip Health Vertex AI enterprise endpoints is legally prohibited from being used to train, retrain, or improve any Google foundational models.
          </p>
          <p>
            © {new Date().getFullYear()} Hip Health Secure AI Scribe. All rights reserved. By logging in, you agree to the <Link href="/terms" style={{textDecoration: 'underline'}}>Terms of Service</Link> and <Link href="/privacy" style={{textDecoration: 'underline'}}>Privacy Policy</Link>. This tool is an assistive device and does not replace the clinical judgment of a licensed healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
}

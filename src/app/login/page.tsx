'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();

  const handleLaunchDemo = () => {
    router.push('/demo');
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoText}>
        <span className={styles.logoTextMain}>HIP AI HEALTH</span>
        <span className={styles.logoTextSub}>SECURE AI SCRIBE</span>
      </div>

      <h1 className={styles.title}>Clinician Portal Demo</h1>
      <p className={styles.subtitle}>Preview the secure AI scribe workflow with sample-only scenarios.</p>

      <div className={styles.warningBox}>
        <div className={styles.warningBoxTitle}>
          <AlertTriangle size={18} />
          <span>Presentation Sandbox</span>
        </div>
        <div>
          This build is for product walkthroughs using simulated content. Production identity, compliance, audit, and storage controls should be connected during onboarding.
        </div>
      </div>

      <button className={styles.loginButton} onClick={handleLaunchDemo}>
        <ShieldCheck size={20} style={{ marginRight: '8px' }} />
        Launch Demo
      </button>

      <p className={styles.disclaimer}>
        <ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
        Demo mode is intended for buyer presentations and sample data only.
      </p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  const handleLogin = () => {
    if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true') {
      router.push('/mfa');
      return;
    }

    setMessage('Demo bypass has been disabled. Configure Microsoft Entra ID or another real identity provider before using this portal with PHI.');
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoText}>
        <span className={styles.logoTextMain}>HIP AI HEALTH</span>
        <span className={styles.logoTextSub}>SECURE AI SCRIBE</span>
      </div>

      <h1 className={styles.title}>Clinician Portal</h1>
      <p className={styles.subtitle}>Secure access for authorized personnel only.</p>

      <div className={styles.warningBox}>
        <div className={styles.warningBoxTitle}>
          <AlertTriangle size={18} />
          <span>Authentication Required</span>
        </div>
        <div>
          Demo Mode is disabled unless NEXT_PUBLIC_ENABLE_DEMO_LOGIN is explicitly set to true. Do not process active patient PHI until real identity, MFA, and a BAA-backed deployment are configured.
        </div>
      </div>

      <button className={styles.loginButton} onClick={handleLogin}>
        <ShieldCheck size={20} style={{ marginRight: '8px' }} />
        Sign in with configured IdP
      </button>

      {message && (
        <p role="alert" style={{ color: '#d9534f', marginTop: '1rem', fontWeight: 600 }}>
          {message}
        </p>
      )}

      <p className={styles.disclaimer}>
        <ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
        HIPAA-compliant authentication must be connected before production use.
      </p>
    </div>
  );
}

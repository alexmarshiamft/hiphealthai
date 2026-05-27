'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // TODO: Implement Firebase Google Auth here
    // import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
    // const provider = new GoogleAuthProvider();
    // signInWithPopup(auth, provider).then(() => router.push('/consent'));

    // For demonstration, we bypass directly to the MFA layer
    router.push('/mfa');
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
          <span>Demo Sandbox Active</span>
        </div>
        <div>
          Demo Mode allows you to preview scribing capabilities. Under federal HIPAA laws, no active patient PHI may be processed until a BAA is executed in the next step. SMS 2FA is permitted strictly for this demo.
        </div>
      </div>

      <button className={styles.loginButton} onClick={handleLogin}>
        <ShieldCheck size={20} style={{ marginRight: '8px' }} />
        Sign in to Try Demo
      </button>

      <p className={styles.disclaimer}>
        <ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
        HIPAA-compliant authentication powered by Microsoft Entra ID (Office 365). Multi-Factor Authentication is strictly enforced.
      </p>
    </div>
  );
}


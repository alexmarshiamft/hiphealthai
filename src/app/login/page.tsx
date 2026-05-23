'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
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
        <span className={styles.logoTextMain}>HIP HEALTH</span>
        <span className={styles.logoTextSub}>SECURE AI SCRIBE</span>
      </div>

      <h1 className={styles.title}>Clinician Portal</h1>
      <p className={styles.subtitle}>Secure access for authorized personnel only.</p>

      <button className={styles.loginButton} onClick={handleLogin}>
        <svg width="24" height="24" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
          <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
          <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
          <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
        </svg>
        Sign in with Microsoft (MFA Required)
      </button>

      <p className={styles.disclaimer}>
        <ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
        HIPAA-compliant authentication powered by Microsoft Entra ID (Office 365). Multi-Factor Authentication is strictly enforced.
      </p>
    </div>
  );
}

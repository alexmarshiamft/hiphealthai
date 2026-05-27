'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function DemoPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Configuring zero-retention session...');

  useEffect(() => {
    // Automatically verify the SMS sandbox token to log the visitor into the demo session
    fetch('/api/mfa/verify-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: '123456', phoneNumber: '(555) 555-0199' }),
    })
      .then((res) => {
        if (res.ok) {
          setStatus('Session authorized. Redirecting to Sandbox Dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 800);
        } else {
          setStatus('Authentication bypass failed. Redirecting to Clinician Portal...');
          setTimeout(() => {
            router.push('/login');
          }, 1500);
        }
      })
      .catch((err) => {
        console.error(err);
        router.push('/login');
      });
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1.5rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>
          <span style={{ display: 'block', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.15em' }}>HIP AI HEALTH</span>
          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.25em' }}>SECURE AI SCRIBE</span>
        </div>
        
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          <Loader2 className="animate-spin" size={36} color="var(--primary)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: 0 }}>Clinical Sandbox Intake</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            {status}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            color: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            padding: '0.35rem 0.75rem',
            borderRadius: '4px',
            marginTop: '0.5rem'
          }}>
            <ShieldCheck size={14} />
            <span>Zero-Retention Mode Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

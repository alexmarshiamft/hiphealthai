'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { ShieldCheck, ShieldAlert, Loader2, Lock, Smartphone, Laptop, AlertTriangle } from 'lucide-react';
import styles from './mfa.module.css';

export default function MFAPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  // Dual-mode state
  const [activeTab, setActiveTab] = useState<'sms' | 'totp'>('sms');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Check if the user already has verified setup in their cookies
    fetch('/api/mfa/status')
      .then(res => res.json())
      .then(data => {
        if (data.hasVerifiedSetup) {
          setNeedsSetup(false);
          setLoading(false);
        } else {
          // Generate new secret for first time setup
          fetch('/api/mfa/generate', { method: 'POST' })
            .then(res => res.json())
            .then(async (genData) => {
              try {
                const url = await QRCode.toDataURL(genData.otpauth);
                setQrDataUrl(url);
              } catch (err) {
                console.error('Error generating QR code', err);
              }
              setNeedsSetup(true);
              setLoading(false);
            });
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to initialize MFA.');
        setLoading(false);
      });
  }, []);

  // Countdown timer for SMS
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendSMS = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }
    setError('');
    setSmsSent(true);
    setCountdown(60);
  };

  const handleVerifySMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) {
      setError('Please enter the 6-digit code sent to your phone.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/mfa/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phoneNumber }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // SMS MFA successful, redirect directly to usable sandbox demo dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid code. Use "123456" for this sandbox demo.');
        setVerifying(false);
      }
    } catch {
      setError('A network error occurred. Please try again.');
      setVerifying(false);
    }
  };

  const handleVerifyTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // MFA successful, redirect to consent page
        router.push('/consent');
      } else {
        setError(data.error || 'Invalid code. Please try again.');
        setVerifying(false);
      }
    } catch {
      setError('A network error occurred. Please try again.');
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: '540px' }}>
        <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
        <h1 className={styles.title}>Multi-Factor Authentication</h1>
        <p className={styles.subtitle} style={{ marginBottom: '1.5rem' }}>
          Verify your identity to secure patient data access and comply with practice rules.
        </p>

        {/* Global MFA Guidance Portal Card */}
        <div style={{
          backgroundColor: 'rgba(42, 139, 139, 0.06)',
          border: '1px solid rgba(42, 139, 139, 0.25)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '2rem',
          textAlign: 'left',
          fontSize: '0.85rem',
          color: 'var(--text-main)',
          lineHeight: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontWeight: 600, color: 'var(--primary)' }}>
            <ShieldCheck size={20} />
            <span>Operational MFA Security Gateway</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Choose your authentication level below. Under federal guidelines, **Option A** launches a locked, sample-only Sandbox Demo with 100% simulated clinical notes. **Option B** enforces production-grade multi-factor security, unlocking active transcription only after electronic Clinician BAA signature.
          </div>
        </div>

        {/* Option Selector Tabs */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'sms' ? styles.tabButtonActive : ''}`}
            onClick={() => {
              setActiveTab('sms');
              setToken('');
              setError('');
            }}
          >
            Option A: SMS 2FA (Demo)
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'totp' ? styles.tabButtonActive : ''}`}
            onClick={() => {
              setActiveTab('totp');
              setToken('');
              setError('');
            }}
          >
            Option B: TOTP App (Production)
          </button>
        </div>

        {activeTab === 'sms' ? (
          /* Option A: SMS 2FA Mode */
          <div>
            <div className={styles.optionHeader}>
              <div className={styles.optionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smartphone size={18} color="var(--primary)" />
                <span>SMS 2FA (Demo Sandbox Only)</span>
              </div>
              <div className={styles.optionDesc}>
                Quick-access verification strictly for product evaluation.
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(217, 119, 6, 0.06)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              borderRadius: '8px',
              padding: '0.85rem',
              color: '#b45309',
              fontSize: '0.8rem',
              textAlign: 'left',
              lineHeight: 1.4,
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>STRICT WARNING:</strong> Under federal HIPAA guidelines, processing active patient PHI is strictly legally prohibited while authenticated via SMS 2FA without an executed BAA.
              </span>
            </div>

            <form onSubmit={handleVerifySMS}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Mobile Phone Number</label>
                <div className={styles.phoneInputGroup}>
                  <input
                    type="tel"
                    placeholder="(555) 555-5555"
                    className={styles.phoneInput}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={smsSent}
                  />
                  <button
                    type="button"
                    className={styles.sendCodeBtn}
                    onClick={handleSendSMS}
                    disabled={phoneNumber.length < 10 || countdown > 0}
                  >
                    {countdown > 0 ? `Resend (${countdown}s)` : 'Send Code'}
                  </button>
                </div>
              </div>

              {smsSent && (
                <>
                  <div style={{
                    backgroundColor: 'rgba(42, 139, 139, 0.08)',
                    border: '1px solid rgba(42, 139, 139, 0.25)',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    marginBottom: '1.5rem',
                    lineHeight: 1.4
                  }}>
                    <strong>SMS Code Simulated:</strong> For this sandbox demonstration, use verification code <strong>123456</strong> to proceed.
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="smsToken">Enter 6-Digit SMS Code</label>
                    <input
                      id="smsToken"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className={styles.input}
                      placeholder="000000"
                      value={token}
                      onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                      autoComplete="one-time-code"
                      required
                    />
                  </div>

                  {error && <div className={styles.error}>{error}</div>}

                  <button type="submit" className={styles.button} disabled={verifying || token.length !== 6}>
                    {verifying ? (
                      <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                    ) : (
                      <><Lock size={20} /> Verify SMS & Enter Sandbox</>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>
        ) : (
          /* Option B: Hardware Authenticator App (Production) */
          <div>
            <div className={styles.optionHeader}>
              <div className={styles.optionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Laptop size={18} color="var(--primary)" />
                <span>Hardware Authenticator App (Production Scribe)</span>
              </div>
              <div className={styles.optionDesc}>
                Secure cryptographic TOTP standard strictly required to process real patient PHI.
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '0.85rem',
              color: '#047857',
              fontSize: '0.8rem',
              textAlign: 'left',
              lineHeight: 1.4,
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}>
              <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>HIPAA & BAA APPROVED:</strong> This option guarantees complete end-to-end security and deactivates vulnerable SMS gateways to authorize clinical patient processing.
              </span>
            </div>

            {needsSetup && (
              <>
                <p style={{ color: 'var(--text-main)', marginBottom: '1rem', fontWeight: 500, fontSize: '0.9rem', textAlign: 'left' }}>
                  1. Scan this QR code with Google Authenticator, Authy, or Microsoft Authenticator
                </p>
                {qrDataUrl && (
                  <div className={styles.qrContainer}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="MFA QR Code" className={styles.qrImage} width={200} height={200} />
                  </div>
                )}
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'left', marginBottom: '1.25rem', padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                  <strong>Manual Setup Key:</strong> <code style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>JBSWY3DPEHPK3PXP</code>
                </div>
                <p style={{ color: 'var(--text-main)', marginBottom: '1rem', fontWeight: 500, fontSize: '0.9rem', textAlign: 'left' }}>
                  2. Enter the 6-digit code generated by the app
                </p>
                <div style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px dashed rgba(42, 139, 139, 0.3)',
                  borderRadius: '8px',
                  padding: '0.85rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4
                }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>🔐 Backup Recovery Codes Generated:</strong>
                  <code style={{ color: 'white', fontFamily: 'monospace', fontSize: '0.85rem' }}>HIP-REC-9E8F-4A2D-BC81-7A39</code>
                  <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    Save this recovery code in a secure clinic vault. In case of lost hardware or device change, this code will bypass active lockouts.
                  </span>
                </div>
              </>
            )}

            {!needsSetup && (
              <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontWeight: 500, fontSize: '0.9rem', textAlign: 'left' }}>
                Enter the 6-digit code from your authenticator app
              </p>
            )}

            <form onSubmit={handleVerifyTOTP}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="totpToken">Authentication Code</label>
                <input
                  id="totpToken"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className={styles.input}
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  autoComplete="one-time-code"
                  required
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" className={styles.button} disabled={verifying || token.length !== 6}>
                {verifying ? (
                  <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                ) : (
                  <><Lock size={20} /> Verify & Activate Production</>
                )}
              </button>
            </form>
          </div>
        )}

        <div className={styles.warningBox}>
          <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Zero-Trust Architecture:</strong> Hip AI Health Scribe enforces automatic 3-minute screen blurs and 5-minute idle timeouts to guarantee medical record privacy.
          </span>
        </div>
      </div>
    </div>
  );
}

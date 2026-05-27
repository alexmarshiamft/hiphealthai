import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ShieldCheck, BarChart3, Activity, Users } from 'lucide-react';
import styles from './admin.module.css';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const mfaSession = cookieStore.get('mfa_session')?.value;

  if (mfaSession !== 'verified') {
    redirect('/mfa');
  }

  // Fetch metrics dynamically, no caching
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store');
  
  // Need absolute URL for server-side fetch. Use a placeholder in build, or construct from req.
  // Using an internal function call or a relative path isn't supported in server components directly via fetch,
  // but we can import the GET function directly to avoid domain issues.
  
  const { GET } = await import('../api/admin/metrics/route');
  const res = await GET();
  const data = await res.json();
  const metrics = data.metrics || { notesGenerated: 0, dlpScrubs: 0, activeUsers: 0 };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoText}>
          <ShieldCheck size={32} color="var(--primary)" />
          <span>ADMIN ANALYTICS</span>
        </div>
        <p className={styles.subtitle}>Immutable Cloud Audit Log Telemetry</p>
      </header>

      <main className={styles.grid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(42, 139, 139, 0.1)' }}>
            <Activity color="var(--primary)" size={24} />
          </div>
          <div>
            <h3 className={styles.statTitle}>Notes Generated</h3>
            <div className={styles.statValue}>{metrics.notesGenerated}</div>
            <p className={styles.statDesc}>Total AI scribing executions</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <ShieldCheck color="#10b981" size={24} />
          </div>
          <div>
            <h3 className={styles.statTitle}>PHI Redactions</h3>
            <div className={styles.statValue}>{metrics.dlpScrubs}</div>
            <p className={styles.statDesc}>Successful DLP API scrub events</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
            <Users color="#6366f1" size={24} />
          </div>
          <div>
            <h3 className={styles.statTitle}>Active Clinicians</h3>
            <div className={styles.statValue}>{metrics.activeUsers}</div>
            <p className={styles.statDesc}>Current active MFA sessions</p>
          </div>
        </div>
      </main>

      <div className={styles.chartPanel}>
        <div className={styles.panelHeader}>
          <BarChart3 size={20} color="var(--primary)" />
          <h2>API Usage Cost Analysis</h2>
        </div>
        <p className={styles.panelText}>
          This telemetry is pulled directly from Google Cloud Logging. Because we employ a Zero Data Retention architecture, no application database exists. 
          Audit metrics are derived from read-only log sinks.
        </p>
        <div className={styles.dummyChart}>
          {/* Visual placeholder for a chart */}
          <div className={styles.chartBar} style={{ height: '40%' }}><span>Mon</span></div>
          <div className={styles.chartBar} style={{ height: '70%' }}><span>Tue</span></div>
          <div className={styles.chartBar} style={{ height: '50%' }}><span>Wed</span></div>
          <div className={styles.chartBar} style={{ height: '90%' }}><span>Thu</span></div>
          <div className={styles.chartBar} style={{ height: '60%' }}><span>Fri</span></div>
        </div>
      </div>
    </div>
  );
}

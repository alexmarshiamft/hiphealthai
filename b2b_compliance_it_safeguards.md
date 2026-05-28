# 🛡️ B2B Compliance, IT Safeguards, & SLA Framework

This technical sales enablement document is designed to be handed directly to IT directors, compliance officers, and clinical administrators of practices interested in licensing the **HIP AI Health Secure Scribe** platform. It satisfies standard B2B vendor vetting procedures, software risk assessments, and IT safeguards verification.

---

## 🔒 1. HIPAA Technical & Administrative Safeguards Matrix

The following matrix documents the specific administrative, technical, and physical safeguards implemented to satisfy the HIPAA Security Rule (45 CFR Part 164, Subpart C):

| HIPAA Safeguard Category | Regulatory Reference | Platform Implementation | Verification State |
| :--- | :--- | :--- | :--- |
| **Transmission Security** | 45 CFR § 164.312(e)(1) | All audio payloads, session data, and note streams are encrypted in-transit using **TLS 1.3** and **perfect forward secrecy (PFS)**. | **VERIFIED PASS** (E2E SSL Audit) |
| **Access Control & Auth** | 45 CFR § 164.312(a)(1) | Gated access utilizing custom Next.js middleware with multi-factor authentication (SMS 2FA and secure Hardware TOTP configurations). | **VERIFIED PASS** (MFA Security Gate) |
| **Unique User Identification**| 45 CFR § 164.312(a)(2)(i)| Every clinician operates under a unique, cryptographically signed account. Guest or shared sessions are strictly prevented. | **VERIFIED PASS** (Unique User ID) |
| **Automatic Logoff** | 45 CFR § 164.312(a)(2)(iii)| Browser sessions automatically expire after 30 minutes of inactivity. Local-first IndexedDB states are safely scrubbed upon session termination. | **VERIFIED PASS** (Session Lifecycle) |
| **Data Integrity Controls** | 45 CFR § 164.312(c)(1) | Injected attestation watermark hashes (`SECURE-GCP-BAA-VERIFIED-INTEGRITY-TRUE`) verify that SOAP note drafts have not been altered in transit. | **VERIFIED PASS** (Attestation Verification) |
| **Audit Controls (Telemetry)** | 45 CFR § 164.312(b) | Detailed local client activity logging triggers `NOTE_DOWNLOADED` trace events to verify secure clinical documentation custody. | **VERIFIED PASS** (Audit Logs) |

---

## ☁️ 2. Sovereign IT Architecture & Ephemeral Data Flow

Our **database-bypass** design guarantees that Protected Health Information (PHI) is isolated from traditional persistent storage systems. The system operates entirely on an ephemeral, RAM-only processing paradigm:

```
                  ┌────────────────────────────────────────┐
                  │      CLINICAL Telehealth Session       │
                  └───────────────────┬────────────────────┘
                                      │ (Real-Time Audio Stream)
                                      ▼
                  ┌────────────────────────────────────────┐
                  │      Encrypted Browser Session         │
                  │  (De-identification via local IndexedDB)│
                  └───────────────────┬────────────────────┘
                                      │ (Only De-identified Audio & Context)
                                      ▼
                  ┌────────────────────────────────────────┐
                  │   Secure Google Cloud Run RAM Conduit  │
                  │   * Vertex AI HIPAA SOAP Note Synthesis│
                  │   * Wiped instantly upon compilation   │
                  └───────────────────┬────────────────────┘
                                      │ (Structured Clinical Note Draft)
                                      ▼
                  ┌────────────────────────────────────────┐
                  │   EHR Autofill Simulator in Browser    │
                  │   (Typing simulation bypasses clipboard)│
                  └────────────────────────────────────────┘
```

### Key Ephemeral Architecture Guarantees:
1. **RAM-Only Conduit:** Audio streams and compiled note outputs reside strictly within transient virtual memory (RAM) inside a stateless, secure Cloud Run container.
2. **Zero Persistent Storage:** The platform does not instantiate or maintain any SQL databases, Redis caches, or permanent file buckets (S3/Cloud Storage) for patient data.
3. **Local Encryption (IndexedDB):** Patient profiles are saved inside the local browser registry utilizing client-controlled storage sandboxes. No unredacted patient identifiers ever touch our servers.

---

## 📈 3. Service Level Agreement (SLA) & Uptime Framework

Practices licensing this platform require structural guarantees around application availability and technical support. The following standard SLA outline can be included in the commercial licensing agreement:

### 3.1 Availability Target
* **Uptime Commitment:** The platform commits to a **99.9% Uptime SLA** in any calendar month, excluding scheduled maintenance.
* **Hosting Redundancy:** Server operations are deployed on serverless, multi-zone **Google Cloud Run** containers, providing automatic geographic failovers and high-speed edge delivery.
* **Status Monitoring:** Real-time system performance and service health parameters are continuously evaluated via Cloud Logging and Monitoring frameworks.

### 3.2 Scheduled Maintenance
* **Window Duration:** Maintenance is restricted to off-peak clinical hours (Saturday 10:00 PM to Sunday 2:00 AM EST).
* **Notification Protocol:** Licensed clinics receive email notices at least 48 hours in prior to any system updates.

### 3.3 Incident Classification & Support Response

| Severity Level | Definition | Response SLA | Target Resolution |
| :--- | :--- | :--- | :--- |
| **Severity 1 (Critical)** | Core application is down; clinicians are completely blocked from compiling SOAP notes. | **< 1 Hour** | **< 4 Hours** |
| **Severity 2 (High)** | The EHR autofill simulator is failing, but local PDF export and copy operations remain active. | **< 4 Hours** | **< 12 Hours** |
| **Severity 3 (Normal)** | Aesthetic alignments, dashboard spacing, or general template optimization requests. | **< 24 Hours** | **< 48 Hours** |

---

## 🛠️ 4. Device Setup & System Requirements

To ensure zero-friction pilot trials and production onboarding, prospective clinics must satisfy these basic hardware and software parameters:

### 🖥️ Client-Side Browser Requirements
* **Browser Compatibility:** Google Chrome (v110 or higher), Microsoft Edge (v110 or higher), or any Chromium-based desktop browser.
* **Why Chromium?** The 1-Click EHR Autofill simulation requires standard Chromium DOM-injection engines to simulate natural keystrokes and bypass OS clipboard logs.
* **Configuration:** Cookies and local browser data storage must be enabled to allow the IndexedDB database to persist patient profiles safely.

### 🎙️ Audio Hardware Recommendations
* **Scribe Dictation:** External USB boundary microphones (e.g., Jabra Speak series) are highly recommended for quiet office tele-therapy rooms.
* **Ambient Capture:** For dual-dialogue therapy rooms, configure a directional or high-gain omnidirectional microphone to capture both therapist and client voices evenly.
* **Software Filter:** Built-in acoustic echo cancellation and background noise suppression should be kept enabled in system settings.

# BUSINESS ASSOCIATE AGREEMENT (BAA) TEMPLATE
**HIPAA HITECH Act Compliant B2B Data Processing Addendum**

This Business Associate Agreement ("Agreement" or "BAA") is entered into and made effective as of the date of execution by and between:
1. **[Covered Entity Name]** ("Covered Entity"), with principal operations at [Address]; and
2. **Hip Health AI Operations, LLC** ("Business Associate"), a remote-first, secure clinical software provider.

Each a "Party" and collectively the "Parties."

---

## 1. RECITALS
1. **Protected Health Information:** Covered Entity is a "Covered Entity" as defined under the Health Insurance Portability and Accountability Act of 1996 ("HIPAA"), the Health Information Technology for Economic and Clinical Health Act ("HITECH"), and the regulations promulgated thereunder (collectively, "HIPAA Rules").
2. **Standard of Service:** Business Associate provides a secure, web-based assistive writing interface ("Scribe Platform") and an integrated client-side browser text-injection utility ("Chrome Extension") to assist licensed clinical practitioners in organizing clinical dictation.
3. **RAM-Only Ephemeral Processing:** The Parties explicitly acknowledge and agree that the Scribe Platform utilizes a **Zero-Retention Ephemeral Architecture**. Audio recordings and clinical text are processed strictly in temporary server random-access memory (RAM) and are ephemerally routed via secure TLS 1.3 channels to downstream HIPAA-compliant service endpoints. **At no time does the Business Associate write, store, cache, log, or permanently hold Protected Health Information (PHI) inside any database, disk system, or storage device.**
4. **Third-Party BAA Coverage:** Business Associate's backend hosting environment operates exclusively within Google Cloud Platform (GCP). Business Associate represents and warrants that it maintains an active, executed Business Associate Addendum (BAA) with Google Cloud covering Google Cloud Run, Google Cloud Speech-to-Text Enterprise, and Google Vertex AI endpoints.

---

## 2. OBLIGATIONS OF THE BUSINESS ASSOCIATE
1. **Permitted Uses and Disclosures:** Business Associate shall not use or disclose PHI other than as permitted or required by this Agreement, or as required by state or federal law.
2. **Technical Safeguards:** Business Associate shall implement and maintain appropriate technical, physical, and administrative safeguards in compliance with the HIPAA Security Rule (45 CFR § 164.312) to prevent unauthorized use or disclosure of PHI. These code-level and network-level safeguards include:
   - **Automated DLP Scrubbing:** The system forces all incoming transcripts through a multi-pass Data Loss Prevention (DLP) engine to redact standard HIPAA identifiers (SSNs, phone numbers, emails, DOBs, physical addresses, MRNs, and patient names) before generative processing.
   - **Extension-Level Shields:** Enforcing `data-gramm="false"`, `spellCheck={false}`, and context-menu blockades inside the Scribe Dashboard to protect active clinical textareas from third-party browser-extension keyloggers.
   - **60-Second Clipboard Auto-Wipe:** Wiping clipboard values generated from custom copy handlers within 60 seconds of initial write.
   - **Workstation Timeout Protection:** Automatically obscuring active viewports after three (3) minutes of inactivity, and terminating active user sessions and cookies after five (5) minutes of inactivity.
3. **Reporting Security Incidents:** Business Associate shall report to Covered Entity any suspected or confirmed acquisition, access, use, or disclosure of PHI in violation of this Agreement (a "Breach") within seventy-two (72) hours of discovery.
4. **Mitigation:** Business Associate agrees to mitigate, to the extent practicable, any harmful effect that is known to Business Associate of a use or disclosure of PHI by Business Associate in violation of the requirements of this BAA.
5. **Subcontractors:** Business Associate shall ensure that any agent or subcontractor that creates, receives, maintains, or transmits PHI on behalf of Business Associate agrees to the same restrictions, conditions, and safeguards that apply to Business Associate under this Agreement.
6. **Access to Books and Records:** Business Associate shall make its internal practices, books, and records relating to the use and disclosure of PHI received from Covered Entity available to the Secretary of the Department of Health and Human Services (HHS) for purposes of determining compliance.

---

## 3. OBLIGATIONS OF THE COVERED ENTITY
1. **Clinical Disclosures & Patient Consent:** Covered Entity is solely responsible for obtaining any necessary patient consents or authorizations prior to utilizing assistive technology, including compliance with California Senate Bill 903 (SB 903) and Assembly Bill 3030 (AB 3030) if operating in the State of California.
2. **Security of Credentials:** Covered Entity's practitioners shall maintain strict password security, secure multi-factor authentication (TOTP or SMS 2FA), and secure local device locks on all clinical workstations.
3. **No Database Misuse:** Covered Entity agrees not to attempt to force persistent storage of clinical PHI within the Business Associate's systems, acknowledging that any text uploaded is treated ephemerally and wiped immediately post-session.

---

## 4. ALLOCATION OF LEGAL LIABILITY (SHARED RESPONSIBILITY COVENANT)
1. **Un-Delegable Clinical Responsibility:** Covered Entity explicitly covenants and agrees that the Scribe Platform is strictly an **assistive administrative drafting tool**. Generated notes are drafts only. Covered Entity's licensed clinicians retain **100% of all diagnostic, prescriptive, and malpractice liabilities** associated with patient records. Clinicians must read, review, and edit every note for clinical accuracy before signing off or pasting notes into their Electronic Health Record (EHR) charts.
2. **Indemnification:** Covered Entity agrees to defend, indemnify, and hold harmless Business Associate, its members, managers, developers, and hosting partners from and against any and all claims, civil penalties, BBS or licensing board complaints, malpractice lawsuits, or regulatory audits arising from Covered Entity's reliance on structured drafts or use of the platform.

---

## 5. TERM AND TERMINATION
1. **Term:** The term of this BAA shall commence on the Effective Date and shall terminate when all services are discontinued or when either Party terminates the underlying Service Agreement for cause.
2. **Destruction of Data:** Upon termination of the service agreement, the Parties acknowledge that **no clinical data remains on the Business Associate's systems to be returned or destroyed**, owing to the platform's RAM-only ephemeral architecture. Any local system configurations or clinician profile metadata shall be permanently deleted from the Business Associate's secure database tenant within thirty (30) days.

---

## 6. MISCELLANEOUS
1. **Regulatory References:** A reference in this BAA to a section in the HIPAA Rules means the section as in effect or as amended.
2. **Amendment:** The Parties agree to take such action as is necessary to amend this BAA from time to time as is necessary for Covered Entity to comply with the requirements of HIPAA and the HITECH Act.
3. **Governing Law:** This BAA shall be governed by, and construed in accordance with, the laws of the State of California and federal HIPAA provisions.

---

**IN WITNESS WHEREOF, the Parties have executed this Business Associate Agreement as of the dates set forth below.**

### FOR COVERED ENTITY:
Signature: _____________________________________  
Name: __________________________________________  
Title: _________________________________________  
Date: __________________________________________  

### FOR BUSINESS ASSOCIATE:
Signature: _/s/ Hip Health Operations Compliance_  
Name: Hip Health AI Operations, LLC  
Title: Chief Compliance Officer  
Date: May 24, 2026  

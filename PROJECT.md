# Project: HIP AI Health Secure Scribe Enterprise Edition

This document tracks the global milestones, system architecture, interface contracts, and code layout for perfecting the HIP AI Health Secure Scribe Next.js application and preparing it for enterprise deployment.

## Architecture
- **Frontend**: Next.js 16.2.6 (React 19) with Tailwind CSS 4.0. Gated by a HIPAA Shared Responsibility Modal.
- **Local Database**: Browser-first client registry with IndexedDB (`src/lib/localDB.ts`). Stores de-identified profiles (`Patient-TX-XXXX`) locally.
- **Backend API Routes**:
  - `/api/scrub`: Generates structured SOAP notes and uses GCP DLP to redact 7 core PHI infoTypes with `[REDACTED BY DLP]`.
  - `/api/whitelabel/scrape`: Overrides styling, logos, and slogan based on clinician's partner domain using Gemini.
  - `/api/mfa/*`: Secure multi-factor authentication for clinicians.
  - `/api/audit`: Write-only immutable logs sent to GCP Cloud Logging.
- **Chrome Extension**: Manifest V3 extension (`chrome-extension`) that injects structured clinical text securely into EHR textareas/fields with framework events.
- **Deployment**: Zero-retention Docker container optimized for Google Cloud Run.

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Lint & Code Polish | Remediate 8 ESLint issues in `src/app/dashboard/page.tsx`, `src/app/api/scrub/route.ts`, and `voiceover_gen.js`. Achieve 100% clean `npm run lint`. | None | DONE |
| 2 | Functional & A11y Polish | Polish all 8 client workflows (waiver, IndexedDB registry, ambient capture, templates, CPT slider, timeline circles, EHR sandbox autofill, whitelabel morpher). Ensure flawless interactivity. | M1 | DONE |
| 3 | Build & Deployment Packaging | Production build optimizations. Create secure, rootless, zero-retention multi-stage `Dockerfile` for Cloud Run. | M2 | DONE |
| 4 | E2E Verification & Forensic Audit | Run Puppeteer E2E audits locally. Spawn the Forensic Auditor to verify clean integration and complete integrity. | M3 | DONE |

## Interface Contracts
### Whitelabel Scraper ↔ Frontend
- Output format: `{ primaryColor: string, bgColor: string, slogan?: string, logoUrl?: string }`
- Fallback configuration: default HIP AI brand colors and typography.

### DLP Redactor ↔ Note Synthesizer
- Input: Raw transcript text.
- Process: DLP redaction of 7 infoTypes PRIOR to note synthesis.
- Output: Structured SOAP note containing only `[REDACTED BY DLP]` placeholders.

## Code Layout
- `src/app/`: Static routes and dynamic API endpoints.
- `src/lib/`: Library files (local database, PDF generator).
- `chrome-extension/`: Manifest V3 Chrome Extension.
- `public/`: Static marketing assets.
- `Dockerfile`: Secure Docker configuration (to be created in Milestone 3).

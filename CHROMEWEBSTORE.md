# Chrome Web Store Listing — Hip Health AI - EHR Autofill

> Last Updated: 2026-05-24
> **Live Extension ID:** `kpiiejkgojmbkdmfglbmcojjinbgenfo` (Registered Unlisted)

## Store Listing

**Extension Name** [REQUIRED]
Hip Health AI - EHR Autofill


**Short Description** [REQUIRED]
Securely autofills structured clinical notes from Hip Health AI directly into any EMR/EHR system.


**Detailed Description** [REQUIRED]
Secure clinical documentation paste utility designed exclusively for verified licensed practitioners using the Hip Health AI Scribe platform.

Accelerate your administrative workflows inside SimplePractice, TherapyNotes, or any browser-based Electronic Health Record (EHR) portal. The Hip Health Autofill adapter bridges the gap between your secure client session and your charts without leaving your browser session.

Features:
- 1-Click Injection: Focus your cursor inside any text area, click the extension icon, and watch your note instantly populate.
- Keylogger Shield: Bypasses standard clipboard-based leaks by targeting direct in-tab browser elements.
- Framework Support: Dispatches events compatible with major reactive frameworks (React, Angular) ensuring standard inputs recognize text updates.
- Rich Text Compatible: Seamlessly inserts content into custom contenteditable rich-text editors.
- Visual Flash Feedback: Confirms successful entry with a subtle green highlight animation.

How to Use:
1. Copy your compiled SOAP note or treatment plan from your secure Hip Health dashboard.
2. Navigate to your active patient chart in your EHR browser tab.
3. Click and focus inside the target charting text area.
4. Click the Hip Health AI extension icon in your browser toolbar to automatically paste and inject your note.

Privacy & Security Notice:
Hip Health AI prioritizes clinical privacy. This extension operates strictly client-side, reads exclusively from the active clipboard memory during injection, and never collects, syncs, or transmits any clinical text, patient records, or user credentials off your local workstation.


**Category** [REQUIRED]
Productivity


**Single Purpose** [REQUIRED]
Securely autofills structured clinical notes from the Hip Health AI platform directly into active EMR/EHR text fields.


**Primary Language** [REQUIRED]
English (United States)


## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ⬜ Not created | `chrome-extension/icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | `chrome-extension/screenshots/screenshot-1.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | `chrome-extension/screenshots/screenshot-2.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | `chrome-extension/promo-440.png` |

*Note: Since the extension is intended for unlisted B2B practice distribution, basic annotative diagrams illustrating the dashboard-to-EHR paste flow are recommended.*


## Permissions Justification

Every permission declared in `manifest.json` is mapped below with its specific regulatory justification:

| Permission | Type | Justification |
|------------|------|---------------|
| `activeTab` | permissions | Required to temporarily access the active browser tab currently running the clinician's EHR system when the toolbar icon is clicked. |
| `scripting` | permissions | Required to inject the helper script (`content.js`) onto the active EHR tab to find the focused textarea and execute the autofill action. |
| `clipboardWrite` | permissions | Declared to support secure local clipboard management and transfer between the secure scribe interface and the injection targets. |
| `<all_urls>` | host_permissions | Required to enable compatibility with any browser-based EHR or medical charting domain (such as SimplePractice, TherapyNotes, or custom health system portals) that a therapist uses. |

> **🚀 Speed Up Store Approval Note:** To bypass long manual review cycles triggered by the broad `<all_urls>` permission, you can explicitly restrict this list in `manifest.json` to the specific EHR systems in use by your clinic (e.g. `https://*.simplepractice.com/*`, `https://*.therapyportal.com/*`).


## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | N/A | No |
| Health info | No | No | N/A | No |
| Financial info | No | No | N/A | No |
| Authentication info | No | No | N/A | No |
| Personal communications | No | No | N/A | No |
| Location | No | No | N/A | No |
| Web history | No | No | N/A | No |
| User activity | No | No | N/A | No |
| Website content | No | No | N/A | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes


## Privacy Policy

**Privacy Policy URL** [REQUIRED]
`https://phi-scrubber-13754652105.us-central1.run.app/privacy`

*(This link has been fully verified and is active on your deployed web portal, satisfying standard Web Store requirements).*


## Distribution

**Visibility**: Unlisted
*(ITR executives and compliance teams will want this extension to be **Unlisted** so it remains hidden from public searches on the Chrome Web Store, allowing only whitelisted practices/clinicians to access the download link).*

**Regions**: United States (Region-locked for healthcare compliance boundaries).

**Pricing**: Free


## Developer Info

**Publisher Name** [REQUIRED]
Hip Health AI Operations

**Contact Email** [REQUIRED]
compliance@hiphealthai.com

**Homepage URL** [RECOMMENDED]
`https://phi-scrubber-13754652105.us-central1.run.app`


## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0 | 2026-05-24 | Initial production-ready release of EHR injection adapter. Supports textareas and contenteditable inputs. | Draft |


## Review Notes

### Known Issues / Limitations
- Only triggers when clicked on a page with an active input focus. If no text area is focused, will alert the user.
- Runs strictly ephemerally in active tab context.

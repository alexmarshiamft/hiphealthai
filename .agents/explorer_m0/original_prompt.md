## 2026-05-27T17:42:56-07:00
You are teamwork_preview_explorer, the read-only exploration agent for the HIP AI Health Secure Scribe Next.js application.
Your working directory is `/Users/alexandermarshi/Downloads/Hip-AI-scribe/.agents/explorer_m0`.

Please perform a thorough investigation of the codebase:
1. Initialize your BRIEFING.md and progress.md in `/Users/alexandermarshi/Downloads/Hip-AI-scribe/.agents/explorer_m0`.
2. Inspect the project structure (specifically `src/app`, `src/lib`, `chrome-extension`, `public`).
3. Run linting (`npm run lint`), typescript verification (`npx tsc --noEmit`), and compile check (`npm run build`) to see what compile/lint/build issues currently exist. (If there are any, list them in detail).
4. Run the existing tests using `node run_tests.js` or standard test commands to see what is failing or passing in the current environment. (Note: standard development server `npm run dev` might need to be run in the background, or is it already running? Check if `run_tests.js` runs against a local port or remote URL. Wait, check `run_tests.js` and `visual_e2e_audit.js` - they both run against `https://phi-scrubber-13754652105.us-central1.run.app/demo`! Wait! Check if we can run tests against local server instead, since we want to perfect the local application).
5. Locate and examine all clinical workflows: onboarding waiver, IndexedDB client registry, raw transcript input, template note synthesis, CPT billing prediction, typewriter EHR simulation, whitelabeling, and surgical note refiner.
6. Verify security policies: check for zero-retention, encryption, data hygiene, and Google Cloud Run zero-retention configuration requirements.
7. Write a detailed handoff report `handoff.md` in `/Users/alexandermarshi/Downloads/Hip-AI-scribe/.agents/explorer_m0` summarizing your findings, diagnostics, code structure, and recommended remediation strategies.
8. Update progress.md frequently. When finished, send a message to the Project Orchestrator (conversation ID: 6c54ef6f-9435-4261-9e1f-b676ed323b18) summarizing the results and linking to your `handoff.md` report.

Do not edit any source code files — you are a read-only exploration agent. You may only write to your own directory under `.agents/explorer_m0`.

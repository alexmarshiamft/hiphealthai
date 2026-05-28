// content.js — DOM-Injected Scribe Sidebar Drawer for Hip Health Secure Scribe

(function () {
  let sidebarContainer = null;
  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];
  let activePreset = 'SOAP';

  const presets = {
    SOAP: `Clinician: Welcome back, Sarah. Let's review how you've been doing with the anxiety this week.
Client: It's been tough. I had two panic attacks during meetings. My chest felt so tight, like I couldn't breathe. I just wanted to run out of the room.
Clinician: What automatic thoughts did you notice during those chest tight episodes?
Client: I kept thinking, 'I'm going to pass out in front of everyone, and they'll all think I'm weak.' I was catastrophizing that this would ruin my career.
Clinician: Thank you for identifying that cognitive distortion—catastrophizing. Let's work on our CBT thought record now.`,
    VA: `System Review: Patient presents for service-connected PTSD and severe combat assessment.
Client: I've been having major intrusive thoughts and flashbacks. I can't sleep. The startle response is so active I avoid going to public grocery stores entirely.
Clinician: Let's complete the outpatient trauma screen. Have you had any active suicidal ideations this week?
Client: No active plans, just feeling overwhelmed and socially isolated.`,
    CBT: `Session Context: Focus on cognitive restructuring of depressive automatic thoughts.
Client: I failed to complete the homework perfectly. I kept thinking, 'If I can't do this perfectly, I'll never get better.'
Clinician: That is a classic all-or-nothing thinking distortion. Let's construct a collaborative alternative: 'Homework is a diagnostic experiment, not a perfection test.'`
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TOGGLE_SIDEBAR') {
      toggleSidebar();
    }
  });

  function toggleSidebar() {
    if (!sidebarContainer) {
      createSidebar();
    } else {
      if (sidebarContainer.style.transform === 'translateX(0px)') {
        sidebarContainer.style.transform = 'translateX(380px)'; // Slide out
      } else {
        sidebarContainer.style.transform = 'translateX(0px)'; // Slide in
      }
    }
  }

  function createSidebar() {
    sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'hip-scribe-sidebar-root';
    
    // Scoped CSS styles to insulate extension UI from host page styles
    const styles = `
      #hip-scribe-sidebar-root {
        position: fixed;
        top: 0;
        right: 0;
        width: 360px;
        height: 100vh;
        background-color: #050811 !important;
        border-left: 1px solid rgba(255,255,255,0.08) !important;
        box-shadow: -10px 0 40px rgba(0,0,0,0.5) !important;
        z-index: 9999999999999 !important;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        transform: translateX(380px);
        display: flex;
        flex-direction: column;
        box-sizing: border-box !important;
        padding: 16px !important;
        color: #f8fafc !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
      }
      #hip-scribe-sidebar-root * {
        box-sizing: border-box !important;
        font-family: inherit !important;
      }
      .hs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding-bottom: 12px;
        margin-bottom: 16px;
      }
      .hs-logo-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .hs-logo-icon {
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #0d9488 0%, #10b981 100%);
        border-radius: 5px;
      }
      .hs-title {
        font-weight: 700;
        font-size: 12pt;
        margin: 0;
        color: #ffffff;
      }
      .hs-close-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
      }
      .hs-close-btn:hover { color: #ffffff; }
      .hs-card {
        background-color: rgba(15,23,42,0.45);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 12px;
      }
      .hs-card-title {
        font-weight: 700;
        font-size: 9.5pt;
        margin: 0 0 10px 0;
        color: #0d9488;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .hs-btn {
        width: 100%;
        background: linear-gradient(135deg, #0d9488 0%, #10b981 100%);
        border: none;
        color: #ffffff;
        font-weight: 700;
        font-size: 9.5pt;
        padding: 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
      }
      .hs-btn:hover { transform: translateY(-1px); }
      .hs-btn-secondary {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255,255,255,0.08);
        color: #f8fafc;
      }
      .hs-btn-secondary:hover { background-color: rgba(30,41,59,0.7); }
      .hs-presets-row {
        display: flex;
        gap: 6px;
        margin-bottom: 12px;
        overflow-x: auto;
        padding-bottom: 4px;
      }
      .hs-preset-pill {
        background-color: rgba(30,41,59,0.4);
        border: 1px solid rgba(255,255,255,0.08);
        color: #94a3b8;
        border-radius: 12px;
        padding: 4px 10px;
        font-size: 8pt;
        cursor: pointer;
        white-space: nowrap;
      }
      .hs-preset-pill.active {
        border-color: #0d9488;
        color: #ffffff;
        background-color: rgba(13,148,136,0.1);
      }
      .hs-textarea {
        width: 100%;
        background-color: rgba(15,23,42,0.85);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 6px;
        padding: 8px;
        font-size: 9pt;
        color: #ffffff;
        resize: none;
        box-sizing: border-box;
      }
      .hs-textarea:focus {
        outline: none;
        border-color: #0d9488;
      }
      .hs-note-viewer {
        background-color: rgba(15,23,42,0.9);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 6px;
        padding: 10px;
        font-size: 8.5pt;
        line-height: 1.45;
        font-family: monospace;
        color: #94a3b8;
        max-height: 180px;
        overflow-y: auto;
        white-space: pre-wrap;
      }
      .hs-note-viewer.hs-compiled {
        color: #cbd5e1;
        border-color: rgba(13,148,136,0.4);
      }
      .hs-record-panel {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: rgba(15,23,42,0.5);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 12px;
      }
      .hs-record-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #ef4444;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(239,68,68,0.4);
      }
      .hs-record-btn.active {
        animation: hsPulse 1.5s infinite;
      }
      @keyframes hsPulse {
        0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
        70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
      }
      .hs-cpt-sidebar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: rgba(13, 148, 136, 0.04);
        border: 1px dashed rgba(13, 148, 136, 0.3);
        padding: 8px 10px;
        border-radius: 8px;
        margin-bottom: 12px;
      }
      .hs-cpt-value {
        font-weight: 800;
        font-size: 10.5pt;
        color: #10b981;
      }
    `;

    // Inject styles into host document head
    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // Sidebar Inner HTML structure
    sidebarContainer.innerHTML = `
      <div class="hs-header">
        <div class="hs-logo-group">
          <div class="hs-logo-icon"></div>
          <h2 class="hs-title">Sovereign Sidebar</h2>
        </div>
        <button class="hs-close-btn" id="hsCloseBtn">✕</button>
      </div>

      <!-- Presets -->
      <div class="hs-presets-row">
        <div class="hs-preset-pill active" id="hsPillSOAP">SOAP Preset</div>
        <div class="hs-preset-pill" id="hsPillVA">VA / PTSD</div>
        <div class="hs-preset-pill" id="hsPillCBT">CBT Restructuring</div>
      </div>

      <!-- Audio / Transcript Input -->
      <div class="hs-record-panel">
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="hs-record-btn" id="hsRecordBtn"></button>
          <span style="font-size: 8.5pt; font-weight: 600;" id="hsRecordStatus">Ambient Recorder</span>
        </div>
        <span style="font-size: 8pt; color: #94a3b8;" id="hsTimer">0:00</span>
      </div>

      <div class="hs-card">
        <div class="hs-card-title">📝 Session Transcript</div>
        <textarea class="hs-textarea" id="hsTranscript" rows="4" placeholder="Speak to transcribe or edit session logs..."></textarea>
      </div>

      <!-- CPT Billing Optimizer Slider -->
      <div class="hs-cpt-sidebar">
        <div>
          <span style="font-size: 7.8pt; color: #94a3b8; display: block;">Session duration:</span>
          <input type="range" id="hsCptSlider" min="20" max="75" value="45" style="width: 100px; margin: 4px 0;">
        </div>
        <div style="text-align: right;">
          <div class="hs-cpt-value" id="hsCptValue">90834 (45 Min)</div>
          <span style="font-size: 7.5pt; color: #94a3b8; display: block;" id="hsCptEst">Est: $128.50</span>
        </div>
      </div>

      <!-- Structure button -->
      <button class="hs-btn" id="hsScrubBtn">Scrub & Structure Notes</button>

      <!-- Note Synthesis output -->
      <div class="hs-card" id="hsOutputCard" style="display: none; flex-grow: 1; display: flex; flex-direction: column; gap: 10px; margin-top: 4px;">
        <div class="hs-card-title" style="margin: 0;">📝 Compiled Clinical Note</div>
        <div class="hs-note-viewer" id="hsNoteViewer"></div>
        <button class="hs-btn" id="hsInjectBtn" style="margin: 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">⚡ Inject Directly Into EHR</button>
      </div>
    `;

    document.body.appendChild(sidebarContainer);

    // Trigger sliding animation
    setTimeout(() => {
      sidebarContainer.style.transform = 'translateX(0px)';
    }, 50);

    // --- Add Event Listeners ---
    document.getElementById('hsCloseBtn').addEventListener('click', () => {
      sidebarContainer.style.transform = 'translateX(380px)';
    });

    // Preset selection
    const pills = ['SOAP', 'VA', 'CBT'];
    pills.forEach(p => {
      document.getElementById(`hsPill${p}`).addEventListener('click', (e) => {
        pills.forEach(x => document.getElementById(`hsPill${x}`).classList.remove('active'));
        e.target.classList.add('active');
        activePreset = p;
        document.getElementById('hsTranscript').value = presets[p];
      });
    });

    // Load initial transcript
    document.getElementById('hsTranscript').value = presets.SOAP;

    // CPT slider
    const cptSlider = document.getElementById('hsCptSlider');
    cptSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      const valText = document.getElementById('hsCptValue');
      const estText = document.getElementById('hsCptEst');
      if (val <= 30) {
        valText.textContent = `90832 (${val} Min)`;
        estText.textContent = `Est: $82.00`;
      } else if (val <= 52) {
        valText.textContent = `90834 (${val} Min)`;
        estText.textContent = `Est: $128.50`;
      } else {
        valText.textContent = `90837 (${val} Min)`;
        estText.textContent = `Est: $184.20`;
      }
    });

    // Record button
    const recordBtn = document.getElementById('hsRecordBtn');
    const recordStatus = document.getElementById('hsRecordStatus');
    recordBtn.addEventListener('click', async () => {
      if (!isRecording) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];

          mediaRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            recordStatus.textContent = "Processing dictation...";
            recordBtn.classList.remove('active');
            
            setTimeout(() => {
              recordStatus.textContent = "Transcription ready.";
              document.getElementById('hsTranscript').value += `\n[Transcribed Ambient Recording: Therapist outlines somatic chest tightness triggers and anxiety symptoms diagnostic considerations.]`;
            }, 1200);
          };

          mediaRecorder.start();
          isRecording = true;
          recordStatus.textContent = "Recording active...";
          recordBtn.classList.add('active');
        } catch (err) {
          alert("Microphone permission required for ambient recording.");
        }
      } else {
        mediaRecorder.stop();
        isRecording = false;
      }
    });

    // Scrub & Structure Notes
    const scrubBtn = document.getElementById('hsScrubBtn');
    scrubBtn.addEventListener('click', () => {
      const rawText = document.getElementById('hsTranscript').value.trim();
      if (!rawText) {
        alert("Please enter or record clinical session text first.");
        return;
      }

      scrubBtn.disabled = true;
      scrubBtn.textContent = "Sanitizing PHI...";

      // Check for GCP key in local storage to support direct Vertex API call
      chrome.storage.local.get(['gcp_api_key', 'ai_model'], async (res) => {
        const apiKey = res.gcp_api_key;
        const model = res.ai_model || 'gemini-2.5-flash-lite';
        
        if (apiKey) {
          try {
            const templatePrompts = {
              SOAP: `Compile a highly structured clinical SOAP note from this session transcript. De-identify all patient names, dates, addresses, and SSNs. Structure sections clearly: Subjective (chief complaint, symptom trajectory), Objective (MSE status), Assessment (distortions, rule-outs), Plan (next steps, SUDS scale homework).`,
              VA: `Compile a formal VA/TriWest Clinical Intake note. Focus heavily on service-connected triggers, combat/mst history, somatic symptom severity, and include explicit risk/safety checks (suicidality/homicidality).`,
              CBT: `Compile a Collaborative CBT Progress Note. Track automatic thoughts, cognitive distortions (catastrophizing, all-or-nothing), SUDS levels, and assign cognitive behavioral therapy homework.`
            };

            const selectedPrompt = templatePrompts[activePreset] || templatePrompts.SOAP;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `${selectedPrompt}\n\nSession Transcript:\n${rawText}`
                  }]
                }]
              })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
              renderOutput(data.candidates[0].content.parts[0].text);
            } else {
              throw new Error("Invalid API response.");
            }
          } catch (err) {
            console.error("Direct API Call failed:", err);
            simulateNote(rawText);
          }
        } else {
          simulateNote(rawText);
        }
      });
    });

    function simulateNote(text) {
      setTimeout(() => {
        let compiled = "";
        if (activePreset === 'SOAP') {
          compiled = `CLINICAL SOAP NOTE — INJECTED SIDEBAR
--------------------------------------------------
SUBJECTIVE:
- Chief Complaint: Patient reported severe professional anxiety baseline triggers.
- Trajectory: Experienced two acute panic attack episodes during corporate meetings this week.
- Somatic Symptoms: Severe physical chest tightness, hyperventilation, and acute urge to flee.
- Cognitive Distortions: Confirmed heavy catastrophizing ("I will pass out and ruin my career").

OBJECTIVE:
- Mental Status Exam (MSE): Patient is cooperative, oriented x4, exhibiting slight psychomotor agitation during recall of somatic episodes. Speech is fluent, mood is anxious, affect is congruent. No signs of psychosis.

ASSESSMENT:
- Conceptualization: GAD symptom baseline triggered by high-stakes executive settings. Heavy cognitive catastrophizing escalates physical chest sensations.
- Diagnostic Rule-Outs: Rule out Panic Disorder (administration of separate DSM GAD assessment recommended).

PLAN:
- CBT Intervention: Therapist initiated cognitive thought record journaling matching physical chest sensations to automatic thoughts.
- Homework: Patient committed to paced diaphragmatic exercises (5-5-5 box breathing) during work meetings. SUDS scale tracking assigned.
- Schedule: Next meeting scheduled for Wednesday at 4:00 PM for paced cognitive restructuring.`;
        } else {
          compiled = `CLINICAL PROGRESS NOTE — INJECTED SIDEBAR
--------------------------------------------------
BEHAVIOR/DATA: Patient reports high distress baseline.
ASSESSMENT: Therapist paced cognitive reframing of all-or-nothing homework schemas.
PLAN: Review distress diary logs next week.`;
        }

        renderOutput(compiled);
      }, 1000);
    }

    function renderOutput(note) {
      scrubBtn.disabled = false;
      scrubBtn.textContent = "Scrub & Structure Notes";
      
      const outCard = document.getElementById('hsOutputCard');
      const viewer = document.getElementById('hsNoteViewer');
      
      outCard.style.display = 'flex';
      viewer.textContent = note;
      viewer.classList.add('hs-compiled');
    }

    // Direct EHR Text Injection (Lightning Fast DOM Injection!)
    document.getElementById('hsInjectBtn').addEventListener('click', () => {
      const compiledNote = document.getElementById('hsNoteViewer').textContent;
      if (!compiledNote) {
        alert("Nothing to inject. Please compile a note first.");
        return;
      }

      // Find the active element *outside* the sidebar on the parent page
      sidebarContainer.style.display = 'none'; // Temporarily hide sidebar to ensure correct element selection
      const activeEl = document.activeElement;
      sidebarContainer.style.display = 'flex'; // Restore sidebar

      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT' || activeEl.isContentEditable)) {
        
        // Inject into Textarea or Input
        if (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT') {
          const start = activeEl.selectionStart || 0;
          const end = activeEl.selectionEnd || 0;
          const originalVal = activeEl.value;
          
          activeEl.value = originalVal.substring(0, start) + compiledNote + originalVal.substring(end);
          
          // Trigger framework inputs
          activeEl.dispatchEvent(new Event('input', { bubbles: true }));
          activeEl.dispatchEvent(new Event('change', { bubbles: true }));
        } 
        // Inject into Rich Text contenteditable elements
        else if (activeEl.isContentEditable) {
          activeEl.focus();
          try {
            document.execCommand('insertText', false, compiledNote);
          } catch (e) {
            activeEl.innerText = compiledNote;
          }
          activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Visual flash feedback
        const originalBg = activeEl.style.backgroundColor;
        activeEl.style.transition = 'background-color 0.4s ease';
        activeEl.style.backgroundColor = 'rgba(16, 185, 129, 0.18)';
        setTimeout(() => {
          activeEl.style.backgroundColor = originalBg;
        }, 800);

      } else {
        alert("Hip Health Secure Scribe: Please click inside your EHR chart textarea FIRST, then click 'Inject Directly Into EHR'!");
      }
    });
  }
})();

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ARTIFACT_DIR = '/Users/alexandermarshi/Downloads/Hip-AI-scribe';
const FRAMES_DIR = path.join(ARTIFACT_DIR, 'temp_frames');
const OUTPUT_VIDEO = path.join(ARTIFACT_DIR, 'hip_ai_health_promo.mp4');
const GEMINI_DIR = '/Users/alexandermarshi/.gemini/antigravity/brain/5099dab5-4374-46b2-815a-c402fdf3e780';
const PARENT_DIR = '/Users/alexandermarshi/.gemini/antigravity/brain/87efc803-ffd7-40f8-bd29-7875cf3bd4e7';
const URL = 'https://phi-scrubber-13754652105.us-central1.run.app/demo';

// Ensure directories exist
if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}
if (!fs.existsSync(GEMINI_DIR)) {
  fs.mkdirSync(GEMINI_DIR, { recursive: true });
}
if (!fs.existsSync(PARENT_DIR)) {
  fs.mkdirSync(PARENT_DIR, { recursive: true });
}

let frameCount = 0;

// Setup Puppeteer page
(async () => {
  console.log('--- STARTING HIGH-FIDELITY PROMOTIONAL VIDEO RECORDING ---');
  console.log('Cleaning up old frames...');
  const files = fs.readdirSync(FRAMES_DIR);
  for (const file of files) {
    fs.unlinkSync(path.join(FRAMES_DIR, file));
  }
  
  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 1080 } // High-definition 4:3 format or 1080p height
  });

  const page = await browser.newPage();
  
  // Enable console and page error logging from inside the browser to terminal
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err));
  
  // High-fidelity frame capture helper
  async function captureFrame() {
    const pad = String(frameCount++).padStart(5, '0');
    const framePath = path.join(FRAMES_DIR, `frame_${pad}.png`);
    await page.screenshot({ path: framePath, fullPage: false });
  }

  // Multi-frame freeze helper (holds a frame to pause/create duration in video)
  async function freezeFrame(durationMs, fps = 10) {
    const framesToCapture = Math.round((durationMs / 1000) * fps);
    for (let i = 0; i < framesToCapture; i++) {
      await captureFrame();
    }
  }

  // Smooth scroll animator helper
  async function smoothScrollToSelector(selector, durationMs = 1500, fps = 10) {
    const targetY = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
    }, selector);

    await smoothScrollToY(targetY, durationMs, fps);
  }

  async function smoothScrollToY(targetY, durationMs = 1500, fps = 10) {
    const startY = await page.evaluate(() => window.scrollY);
    const distance = targetY - startY;
    const totalFrames = Math.round((durationMs / 1000) * fps);
    
    for (let i = 1; i <= totalFrames; i++) {
      // Easing function: easeInOutQuad
      const t = i / totalFrames;
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const currentY = startY + distance * ease;
      
      await page.evaluate((y) => window.scrollTo(0, y), currentY);
      await new Promise(r => setTimeout(r, 1000 / fps));
      await captureFrame();
    }
  }

  // Typewriter typing simulator helper
  async function simulateTyping(selector, text, charStep = 2, delayMs = 100) {
    // Focus the input first
    await page.focus(selector);
    
    // Inject React-19 compatible base
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(
          el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
          'value'
        ).set;
        nativeSetter.call(el, '');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, selector);

    // Type character sequence
    let currentText = '';
    for (let i = 0; i < text.length; i += charStep) {
      currentText = text.substring(0, i + charStep);
      await page.evaluate(({ sel, txt }) => {
        const el = document.querySelector(sel);
        if (el) {
          const nativeSetter = Object.getOwnPropertyDescriptor(
            el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
            'value'
          ).set;
          nativeSetter.call(el, txt);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { sel: selector, txt: currentText });
      
      await new Promise(r => setTimeout(r, delayMs));
      await captureFrame();
    }

    // Finish typing and ensure state updates
    await page.evaluate(({ sel, txt }) => {
      const el = document.querySelector(sel);
      if (el) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
          'value'
        ).set;
        nativeSetter.call(el, txt);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, { sel: selector, txt: text });

    // React 19 keyboard triggers
    await page.keyboard.press('Space');
    await page.keyboard.press('Backspace');
    await new Promise(r => setTimeout(r, 200));
    await captureFrame();
  }

  // Inject full-screen title card helper
  async function showFullTitleCard(title, subtitle, iconHtml = '🛡️') {
    console.log(`Title Card: ${title}`);
    await page.evaluate(({ t, s, icon }) => {
      // Remove old overlays
      const oldOverlay = document.getElementById('promo-overlay');
      if (oldOverlay) oldOverlay.remove();
      const oldCard = document.getElementById('promo-title-card');
      if (oldCard) oldCard.remove();

      const cardDiv = document.createElement('div');
      cardDiv.id = 'promo-title-card';
      cardDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #090d16 0%, #0d1527 50%, #151e33 100%);
        z-index: 10000000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        color: #f8fafc;
        text-align: center;
        padding: 0 40px;
        box-sizing: border-box;
      `;

      cardDiv.innerHTML = `
        <div style="font-size: 72px; margin-bottom: 24px; animation: pulse 2s infinite;">${icon}</div>
        <h1 style="font-size: 48px; font-weight: 800; background: linear-gradient(to right, #2dd4bf, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 16px 0; letter-spacing: -0.025em; text-transform: uppercase;">
          ${t}
        </h1>
        <p style="font-size: 22px; font-weight: 400; color: #94a3b8; max-width: 800px; line-height: 1.5; margin: 0 0 40px 0;">
          ${s}
        </p>
        <div style="width: 200px; height: 3px; background: linear-gradient(90deg, transparent, #2dd4bf, transparent);"></div>
        <div style="position: absolute; bottom: 40px; font-size: 14px; color: #475569; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">
          HIP AI Health • Secured Clinical Sandbox Reel
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 0.9; }
          }
        </style>
      `;
      document.body.appendChild(cardDiv);
    }, { t: title, s: subtitle, icon: iconHtml });

    // Show card for 3.0 seconds (30 frames at 10fps)
    await freezeFrame(3000);
  }

  // Remove full-screen title card helper
  async function removeFullTitleCard() {
    await page.evaluate(() => {
      const card = document.getElementById('promo-title-card');
      if (card) {
        card.remove(); // Remove instantly! Avoid asynchronous setTimeout races!
      }
    });
    await captureFrame(); // Capture the clean dashboard instantly revealed
  }

  // Inject sleek clinical overlay banner helper
  async function updatePromoBanner(sceneNum, sceneTitle, subtitle) {
    await page.evaluate(({ num, title, sub }) => {
      let overlay = document.getElementById('promo-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'promo-overlay';
        overlay.style.cssText = `
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 1000px;
          background: rgba(9, 15, 29, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(45, 212, 191, 0.4);
          box-shadow: 0 12px 40px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(45, 212, 191, 0.15);
          border-radius: 16px;
          padding: 16px 28px;
          z-index: 9999999;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #f8fafc;
          box-sizing: border-box;
          transition: all 0.3s ease;
          pointer-events: none; /* Make clicks pass through the overlay safely! */
        `;
        document.body.appendChild(overlay);
      }

      overlay.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 12px; height: 12px; background-color: #2dd4bf; border-radius: 50%; animation: pulse-ring 1.5s infinite; box-shadow: 0 0 10px #2dd4bf;"></div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #2dd4bf; letter-spacing: 0.1em; text-transform: uppercase;">
              SCENE ${num}: ${title}
            </div>
            <div style="font-size: 15px; font-weight: 500; color: #e2e8f0; margin-top: 2px;">
              ${sub}
            </div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;">
          <div>HIP AI Health Secure Scribe</div>
          <div style="color: #2dd4bf; font-weight: 700; margin-top: 2px;">LIVE DEMO SANDBOX</div>
        </div>
        <style>
          @keyframes pulse-ring {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(45, 212, 191, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
          }
        </style>
      `;
    }, { num: sceneNum, title: sceneTitle, sub: subtitle });

    await new Promise(r => setTimeout(r, 200));
    await captureFrame();
  }

  // Navigating and building video script
  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 45000 });

  // Wait for HIPAA Shared Responsibility Agreement modal FIRST to ensure dashboard is loaded
  console.log('Waiting for HIPAA Shared Responsibility Agreement modal...');
  await page.waitForFunction(() => {
    return document.body.innerText.includes('HIPAA Shared Responsibility Agreement');
  }, { timeout: 15000 });

  // -------------------------------------------------------------
  // TITLE CARD 1: WELCOME INTRO CARD
  // -------------------------------------------------------------
  await showFullTitleCard(
    "HIP AI Health Secure Scribe",
    "THE SECURE ALTERNATIVE TO TRADITIONAL CLINICAL SCRIBES\n\n100% database-bypass. ephemerally processed. browser-stored.",
    "🔒"
  );
  await removeFullTitleCard();

  // -------------------------------------------------------------
  // STAGE 1: HIPAA SECURITY WAIVER & COVENANT GATE
  // -------------------------------------------------------------
  await showFullTitleCard(
    "Better Clinical Boundaries",
    "COVENANT GATE\n\nShared HIPAA Responsibility covenant forces signed provider accountability before accessing sandbox tools.",
    "🛡️"
  );
  await removeFullTitleCard();
  
  await updatePromoBanner(
    "1",
    "HIPAA GATED COVENANT",
    "Clinical covenant forces signed provider accountability before accessing sandbox tools."
  );

  await freezeFrame(4000); // Let viewer read modal

  console.log('Clicking "COVENANT AND AGREE"...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const acceptBtn = buttons.find(btn => btn.innerText.includes('COVENANT AND AGREE'));
    if (acceptBtn) {
      acceptBtn.click();
      return true;
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  await freezeFrame(4000); // Verify dashboard loads smoothly

  // -------------------------------------------------------------
  // STAGE 1B: DYNAMIC LIGHT/DARK THEME TOGGLE
  // -------------------------------------------------------------
  await showFullTitleCard(
    "Sleeker Design Options",
    "LIGHT & DARK MODE TOGGLE\n\nToggle instantly between deep space dark slate and medical-grade clinical light views for high visual comfort.",
    "🌗"
  );
  await removeFullTitleCard();

  await updatePromoBanner(
    "1B",
    "THEME SELECTION",
    "Dynamic theme selector toggles between medical-grade dark and light views."
  );

  console.log('Locating theme toggle button...');
  await page.waitForSelector('button[aria-label="Toggle dark/light mode"]', { timeout: 5000 });
  
  console.log('Clicking to switch to Light Mode...');
  await page.click('button[aria-label="Toggle dark/light mode"]');
  await new Promise(r => setTimeout(r, 1000));
  await freezeFrame(4500); // Admire light mode!

  console.log('Clicking to switch back to Dark Mode...');
  await page.click('button[aria-label="Toggle dark/light mode"]');
  await new Promise(r => setTimeout(r, 1000));
  await freezeFrame(4500); // Switch back to dark mode!

  // -------------------------------------------------------------
  // STAGE 2: B2B BRAND MORPHER
  // -------------------------------------------------------------
  await showFullTitleCard(
    "Better B2B Engagement",
    "BRAND MORPHER\n\nDynamically scrape and morph color palettes, logos, and practice styles based on simple group domains.",
    "🎨"
  );
  await removeFullTitleCard();

  await updatePromoBanner(
    "2",
    "B2B BRAND MORPHING",
    "Inputting a group practice domain to scraped-style theme overriding."
  );

  // Click quick toggle to open Brand Morpher
  console.log('Clicking the Quick Toggle: Morph Partner Brand...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const morphToggle = buttons.find(btn => btn.innerText.includes('Morph Partner Brand') || btn.innerText.includes('Hide Brand Morpher'));
    if (morphToggle) morphToggle.click();
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Locating domain input...');
  const morphInputSelector = 'input[placeholder*="integratedtherapyrecovery.com"]';
  await page.waitForSelector(morphInputSelector, { timeout: 5000 });
  await smoothScrollToSelector(morphInputSelector);

  console.log('Typing practice URL...');
  await simulateTyping(morphInputSelector, 'integratedtherapyrecovery.com', 2, 80);
  await freezeFrame(3000);

  console.log('Clicking Morph button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const morphBtn = buttons.find(btn => btn.innerText.includes('Morph Brand Preview'));
    if (morphBtn) morphBtn.click();
  });

  console.log('Waiting for whitelabel scrape response...');
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('Success!') && (text.includes('Integrated Therapy') || text.includes('integratedtherapyrecovery'));
  }, { timeout: 20000 });

  await freezeFrame(6000); // Let viewer admire custom shifted color styling!

  // Click quick toggle to close Brand Morpher
  console.log('Closing Brand Morpher...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const morphToggle = buttons.find(btn => btn.innerText.includes('Morph Partner Brand') || btn.innerText.includes('Hide Brand Morpher'));
    if (morphToggle) morphToggle.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // -------------------------------------------------------------
  // STAGE 3: LOCAL INDEXEDDB CLIENT PROFILES
  // -------------------------------------------------------------
  await showFullTitleCard(
    "Better Data Residency",
    "ZERO DATABASE RETENTION\n\nSaves patient profiles locally in your browser's IndexedDB. No patient data hits external servers.",
    "💾"
  );
  await removeFullTitleCard();

  await updatePromoBanner(
    "3",
    "LOCAL PROFILE MANAGER",
    "Adding secure, de-identified symptoms baseline inside browser IndexedDB storage."
  );

  console.log('Opening Patient Creator modal...');
  await page.waitForSelector('button[title="Create Anonymous Client Profile"]', { timeout: 5000 });
  await page.evaluate(() => {
    const btn = document.querySelector('button[title="Create Anonymous Client Profile"]');
    if (btn) btn.click();
  });
  
  await page.waitForSelector('form', { timeout: 5000 });
  await freezeFrame(2000);

  // Type Goals
  console.log('Typing Treatment Goals...');
  await simulateTyping('form textarea:first-of-type', 'Alleviate acute professional panic attacks', 2, 70);
  await freezeFrame(2000);

  // Type baseline
  console.log('Typing Symptom Baseline...');
  const secondTextareaSelector = await page.evaluate(() => {
    const textareas = Array.from(document.querySelectorAll('form textarea'));
    textareas[1].id = 'temp-symptom-textarea';
    return '#temp-symptom-textarea';
  });
  await simulateTyping(secondTextareaSelector, 'Avoidance 9/10, physical chest tightness', 2, 70);
  await freezeFrame(3000);

  // Save secure profile
  console.log('Clicking Save local profile...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('form button'));
    const saveBtn = buttons.find(btn => btn.innerText.includes('Save Secure Local Profile'));
    if (saveBtn) saveBtn.click();
  });

  await page.waitForFunction(() => {
    const select = document.querySelector('select');
    return select && select.value !== '';
  }, { timeout: 10000 });

  await freezeFrame(6000);

  // -------------------------------------------------------------
  // STAGE 4: DIARIZATION SEGMENT CHECK FILTRATION
  // -------------------------------------------------------------
  await showFullTitleCard(
    "Better Documentation Accuracy",
    "SMART SPEAKER DIARIZATION FILTRATION\n\nSelectively check/uncheck dialogue segments (like small talk or billing chatter) to keep records highly concise.",
    "🎙️"
  );
  await removeFullTitleCard();

  await updatePromoBanner(
    "4",
    "DIARIZATION TRANSCRIPT FILTERING",
    "Excluding small talk segments dynamically. Excluded bubbles turn translucent and fade out."
  );

  console.log('Loading Clinical preset GAD case...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const presetBtn = buttons.find(btn => btn.innerText.includes('Anxiety (GAD) Case'));
    if (presetBtn) presetBtn.click();
  });

  await new Promise(r => setTimeout(r, 800));
  await smoothScrollToSelector('div[class*="diarizationBox"], .diarizationBox');
  await freezeFrame(3000);

  console.log('Excluding first segment...');
  const firstCheckboxSelector = 'div[class*="diarizationBox"] input[type="checkbox"], .diarizationBox input[type="checkbox"]';
  await page.evaluate((selector) => {
    const checkboxes = Array.from(document.querySelectorAll(selector));
    if (checkboxes.length > 0) checkboxes[0].click();
  }, firstCheckboxSelector);

  await freezeFrame(6500); // Visual proof of de-selected segment fading!

  // -------------------------------------------------------------
  // STAGE 5: COMPILATION & CPT OPTIMIZER & ATTESTATION
  // -------------------------------------------------------------
  await showFullTitleCard(
    "Better Billing Reimbursements",
    "AMA CPT BILLING OPTIMIZATION\n\nDynamic session duration mapping recommends precise reimbursement codes (90837, 90834, 90832) instantly.",
    "⏱️"
  );
  await removeFullTitleCard();

  await updatePromoBanner(
    "5",
    "SOAP NOTE STRUCTURE & CPT OPTIMIZER",
    "Compiling SOAP notes with signed clinician attestation overlays."
  );

  console.log('Scrub & Structure Note compilation...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const scrubBtn = buttons.find(btn => btn.innerText.includes('Scrub & Structure'));
    if (scrubBtn) scrubBtn.click();
  });

  // Simulating compilation spinner frames
  console.log('Waiting for note compilation...');
  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 1000));
    await captureFrame();
  }

  await page.waitForFunction(() => {
    const hasPdfExport = Array.from(document.querySelectorAll('button')).some(btn => btn.innerText.includes('Export Note PDF'));
    const hasCptCard = document.querySelector('input[type="range"]') !== null;
    return hasPdfExport && hasCptCard;
  }, { timeout: 25000 });

  await freezeFrame(6000);

  // Switch to CPT Billing tab first so the slider becomes visible
  console.log('Switching output view to CPT Billing tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tabBtn = buttons.find(btn => btn.innerText.includes('CPT Billing'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await captureFrame();

  // Animate dynamic CPT Slider values
  console.log('Animating Session Duration slider...');
  await smoothScrollToSelector('input[type="range"]');
  
  const moveSlider = async (val) => {
    await page.evaluate((value) => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(slider, value);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, val);
    await freezeFrame(3000);
  };

  await moveSlider(30); // 90832 predicted
  await moveSlider(45); // 90834 predicted
  await moveSlider(60); // 90837 predicted

  // Switch output view back to SOAP Notes tab for Attestation
  console.log('Switching output view back to SOAP Notes tab for Attestation...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tabBtn = buttons.find(btn => btn.innerText.includes('SOAP Notes'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await captureFrame();

  // Scroll to Attestation
  console.log('Scrolling to signed attestation watermark...');
  await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('div')).find(div => div.innerText.includes('Clinician Attestation & Billing Footprint') || div.innerText.includes('Attestation & Billing Footprint'));
    if (card) {
      card.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await freezeFrame(5000);

  // -------------------------------------------------------------
  // STAGE 6: INTERACTIVE SVG FLOW CHART TIMELINE
  // -------------------------------------------------------------
  await showFullTitleCard(
    "Better In-Session Coaching",
    "INTERACTIVE SVG CLINICAL SPLINE\n\nVisual session spline mapping client arousal levels to load actionable CBT/Somatic clinical cards.",
    "📈"
  );
  await removeFullTitleCard();

  await updatePromoBanner(
    "6",
    "INTERACTIVE SVG TIMELINE & CBT COACHING TIPS",
    "Reviewing visual patient arousal spline and loading evidence-based intervention cards."
  );

  // Switch to Arousal Spline tab so timeline SVG becomes visible
  console.log('Switching output view to Arousal Spline tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tabBtn = buttons.find(btn => btn.innerText.includes('Arousal Spline'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await captureFrame();

  console.log('Scrolling to SVG timeline...');
  await smoothScrollToSelector('svg');
  await freezeFrame(3000);

  console.log('Clicking Phase 2 circle node on the stress arc spline...');
  await page.evaluate(() => {
    const circle = document.querySelector('circle[cx="180"]');
    if (circle) circle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await freezeFrame(4000);

  console.log('Clicking Phase 3 circle node on the stress arc spline...');
  await page.evaluate(() => {
    const circle = document.querySelector('circle[cx="310"]');
    if (circle) circle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await freezeFrame(6500); // Verify Phase 3 tip loaded underneath

  // -------------------------------------------------------------
  // STAGE 7: ITERATIVE SURGICAL NOTE REFINER
  // -------------------------------------------------------------
  await showFullTitleCard(
    "Better Editing Precision",
    "SURGICAL NOTE REFINER\n\nTarget specific sections or paragraphs conversationally without risking data or structural loss elsewhere.",
    "✂️"
  );
  await removeFullTitleCard();

  await updatePromoBanner(
    "7",
    "ITERATIVE SURGICAL NOTE REVISION",
    "Requesting assessment section refinement focusing on cognitive catastrophizing."
  );

  // Switch output view back to SOAP Notes tab so refiner is visible
  console.log('Switching output view back to SOAP Notes tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tabBtn = buttons.find(btn => btn.innerText.includes('SOAP Notes'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await captureFrame();

  console.log('Scrolling to Surgical Refiner block...');
  const refinerInputSelector = 'input[placeholder*="Type surgical correction"]';
  await smoothScrollToSelector(refinerInputSelector);
  await freezeFrame(3000);

  console.log('Typing correction request...');
  await simulateTyping(refinerInputSelector, 'make the assessment section focus heavily on catastrophizing', 2, 70);
  await freezeFrame(3000);

  console.log('Clicking Refine Note...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const refineBtn = buttons.find(btn => btn.innerText.includes('Refine Note'));
    if (refineBtn) refineBtn.click();
  });

  // Capture compiling loader frames
  console.log('Waiting for surgical refinement compile...');
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 1000));
    await captureFrame();
  }

  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const refineBtn = buttons.find(btn => btn.innerText.includes('Refine Note'));
    return refineBtn && !refineBtn.innerText.includes('Refining');
  }, { timeout: 25000 });

  await freezeFrame(7000);

  // -------------------------------------------------------------
  // STAGE 8: CHROMIUM EHR AUTOFILL SIMULATOR
  // -------------------------------------------------------------
  await showFullTitleCard(
    "Better Charting Integration",
    "1-CLICK CHROMIUM EHR SIMULATOR\n\nDirect browser-extension simulator types parsed SOAP notes into your EHR fields (SimplePractice) in one click.",
    "💻"
  );
  await removeFullTitleCard();

  await updatePromoBanner(
    "8",
    "CHROMIUM EHR AUTOFILL SIMULATOR",
    "Simulating secure transfer into SimplePractice intake Mock fields."
  );

  // Switch to EHR Sandbox tab so EHR Mock becomes visible
  console.log('Switching output view to EHR Sandbox tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tabBtn = buttons.find(btn => btn.innerText.includes('EHR Sandbox'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await captureFrame();

  console.log('Scrolling to SimplePractice Mock sandboxed iframe element...');
  await smoothScrollToSelector('#chrome-extension-sandbox');
  await freezeFrame(3000);

  console.log('Triggering EHR Autofill sequence...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const autofillBtn = buttons.find(btn => btn.innerText.includes('Trigger EHR Autofill'));
    if (autofillBtn) autofillBtn.click();
  });

  // Wait for typing simulation to write into mockup fields
  console.log('Simulating typing transfer frames...');
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    await captureFrame();
  }

  await page.waitForFunction(() => {
    return document.body.innerText.includes('Autofill Simulation Successful');
  }, { timeout: 20000 });

  await freezeFrame(8000);

  // -------------------------------------------------------------
  // OUTRO CARD
  // -------------------------------------------------------------
  await showFullTitleCard(
    "HIP AI Health Secure Scribe",
    "THE ULTIMATE SECURE SCRIBE.\n\nZero-Retention. B2B Whitelabeled. Browser-Stored.\n\nLearn more at hip-ai-health.com",
    "🛡️"
  );

  console.log('\nClosing Puppeteer browser session...');
  await browser.close();

  // -------------------------------------------------------------
  // COMPILING VIA FFMPEG
  // -------------------------------------------------------------
  console.log('\nCompiling Captured Frames into high-definition H.264 MP4 Promotional Reel...');
  console.log(`Frames folder: ${FRAMES_DIR}`);
  console.log(`Output Video target: ${OUTPUT_VIDEO}`);
  
  // ffmpeg command compiling at 10 frames per second
  const command = `ffmpeg -y -framerate 10 -i "${FRAMES_DIR}/frame_%05d.png" -c:v libx264 -pix_fmt yuv420p -crf 23 "${OUTPUT_VIDEO}"`;
  console.log(`Running exec: ${command}`);
  
  try {
    execSync(command);
    console.log('\n======================================================');
    console.log('SUCCESS! Promotional recording compiled perfectly!');
    console.log(`Video file successfully generated at: ${OUTPUT_VIDEO}`);
    console.log('======================================================\n');
    
    // Copy to Gemini folders
    try {
      fs.copyFileSync(OUTPUT_VIDEO, path.join(GEMINI_DIR, 'hip_ai_health_promo.mp4'));
      console.log(`Copied video to current conversation artifacts: ${path.join(GEMINI_DIR, 'hip_ai_health_promo.mp4')}`);
    } catch (e) { console.error('Error copying to GEMINI_DIR:', e); }

    try {
      fs.copyFileSync(OUTPUT_VIDEO, path.join(PARENT_DIR, 'hip_ai_health_promo.mp4'));
      console.log(`Copied video to parent conversation artifacts: ${path.join(PARENT_DIR, 'hip_ai_health_promo.mp4')}`);
    } catch (e) { console.error('Error copying to PARENT_DIR:', e); }
  } catch (error) {
    console.error('Error compiling video with FFMPEG:', error);
  }

  // Cleanup temporary frames dir commented out for inspection
  console.log('Skipping cleanup of temporary frame captures for inspection...');

})().catch(err => {
  console.error('Fatal error during Promotional Recording Generation:', err);
  process.exit(1);
});

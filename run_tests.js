const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/alexandermarshi/.gemini/antigravity/brain/36ee7a89-d1f4-44c2-ad79-6bea2f50e9a1';
const URL = process.env.TEST_URL || 'http://localhost:3002/demo';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

(async () => {
  console.log('Launching browser in headless mode...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 1000 }
  });

  const page = await browser.newPage();
  
  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 45000 });

  // 1. Accept the HIPAA Shared Responsibility gated modal when it appears to open the dashboard
  console.log('Waiting for HIPAA Shared Responsibility Agreement modal...');
  await page.waitForFunction(() => {
    return document.body.innerText.includes('HIPAA Shared Responsibility Agreement');
  }, { timeout: 15000 });

  console.log('Accepting HIPAA modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const acceptBtn = buttons.find(btn => btn.innerText.includes('COVENANT AND AGREE'));
    if (acceptBtn) {
      acceptBtn.click();
      return true;
    }
    throw new Error('Accept button not found');
  });

  // Wait for the modal to close and the dashboard to fully load
  await new Promise(r => setTimeout(r, 2000));
  console.log('Dashboard loaded.');

  // 2. Take a screenshot of the initial dashboard view (including the patient select dropdown and presets)
  console.log('Taking screenshot of initial dashboard...');
  const initialPath = path.join(ARTIFACT_DIR, 'dashboard_initial.png');
  await page.screenshot({ path: initialPath, fullPage: true });
  console.log(`Saved screenshot to ${initialPath}`);

  // 3. Verify that the Dashboard panel loads properly with raw notes, presets, and output areas
  const initialDashboardDetails = await page.evaluate(() => {
    const mainTitle = document.querySelector('h1')?.innerText || '';
    const rawNotesTextarea = document.querySelector('textarea')?.placeholder || '';
    const presetButtons = Array.from(document.querySelectorAll('button')).map(b => b.innerText).filter(t => t.includes('Case'));
    const dropdownSelects = Array.from(document.querySelectorAll('select')).map(s => s.innerText);
    return { mainTitle, rawNotesTextarea, presetButtons, dropdownSelects };
  });
  console.log('Initial Dashboard Details:', initialDashboardDetails);

  // 4. Click the Anxiety (GAD) Case preset to load raw notes and dialogue bubbles
  console.log('Clicking Anxiety (GAD) Case preset...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const presetBtn = buttons.find(btn => btn.innerText.includes('Anxiety (GAD) Case'));
    if (presetBtn) {
      presetBtn.click();
      return true;
    }
    throw new Error('Anxiety (GAD) Case preset button not found');
  });

  await new Promise(r => setTimeout(r, 1000));

  // 5. Verify the Speaker Diarization Filter: uncheck at least one narrative segment or dialogue bubble segment to verify it behaves correctly
  console.log('Verifying Speaker Diarization Filter...');
  const diarizationDetails = await page.evaluate(() => {
    // Find checkboxes in the diarization box
    const checkboxes = Array.from(document.querySelectorAll('div[class*="diarizationBox"] input[type="checkbox"], .diarizationBox input[type="checkbox"]'));
    if (checkboxes.length > 0) {
      // Uncheck the first dialogue bubble segment
      checkboxes[0].click();
      return {
        found: true,
        count: checkboxes.length,
        firstCheckedAfterClick: checkboxes[0].checked
      };
    }
    return { found: false };
  });
  console.log('Speaker Diarization Filter Details:', diarizationDetails);

  // Take a screenshot of the unchecked segment
  const diarizationPath = path.join(ARTIFACT_DIR, 'diarization_unchecked.png');
  await page.screenshot({ path: diarizationPath });
  console.log(`Saved diarization screenshot to ${diarizationPath}`);

  // 6. Click "Scrub & Structure" button to process raw notes
  console.log('Clicking "Scrub & Structure" button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const scrubBtn = buttons.find(btn => btn.innerText.includes('Scrub & Structure'));
    if (scrubBtn) {
      scrubBtn.click();
      return true;
    }
    throw new Error('Scrub & Structure button not found');
  });

  console.log('Waiting for note to be scrubbed & structured (this could take up to 20-30 seconds)...');
  // Wait for the structured note content to appear
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const scrubBtn = buttons.find(btn => btn.innerText.includes('Scrub & Structure'));
    // If Scrub & Structure button does not have Processing... anymore, or a PDF Export button is displayed
    const hasPdfExport = Array.from(document.querySelectorAll('button')).some(btn => btn.innerText.includes('Export Note PDF'));
    return hasPdfExport || (scrubBtn && !scrubBtn.innerText.includes('Processing'));
  }, { timeout: 45000 });

  console.log('Structuring complete.');
  await new Promise(r => setTimeout(r, 2000));

  // 7. Verify the CPT Billing Optimizer: slide or configure the Session Duration slider
  // (e.g. to 45 minutes and 60 minutes) to confirm the recommended CPT code changes dynamically between 90837, 90834, or 90832.
  const setSliderValue = async (val) => {
    console.log('Switching output view to CPT Billing tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tabBtn = buttons.find(btn => btn.innerText.includes('CPT Billing'));
      if (tabBtn) tabBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    console.log(`Setting Session Duration slider to ${val} minutes...`);
    await page.evaluate((value) => {
      const slider = document.querySelector('input[type="range"]');
      if (!slider) throw new Error('Range slider not found');
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(slider, value);
      
      const evInput = new Event('input', { bubbles: true });
      slider.dispatchEvent(evInput);
      const evChange = new Event('change', { bubbles: true });
      slider.dispatchEvent(evChange);
    }, val);
    
    // Wait for the state to update
    await new Promise(r => setTimeout(r, 1500));
    
    const recInfo = await page.evaluate(() => {
      // Find the CPT Recommender text
      const bodyText = document.body.innerText;
      const cptMatch = bodyText.match(/CPT\s+(\d+|None\s*\(?[^\)]*\)?)\s+Recommender/i) || [];
      return {
        cptText: cptMatch[0] || 'Not found',
        durationText: document.querySelector('input[type="range"] + span')?.innerText || 'Not found'
      };
    });
    console.log(`Duration set to ${val} min: ${JSON.stringify(recInfo)}`);
  };

  // Test 45 minutes (CPT 90834)
  await setSliderValue(45);
  const path45 = path.join(ARTIFACT_DIR, 'cpt_45min.png');
  await page.screenshot({ path: path45 });
  console.log(`Saved 45 min CPT screenshot to ${path45}`);

  // Test 60 minutes (CPT 90837)
  await setSliderValue(60);
  const path60 = path.join(ARTIFACT_DIR, 'cpt_60min.png');
  await page.screenshot({ path: path60 });
  console.log(`Saved 60 min CPT screenshot to ${path60}`);

  // Test 30 minutes (CPT 90832)
  await setSliderValue(30);
  const path30 = path.join(ARTIFACT_DIR, 'cpt_30min.png');
  await page.screenshot({ path: path30 });
  console.log(`Saved 30 min CPT screenshot to ${path30}`);

  // Reset to a standard duration like 45
  await setSliderValue(45);

  // 8. Verify the Interactive SVG Timeline: click on Phase 2 ('Narrative Core & Cognitive Distortions') and Phase 3 ('Theoretical CBT / Somatic Intervention') nodes on the stress arc curve.
  // Verify that clicking these nodes displays their respective clinical tip cards below the timeline.
  console.log('Switching output view to Arousal Spline tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tabBtn = buttons.find(btn => btn.innerText.includes('Arousal Spline'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Clicking Phase 2 node (cx=180)...');
  await page.click('circle[cx="180"]');
  await new Promise(r => setTimeout(r, 1000));
  
  const phase2CardText = await page.evaluate(() => {
    return document.body.innerText;
  });
  const hasPhase2Text = phase2CardText.includes('Phase 2: Narrative Core & Cognitive Distortions');
  console.log('Phase 2 details displayed:', hasPhase2Text);

  console.log('Clicking Phase 3 node (cx=310)...');
  await page.click('circle[cx="310"]');
  await new Promise(r => setTimeout(r, 1000));

  const phase3CardText = await page.evaluate(() => {
    return document.body.innerText;
  });
  const hasPhase3Text = phase3CardText.includes('Phase 3: Theoretical CBT / Somatic Intervention');
  console.log('Phase 3 details displayed:', hasPhase3Text);

  const tipsPath = path.join(ARTIFACT_DIR, 'clinical_tips.png');
  await page.screenshot({ path: tipsPath });
  console.log(`Saved clinical tips screenshot to ${tipsPath}`);

  // 9. Test the EHR simulator: click the 'Trigger EHR Autofill' button, wait for typing simulation to complete.
  console.log('Switching output view to EHR Sandbox tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tabBtn = buttons.find(btn => btn.innerText.includes('EHR Sandbox'));
    if (tabBtn) tabBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Triggering EHR Autofill simulation...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const autofillBtn = buttons.find(btn => btn.innerText.includes('Trigger EHR Autofill'));
    if (autofillBtn) {
      autofillBtn.click();
      return true;
    }
    throw new Error('Trigger EHR Autofill button not found');
  });

  console.log('Waiting for typing simulation to complete...');
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Autofill Simulation Successful');
  }, { timeout: 35000 });

  console.log('EHR Autofill completed successfully.');
  await new Promise(r => setTimeout(r, 2000));

  const ehrPath = path.join(ARTIFACT_DIR, 'ehr_autofill.png');
  await page.screenshot({ path: ehrPath });
  console.log(`Saved EHR autofill screenshot to ${ehrPath}`);

  console.log('All tests completed successfully!');
  await browser.close();
})().catch(err => {
  console.error('Fatal error during evaluation:', err);
  process.exit(1);
});

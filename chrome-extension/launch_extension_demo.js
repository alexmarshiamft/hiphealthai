// launch_extension_demo.js — Launches headful Chrome with the extension fully pre-loaded

const puppeteer = require('puppeteer');
const path = require('path');

async function launch() {
  const extensionPath = '/Users/alexandermarshi/Downloads/Hip-AI-scribe/chrome-extension';
  const mockEhrPath = `file://${path.join(extensionPath, 'mock-ehr.html')}`;

  console.log("--------------------------------------------------");
  console.log("🚀 LAUNCHING SOVEREIGN CHROME EXTENSION SANDBOX");
  console.log("--------------------------------------------------");
  console.log(`Extension Path: ${extensionPath}`);
  console.log(`Mock EHR Page: ${mockEhrPath}`);

  try {
    // Launch Chrome in headful mode with standard viewports and window controls
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    console.log("Chrome instance initiated successfully.");

    // Get the first page (default empty tab)
    const [ehrPage] = await browser.pages();
    
    console.log("Navigating to Mock EHR Portal...");
    await ehrPage.goto(mockEhrPath);
    await ehrPage.bringToFront();

    // Find the loaded Extension ID by checking browser targets
    console.log("Retrieving Extension Identification...");
    const targets = await browser.targets();
    const extensionTarget = targets.find(target => 
      target.type() === 'background_page' || 
      (target.type() === 'service_worker' && target.url().startsWith('chrome-extension://'))
    );

    if (!extensionTarget) {
      console.warn("WARNING: Service worker target not initialized yet. Fetching fallback target...");
    }

    // Determine Extension ID from target URL
    let extensionId = '';
    if (extensionTarget) {
      const url = extensionTarget.url();
      const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
      if (match) {
        extensionId = match[1];
      }
    }

    // Fallback search if not resolved
    if (!extensionId) {
      for (const t of targets) {
        const url = t.url();
        if (url.startsWith('chrome-extension://')) {
          const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
          if (match) {
            extensionId = match[1];
            break;
          }
        }
      }
    }

    if (extensionId) {
      console.log(`SUCCESS: Resolved Extension ID: ${extensionId}`);
      
      // Create a second window/tab to display the Extension Popup directly on the screen
      console.log("Opening Extension Scribe Interface popup...");
      const popupPage = await browser.newPage();
      const popupUrl = `chrome-extension://${extensionId}/popup.html`;
      await popupPage.goto(popupUrl);
      
      console.log(`Popup URL opened: ${popupUrl}`);
      console.log("--------------------------------------------------");
      console.log("🎉 SANDBOX READY!");
      console.log("You can now click around and test note injections live.");
      console.log("Press Ctrl+C in this terminal window to close the browser.");
      console.log("--------------------------------------------------");
    } else {
      console.warn("Unable to resolve Extension ID programmatically.");
      console.log("Please click the extensions icon (puzzle piece) in the Chrome toolbar manually to test.");
    }

  } catch (err) {
    console.error("FAILED TO INITIATE BROWSER SANDBOX:", err);
    process.exit(1);
  }
}

launch();

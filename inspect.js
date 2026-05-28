const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/alexandermarshi/.gemini/antigravity/brain/87efc803-ffd7-40f8-bd29-7875cf3bd4e7';
const URL = process.env.TEST_URL || 'http://localhost:3002/';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    console.log(`[Browser Console ${msg.type()}]: ${msg.text()}`);
  });

  // Capture network requests/responses
  const networkRequests = [];
  const failedRequests = [];
  page.on('requestfailed', request => {
    const errorText = request.failure().errorText;
    failedRequests.push({
      url: request.url(),
      error: errorText
    });
    console.error(`[Network Fail]: ${request.url()} - ${errorText}`);
  });

  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      failedRequests.push({
        url: response.url(),
        status: status,
        statusText: response.statusText()
      });
      console.error(`[Network Response Error ${status}]: ${response.url()}`);
    }
    networkRequests.push({
      url: response.url(),
      status: status,
      contentType: response.headers()['content-type']
    });
  });

  console.log(`Navigating to ${URL}...`);
  try {
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (err) {
    console.warn('Navigation timeout or networkidle0 not met. Proceeding...', err.message);
  }

  // Sleep a bit more to let any dynamic elements/videos initialize
  await new Promise(r => setTimeout(r, 3000));

  console.log('Evaluating visual structure...');
  const pageDetails = await page.evaluate(() => {
    const details = {
      title: document.title,
      htmlLang: document.documentElement.lang,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content || 'none',
      bodyScrollWidth: document.body.scrollWidth,
      bodyScrollHeight: document.body.scrollHeight,
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight,
      hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
      videoElements: [],
      overlappingElements: [],
      unusualStyles: []
    };

    // Inspect video elements
    const videos = Array.from(document.querySelectorAll('video'));
    videos.forEach((video, index) => {
      const rect = video.getBoundingClientRect();
      details.videoElements.push({
        index,
        src: video.src,
        currentSrc: video.currentSrc,
        autoplay: video.autoplay,
        loop: video.loop,
        muted: video.muted,
        playsInline: video.playsInline,
        paused: video.paused,
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error ? { code: video.error.code, message: video.error.message } : null,
        style: {
          position: window.getComputedStyle(video).position,
          zIndex: window.getComputedStyle(video).zIndex,
          top: window.getComputedStyle(video).top,
          left: window.getComputedStyle(video).left,
          width: window.getComputedStyle(video).width,
          height: window.getComputedStyle(video).height,
          objectFit: window.getComputedStyle(video).objectFit,
          opacity: window.getComputedStyle(video).opacity,
          display: window.getComputedStyle(video).display
        },
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }
      });
    });

    // Check for overlapping absolute elements or major sections
    const allElements = Array.from(document.querySelectorAll('div, section, header, footer, main'));
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.position === 'absolute' || style.position === 'fixed') {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          details.unusualStyles.push({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            position: style.position,
            zIndex: style.zIndex,
            top: style.top,
            left: style.left,
            width: style.width,
            height: style.height,
            opacity: style.opacity
          });
        }
      }
    });

    // Let's identify the header, hero text, and if they overlap with anything
    const h1 = document.querySelector('h1');
    if (h1) {
      const h1Rect = h1.getBoundingClientRect();
      details.h1 = {
        text: h1.innerText,
        rect: { x: h1Rect.x, y: h1Rect.y, width: h1Rect.width, height: h1Rect.height },
        style: {
          color: window.getComputedStyle(h1).color,
          fontSize: window.getComputedStyle(h1).fontSize,
          fontWeight: window.getComputedStyle(h1).fontWeight,
          textAlign: window.getComputedStyle(h1).textAlign,
          zIndex: window.getComputedStyle(h1).zIndex
        }
      };
    }

    return details;
  });

  console.log('Taking desktop screenshots...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_landing.png'), fullPage: false });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_landing_full.png'), fullPage: true });

  console.log('Taking mobile screenshots...');
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_landing.png'), fullPage: false });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_landing_full.png'), fullPage: true });

  console.log('Writing visual diagnostic report data...');
  const reportData = {
    url: URL,
    timestamp: new Date().toISOString(),
    pageDetails,
    consoleLogs,
    failedRequests,
    networkRequestsSummary: {
      total: networkRequests.length,
      failed: failedRequests.length
    }
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'visual_diagnostic_report.json'),
    JSON.stringify(reportData, null, 2)
  );

  console.log('Finished successfully!');
  await browser.close();
})().catch(err => {
  console.error('Fatal error during inspection:', err);
  process.exit(1);
});

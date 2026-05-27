const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Paths
const mdPath = '/Users/alexandermarshi/.gemini/antigravity/brain/87efc803-ffd7-40f8-bd29-7875cf3bd4e7/comparative_analysis_simplepractice.md';
const workspacePdfPath = '/Users/alexandermarshi/Downloads/Hip-AI-scribe/comparative_analysis_scribe.pdf';
const artifactPdfPath = '/Users/alexandermarshi/.gemini/antigravity/brain/87efc803-ffd7-40f8-bd29-7875cf3bd4e7/comparative_analysis_scribe.pdf';

function markdownToHtml(mdText) {
  const lines = mdText.split('\n');
  let html = '';
  let inList = false;
  let listType = ''; // 'ul' or 'ol'
  let inTable = false;
  let tableRows = [];
  let inAlert = false;
  let alertType = ''; // 'tip', 'warning', 'note', 'important', 'caution'
  let alertLines = [];

  function closeList() {
    if (inList) {
      html += `</${listType}>\n`;
      inList = false;
    }
  }

  function closeTable() {
    if (inTable && tableRows.length > 0) {
      html += '<div class="table-container"><table>\n';
      let isHeader = true;
      for (let r of tableRows) {
        // Skip separator row
        if (r.every(cell => cell.trim().match(/^:?-+:?$/))) {
          continue;
        }
        html += '  <tr>\n';
        for (let cell of r) {
          const content = parseInline(cell.trim());
          if (isHeader) {
            html += `    <th>${content}</th>\n`;
          } else {
            html += `    <td>${content}</td>\n`;
          }
        }
        html += '  </tr>\n';
        isHeader = false;
      }
      html += '</table></div>\n';
      inTable = false;
      tableRows = [];
    }
  }

  function closeAlert() {
    if (inAlert && alertLines.length > 0) {
      const alertContent = parseInline(alertLines.join(' '));
      let icon = 'ℹ️';
      let title = 'Note';
      
      if (alertType === 'tip') { icon = '💡'; title = 'Tip'; }
      else if (alertType === 'warning') { icon = '⚠️'; title = 'Warning'; }
      else if (alertType === 'important') { icon = '🛡️'; title = 'Important'; }
      else if (alertType === 'caution') { icon = '🚨'; title = 'Caution'; }
      
      html += `<div class="alert alert-${alertType}">\n`;
      html += `  <div class="alert-icon">${icon}</div>\n`;
      html += `  <div class="alert-content"><strong>${title}:</strong> ${alertContent}</div>\n`;
      html += `</div>\n`;
      inAlert = false;
      alertLines = [];
    }
  }

  function parseInline(text) {
    // Bold: **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Code ticks: `code`
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle empty lines
    if (line.trim() === '') {
      closeList();
      closeTable();
      closeAlert();
      continue;
    }

    // Handle horizontal rules
    if (line.trim() === '---') {
      closeList();
      closeTable();
      closeAlert();
      html += '<hr />\n';
      continue;
    }

    // Handle Alerts: > [!TIP] or > text
    if (line.trim().startsWith('>')) {
      closeList();
      closeTable();
      inAlert = true;
      const content = line.trim().substring(1).trim();
      const match = content.match(/^\[!(TIP|WARNING|NOTE|IMPORTANT|CAUTION)\]$/i);
      if (match) {
        alertType = match[1].toLowerCase();
      } else {
        alertLines.push(content);
      }
      continue;
    } else {
      closeAlert();
    }

    // Handle Tables: lines starting and ending with |
    if (line.trim().startsWith('|')) {
      closeList();
      inTable = true;
      const cols = line.split('|').map(s => s.trim());
      // Shift out empty first and last elements due to split
      if (cols[0] === '') cols.shift();
      if (cols[cols.length - 1] === '') cols.pop();
      tableRows.push(cols);
      continue;
    } else {
      closeTable();
    }

    // Handle Headers: #, ##, ###
    if (line.trim().startsWith('#')) {
      closeList();
      const level = line.match(/^#+/)[0].length;
      const text = line.substring(level).trim();
      const parsedText = parseInline(text);
      if (level === 1) {
        // Automatically inject fresh page breaks before H1 page titles
        html += `<h1 class="page-title major-section">${parsedText}</h1>\n`;
      } else {
        html += `<h${level}>${parsedText}</h${level}>\n`;
      }
      continue;
    }

    // Handle Ordered Lists: 1. or 2.
    const numListMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (numListMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        html += `<ol>\n`;
      }
      const text = numListMatch[3];
      const parsedText = parseInline(text);
      html += `  <li>${parsedText}</li>\n`;
      continue;
    }

    // Handle Bullet Lists: - or *
    const listMatch = line.match(/^(\s*)([-*])\s+(.*)/);
    if (listMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        html += `<ul>\n`;
      }
      const indent = listMatch[1].length;
      const text = listMatch[3];
      const parsedText = parseInline(text);
      html += `  <li class="${indent > 0 ? 'indented-list-item' : ''}">${parsedText}</li>\n`;
      continue;
    }

    // Standard paragraphs
    const parsedLine = parseInline(line.trim());
    html += `<p>${parsedLine}</p>\n`;
  }

  // Cleanup at end
  closeList();
  closeTable();
  closeAlert();

  return html;
}

async function generate() {
  try {
    console.log("Reading Comparative Analysis Markdown file...");
    const mdText = fs.readFileSync(mdPath, 'utf8');

    console.log("Parsing Markdown to clean HTML...");
    const bodyHtml = markdownToHtml(mdText);

    // Build the final executive template with high-fidelity styles
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Comparative Analysis: Clinical Scribe Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #0d9488;
      --primary-dark: #0f766e;
      --primary-light: #ccfbf1;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-100: #f1f5f9;
      --slate-50: #f8fafc;
      --border: #e2e8f0;
      --accent: #2a8b8b;
      --gold: #d97706;
      --gold-light: #fef3c7;
    }

    @page {
      size: A4;
      margin: 25mm 20mm 25mm 20mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: var(--slate-600);
      }
    }

    body {
      font-family: 'Inter', sans-serif;
      color: var(--slate-800);
      background-color: #ffffff;
      line-height: 1.62;
      font-size: 9.8pt;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
    }

    /* Cover Page */
    .cover-page {
      page-break-after: always;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      padding: 25px 0;
      position: relative;
    }

    /* Vertical Teal Banner Stripe on Left margin of Cover Page */
    .cover-stripe {
      position: absolute;
      left: -20mm;
      top: -25mm;
      bottom: -25mm;
      width: 8px;
      background: linear-gradient(180deg, var(--primary-dark) 0%, var(--primary) 100%);
    }

    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--slate-100);
      padding-bottom: 15px;
    }

    .cover-logo {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 18pt;
      letter-spacing: 0.1em;
      color: var(--primary-dark);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .cover-logo::before {
      content: "";
      width: 14px;
      height: 14px;
      background-color: var(--primary);
      border-radius: 3px;
      display: inline-block;
    }

    .cover-badge {
      font-size: 8pt;
      font-weight: 700;
      background-color: var(--primary-light);
      color: var(--primary-dark);
      padding: 4px 12px;
      border-radius: 4px;
      letter-spacing: 0.08em;
    }

    .cover-body {
      margin-top: 35px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 22px;
    }

    .cover-title-group {
      margin-bottom: 5px;
    }

    .cover-title {
      font-family: 'Outfit', sans-serif;
      font-size: 30pt;
      font-weight: 800;
      color: var(--slate-900);
      line-height: 1.12;
      margin: 0 0 12px 0;
      letter-spacing: -0.015em;
    }

    .cover-subtitle {
      font-size: 11.5pt;
      font-weight: 400;
      color: var(--slate-600);
      margin: 0;
      max-width: 95%;
      line-height: 1.5;
    }

    /* Cover Page Executive Verdict Panel */
    .conclusion-panel {
      background: linear-gradient(135deg, rgba(13, 148, 136, 0.02) 0%, rgba(13, 148, 136, 0.05) 100%);
      border: 1px solid rgba(13, 148, 136, 0.5);
      border-left: 6px solid var(--primary-dark);
      border-radius: 12px;
      padding: 22px;
      margin: 12px 0;
      box-shadow: 0 4px 24px rgba(13, 148, 136, 0.04);
    }

    .conclusion-header {
      font-family: 'Outfit', sans-serif;
      font-size: 11.5pt;
      font-weight: 800;
      color: var(--primary-dark);
      letter-spacing: 0.06em;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .conclusion-text {
      font-size: 9.2pt;
      line-height: 1.55;
      color: var(--slate-800);
      margin-bottom: 16px;
      text-align: justify;
    }

    .conclusion-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .stat-box {
      background-color: #ffffff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 10px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.015);
      transition: border-color 0.2s;
    }

    .stat-box:hover {
      border-color: var(--primary);
    }

    .stat-value {
      font-family: 'Outfit', sans-serif;
      font-size: 14pt;
      font-weight: 800;
      color: var(--primary-dark);
      display: block;
    }

    .stat-label {
      font-size: 7.5pt;
      font-weight: 600;
      color: var(--slate-600);
      display: block;
      margin-top: 4px;
      line-height: 1.25;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .cover-features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 5px;
    }

    .cover-feature-pill {
      background-color: var(--slate-50);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 8.5pt;
      font-weight: 600;
      color: var(--slate-800);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cover-feature-pill::before {
      content: "✓";
      color: var(--primary);
      font-weight: 900;
      font-size: 9.5pt;
    }

    .cover-footer {
      border-top: 2px solid var(--slate-100);
      padding-top: 15px;
      font-size: 8.5pt;
      color: var(--slate-600);
      display: flex;
      justify-content: space-between;
    }

    /* Core Typographies */
    h1, h2, h3, h4 {
      font-family: 'Outfit', sans-serif;
      color: var(--slate-900);
      font-weight: 700;
      page-break-after: avoid;
    }

    h1.page-title {
      font-size: 19pt;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 8px;
      margin-top: 30px;
      margin-bottom: 20px;
      color: var(--slate-900);
    }

    /* Page Breaks for Executive Flow */
    .major-section {
      page-break-before: always;
    }

    h2 {
      font-size: 13.5pt;
      border-bottom: 1px solid var(--border);
      padding-bottom: 5px;
      margin-top: 25px;
      margin-bottom: 12px;
      color: var(--primary-dark);
    }

    h3 {
      font-size: 11pt;
      margin-top: 18px;
      margin-bottom: 8px;
      color: var(--slate-900);
    }

    p {
      margin-top: 0;
      margin-bottom: 12px;
      text-align: justify;
      color: var(--slate-800);
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 14px;
      padding-left: 20px;
    }

    li {
      margin-bottom: 6px;
    }

    li strong {
      color: var(--slate-900);
    }

    .indented-list-item {
      margin-left: 20px;
      list-style-type: circle;
    }

    hr {
      border: 0;
      border-top: 1px solid var(--border);
      margin: 25px 0;
      page-break-after: avoid;
    }

    /* High-Fidelity Tables */
    .table-container {
      margin: 18px 0 25px 0;
      page-break-inside: avoid;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      text-align: left;
    }

    th {
      background-color: var(--slate-900);
      color: #ffffff;
      font-weight: 600;
      padding: 10px 12px;
      border: 1px solid var(--slate-900);
      font-family: 'Outfit', sans-serif;
      font-size: 8.8pt;
      letter-spacing: 0.02em;
    }

    td {
      padding: 10px 12px;
      border: 1px solid var(--border);
      vertical-align: top;
      line-height: 1.45;
    }

    tr:nth-child(even) td {
      background-color: var(--slate-50);
    }

    /* Highlight Column or Winner cells */
    td strong {
      color: var(--slate-900);
    }

    /* Make Winner column values stand out with thin success tint */
    td:last-child {
      font-weight: 600;
      color: var(--primary-dark);
      background-color: rgba(13, 148, 136, 0.015);
    }

    tr:nth-child(even) td:last-child {
      background-color: rgba(13, 148, 136, 0.03);
    }

    /* Styling Alert boxes Strategic blocks */
    .alert {
      background-color: var(--slate-50);
      border-left: 4px solid var(--primary);
      border-radius: 6px;
      padding: 12px 18px;
      margin: 18px 0;
      display: flex;
      gap: 14px;
      page-break-inside: avoid;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
      border: 1px solid var(--border);
      border-left-width: 5px;
    }

    .alert-tip {
      border-left-color: #10b981;
      background-color: rgba(16, 185, 129, 0.02);
      border-top-color: rgba(16, 185, 129, 0.08);
      border-right-color: rgba(16, 185, 129, 0.08);
      border-bottom-color: rgba(16, 185, 129, 0.08);
    }

    .alert-warning {
      border-left-color: #f59e0b;
      background-color: rgba(245, 158, 11, 0.02);
      border-top-color: rgba(245, 158, 11, 0.08);
      border-right-color: rgba(245, 158, 11, 0.08);
      border-bottom-color: rgba(245, 158, 11, 0.08);
    }

    .alert-important {
      border-left-color: var(--primary-dark);
      background-color: rgba(13, 148, 136, 0.02);
      border-top-color: rgba(13, 148, 136, 0.08);
      border-right-color: rgba(13, 148, 136, 0.08);
      border-bottom-color: rgba(13, 148, 136, 0.08);
    }

    .alert-caution {
      border-left-color: #ef4444;
      background-color: rgba(239, 68, 68, 0.02);
      border-top-color: rgba(239, 68, 68, 0.08);
      border-right-color: rgba(239, 68, 68, 0.08);
      border-bottom-color: rgba(239, 68, 68, 0.08);
    }

    .alert-icon {
      font-size: 15pt;
      line-height: 1.1;
    }

    .alert-content {
      font-size: 9pt;
      color: var(--slate-700);
      line-height: 1.5;
    }

    .inline-code {
      font-family: monospace;
      background-color: var(--slate-100);
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 8.2pt;
      color: var(--slate-900);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    /* Print Footer Stamps */
    .footer-stamp {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      font-size: 7.5pt;
      color: var(--slate-600);
      display: flex;
      justify-content: space-between;
      border-top: 1px solid var(--border);
      padding-top: 8px;
      margin-top: 30px;
      font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-stripe"></div>
    <div class="cover-header">
      <div class="cover-logo">HIP AI HEALTH</div>
      <div class="cover-badge">ENTERPRISE EVALUATION REPORT</div>
    </div>
    
    <div class="cover-body">
      <div class="cover-title-group">
        <div class="cover-title">Clinical Scribe Platform<br>Comparative Analysis</div>
        <div class="cover-subtitle">
          An executive and technical evaluation of SimplePractice's AI Note Taker vs. the sovereign local-first architecture of HIP AI Health Secure Scribe.
        </div>
      </div>

      <!-- ULTIMATE CONCLUSION COVER CARD -->
      <div class="conclusion-panel">
        <div class="conclusion-header">🏆 THE ULTIMATE CONCLUSION</div>
        <div class="conclusion-text">
          <strong>HIP AI Health Secure Scribe</strong> is the undisputed functional and financial winner for Integrated Therapy & Recovery (ITR). By transitioning from SimplePractice's per-seat cloud add-on to HIP AI's flat group platform combined with standard Google Cloud Vertex AI APIs, the practice achieves total privacy sovereignty and massive bottom-line savings:
        </div>
        <div class="conclusion-stats">
          <div class="stat-box">
            <span class="stat-value">$1,793.88 / yr</span>
            <span class="stat-label">Bottom-Line Savings (30.5% Saved)</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">0% Data Storage</span>
            <span class="stat-label">100% Client-Side Local Data Sovereignty</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">100% Private</span>
            <span class="stat-label">Zero Vendor AI Model Training Policy</span>
          </div>
        </div>
      </div>

      <div class="cover-features">
        <div class="cover-feature-pill">Ambient Telehealth & Dictation Modes</div>
        <div class="cover-feature-pill">100% Database-Bypass IndexedDB Sandbox</div>
        <div class="cover-feature-pill">Standard Clinical Frameworks (SOAP/DAP)</div>
        <div class="cover-feature-pill">Ephemeral In-Memory Prompt Processing</div>
        <div class="cover-feature-pill">Paid Vertex AI GCP BAA Integration</div>
        <div class="cover-feature-pill">Zero Vendor AI Model Training Policy</div>
      </div>
    </div>
    
    <div class="cover-footer">
      <div><strong>Evaluated Practice:</strong> Integrated Therapy & Recovery (ITR) — 14 Clinicians</div>
      <div><strong>Date of Issue:</strong> May 26, 2026</div>
    </div>
  </div>

  <!-- Document Body Content -->
  <div class="document-content">
    ${bodyHtml}
  </div>

  <!-- HIPAA Compliance footer stamp on print -->
  <div class="footer-stamp">
    <div>CONFIDENTIAL • SECURE CLINICAL PIPELINE WHITE PAPER</div>
    <div>BAA SECURED UNDER 45 CFR § 164.504(e)</div>
  </div>

</body>
</html>
    `;

    console.log("Launching Puppeteer to generate high-fidelity PDF...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    console.log("Setting HTML content into Puppeteer session...");
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    console.log("Rendering PDF page layouts (A4, print backgrounds, margins)...");
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '25mm',
        bottom: '25mm',
        left: '20mm',
        right: '20mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: #64748b; width: 100%; padding: 0 20mm; box-sizing: border-box; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;">
          <span>HIPAA COMPLIANCE & EVALUATION REPORT</span>
          <span style="font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.05em;">HIP AI Health Secure Scribe</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-family: 'Inter', sans-serif; font-size: 7.5pt; color: #64748b; width: 100%; padding: 0 20mm; box-sizing: border-box; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 10px;">
          <span>HIPAA Protected Clinical Evaluation • Integrated Therapy & Recovery</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });

    console.log(`Writing PDF to workspace at: ${workspacePdfPath}`);
    fs.writeFileSync(workspacePdfPath, pdfBuffer);

    console.log(`Writing PDF to artifacts at: ${artifactPdfPath}`);
    fs.writeFileSync(artifactPdfPath, pdfBuffer);

    await browser.close();
    console.log("SUCCESS: Upgraded premium PDF generated perfectly!");
  } catch (err) {
    console.error("ERROR GENERATING PDF:", err);
    process.exit(1);
  }
}

generate();

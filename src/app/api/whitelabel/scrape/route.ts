import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  let url = '';
  try {
    const body = await req.json();
    url = body.url || '';
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Add protocol if missing
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    console.info(`[WHITELABEL_SCRAPE] Scraping target website: ${targetUrl}`);

    // Fetch the target webpage content
    let htmlContent = '';
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      htmlContent = await response.text();
    } catch (fetchErr) {
      console.error('[WHITELABEL_SCRAPE] Error fetching HTML:', fetchErr);
      // Let's return a friendly placeholder or fallback if the website blocks direct requests
      // This is a B2B sales dashboard, so let's allow Gemini to synthesize branding from just the domain name if fetching fails!
    }

    // If fetch failed or returned empty, we fallback to a synthesized version from the domain name
    const domainName = targetUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0];

    // Clean up the HTML to fit within prompt tokens (keep title, head, meta tags, and first 4000 characters of body)
    let contentToAnalyze = `Domain: ${domainName}\n\n`;
    if (htmlContent) {
      // Extract head content
      const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      const headSnippet = headMatch ? headMatch[1] : '';

      // Strip script and style tags to save space
      const cleanHead = headSnippet
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

      // Get first part of body
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let bodySnippet = bodyMatch ? bodyMatch[1] : htmlContent;
      // Strip script/style and take first 8000 characters
      bodySnippet = bodySnippet
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ') // Strip tags
        .replace(/\s+/g, ' ') // Clean spacing
        .substring(0, 8000);

      contentToAnalyze += `Head Metadata:\n${cleanHead}\n\nBody Text (Snippet):\n${bodySnippet}`;
    } else {
      contentToAnalyze += `(No HTML fetched. Synthesize professional branding based entirely on the domain name '${domainName}' for an outpatient mental health or clinical practice).`;
    }

    // Initialize Google Gen AI SDK for Vertex AI
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || 'hiphealthai',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    const systemPrompt = `You are a professional B2B design director and branding engineer specializing in clinical healthcare software whitelabel customization.
Your job is to analyze website HTML snippets/domain names and synthesize a gorgeous, premium, highly cohesive whitelabel branding configuration.

You MUST return a single JSON object matching the following structure:
{
  "practiceName": "Name of the practice (e.g. Integrated Therapy and Recovery)",
  "primaryColor": "A premium, sophisticated HEX color (e.g. #1f6b6b or similar rich theme color matching their site)",
  "secondaryColor": "A complementary HEX accent color that contrasts beautifully (e.g. #10b981)",
  "backgroundColor": "A very dark modern background HEX color (must support glassmorphism, e.g. #090e16 or #0d1520 or #0b131a for maximum luxury/premium dark-mode styling)",
  "logoText": "Short, uppercase text to act as their platform logo (e.g. ITR SECURE SCRIBE)",
  "slogan": "A customized clinical subheading showing their specialties (e.g. Outpatient EMDR & trauma recovery scribe portal)",
  "presets": [
    "Preset 1 (A professional clinical case summary representing their specific practice areas, e.g., 'Trauma Recovery (EMDR) Narrative')",
    "Preset 2 (Another practice-specific case, e.g. 'Generalized Anxiety & Catastrophizing CBT')",
    "Preset 3 (e.g. 'PTSD & Flashback Coping Intake')"
  ]
}

Ensure colors meet standard accessibility contrast ratios on dark mode. Primary color should look vibrant but professional. Secondary color should pop. Background color must be a very dark theme (e.g. HSL tailored charcoal, dark slate, deep indigo-black).

Return ONLY the raw JSON string. Do not wrap it in markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: contentToAnalyze }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    });

    const resultText = response.text?.trim() || '{}';
    let parsedBranding = JSON.parse(resultText);

    // Provide default fallback values if any keys are missing or parsing fails
    parsedBranding = {
      practiceName: parsedBranding.practiceName || domainName,
      primaryColor: parsedBranding.primaryColor || '#1f6b6b',
      secondaryColor: parsedBranding.secondaryColor || '#10b981',
      backgroundColor: parsedBranding.backgroundColor || '#090d16',
      logoText: parsedBranding.logoText || `${domainName.toUpperCase()} SCRIBE`,
      slogan: parsedBranding.slogan || 'Custom secure B2B EHR Autofill Scribe Sandbox',
      presets: parsedBranding.presets || [
        'Anxiety (GAD) Case & Rapid Speech Summary',
        'Depression (MDD) Presets Intake Form',
        'PTSD & Narrative Trauma Therapy Summary'
      ]
    };

    console.info(`[WHITELABEL_SCRAPE] Successfully generated branding for: ${parsedBranding.practiceName}`);

    return NextResponse.json(parsedBranding);
  } catch (err) {
    const error = err as Error;
    console.error('[WHITELABEL_SCRAPE] Error or Gemini offline, falling back to local synthesis:', error);
    
    const domainName = url.trim().replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    const practiceName = domainName.includes('integratedtherapyrecovery') 
      ? 'Integrated Therapy & Recovery'
      : domainName.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

    const fallbackBranding = {
      practiceName,
      primaryColor: '#1f6b6b',
      secondaryColor: '#10b981',
      backgroundColor: '#090d16',
      logoText: domainName.includes('integratedtherapyrecovery') 
        ? 'ITR SECURE SCRIBE'
        : `${domainName.split('.')[0].toUpperCase()} SCRIBE`,
      slogan: domainName.includes('integratedtherapyrecovery')
        ? 'Trauma-informed EMDR & outpatient clinical recovery portal'
        : 'Enterprise custom B2B EHR Autofill Scribe Sandbox',
      presets: [
        'Anxiety (GAD) Case & Rapid Cognitive Restructuring',
        'Depression (MDD) Coping & Muscular Somatic Preset',
        'Narrative Trauma (PTSD) & EMDR Timeline Processing'
      ]
    };
    return NextResponse.json(fallbackBranding);
  }
}

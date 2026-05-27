import { GoogleGenAI } from '@google/genai';

async function test() {
  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || '',
      location: 'us-central1',
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello',
    });
    console.log("SUCCESS:");
    console.log(response.text);
  } catch (e) {
    console.error("ERROR:");
    console.error(e);
  }
}

test();

import { GoogleGenAI } from '@google/genai';

async function listModels() {
  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || 'hiphealthai',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    console.log("Fetching models...");
    const response = await ai.models.get({
        model: 'gemini-3.5-flash'
    });
    console.log("Model Info:", response);

  } catch (e) {
    console.error("ERROR:");
    console.error(e);
  }
}

listModels();

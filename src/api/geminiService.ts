import { GoogleGenAI } from '@google/genai';

const API_KEY = 'AIzaSyB2QwC_uEBloX74xycwADW6Xf6Vp7qw8bM';

// Initialize the client with the API Key
const ai = new GoogleGenAI({
  apiKey: API_KEY,
});

export const generateCityImage = async (cityName: string): Promise<string | null> => {
  try {
    const prompt = `Create a beautiful, high-quality wide cinematic photo of the city of ${cityName}. Realistic style, showing architectural landmarks and atmosphere.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Standard experimental model, often more accessible
      contents: prompt,
    });

    // Extract image from parts
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    // Fallback to a high-quality city photo service if AI generation doesn't return an image
    // Using LoremFlickr which is more reliable for keyword-based fallbacks
    return `https://loremflickr.com/1024/768/${encodeURIComponent(cityName)},city,landscape/all`;
  } catch (error: any) {
    console.error('Gemini Generation Error:', error);
    // Fallback URL even on error
    return `https://loremflickr.com/1024/768/${encodeURIComponent(cityName)},city,landscape/all`;
  }
};

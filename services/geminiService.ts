
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const generateImageFromBase = async (baseImageBase64: string, prompt: string): Promise<string> => {
  const ai = getAIClient();
  
  // Extract pure base64 if it has the prefix
  const base64Data = baseImageBase64.split(',')[1] || baseImageBase64;
  const mimeType = baseImageBase64.split(';')[0].split(':')[1] || 'image/png';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Based on the attached base image, create a high-quality cover image. Incorporate the following theme/idea: "${prompt}". Maintain a consistent artistic style with the base image but make it unique to the prompt.`,
          },
        ],
      },
    });

    let imageUrl = '';
    const candidates = response.candidates;
    
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image was generated in the response.");
    }

    return imageUrl;
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

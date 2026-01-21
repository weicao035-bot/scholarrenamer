
import { GoogleGenAI, Type } from "@google/genai";
import { PaperMetadata } from "../types";

export const extractMetadata = async (text: string): Promise<PaperMetadata> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following text extracted from the beginning of an academic PDF. 
    Extract the publication year, the main author's surname, the full title, and the journal or conference name. 
    Also, translate the title into Chinese.
    
    Text:
    ${text.substring(0, 4000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.STRING, description: "4-digit year of publication" },
          author: { type: Type.STRING, description: "Last name of the first author" },
          title: { type: Type.STRING, description: "The full title of the paper" },
          journal: { type: Type.STRING, description: "Name of the journal or conference" },
          translatedTitle: { type: Type.STRING, description: "Title translated to simplified Chinese" }
        },
        required: ["year", "author", "title", "journal", "translatedTitle"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("AI returned invalid metadata format");
  }
};

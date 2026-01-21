import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedMetadata } from "../types";

const processEnvApiKey = process.env.API_KEY;

if (!processEnvApiKey) {
  console.error("API_KEY is missing in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    year: {
      type: Type.STRING,
      description: "The publication year of the paper (YYYY). If not found, use the current year or empty string.",
    },
    firstAuthor: {
      type: Type.STRING,
      description: "The surname of the first author only. Capitalized. If Chinese, return the Pinyin or English character surname.",
    },
    originalTitle: {
      type: Type.STRING,
      description: "The original title of the paper exactly as it appears (but normalized to single line).",
    },
    chineseTitle: {
      type: Type.STRING,
      description: "The title of the paper translated to simplified Chinese. Keep it concise and accurate.",
    },
    journalName: {
      type: Type.STRING,
      description: "The name of the journal or conference where the paper was published (e.g., 'Nature', 'CVPR', 'arXiv', 'NeurIPS'). Use acronyms if common. If unknown, return empty string.",
    },
  },
  required: ["year", "firstAuthor", "originalTitle", "chineseTitle"],
};

export const extractMetadataFromText = async (text: string): Promise<ExtractedMetadata> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: `You are a bibliographic expert. Your task is to extract metadata from the provided academic paper text.
          
          Required Output:
          1. **Year**: Publication year.
          2. **First Author**: Surname of the first author.
          3. **Original Title**: The title in its original language.
          4. **Chinese Title**: Translate the paper's title into Simplified Chinese.
          5. **Journal Name**: The academic journal or conference name (abbreviated is preferred if common, e.g. IEEE TPAMI, CVPR).
          
          Text content from PDF:
          ${text.substring(0, 15000)}` 
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const data = JSON.parse(jsonText) as ExtractedMetadata;
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to extract metadata via AI.");
  }
};
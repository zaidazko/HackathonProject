import { GoogleGenAI, Type, Modality } from "@google/genai";
import { searchFurniture } from "./serpService.js";

if (!import.meta.env.VITE_GEMINI_API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const furnitureSchema = {
  type: Type.OBJECT,
  properties: {
    furniture: {
      type: Type.ARRAY,
      description: "List of furniture and decor items.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Name of the item.",
          },
          description: {
            type: Type.STRING,
            description:
              "Detailed description of the furniture item for search purposes.",
          },
          estimatedPrice: {
            type: Type.NUMBER,
            description: "Estimated price range for this type of item in USD.",
          },
        },
        required: ["name", "description", "estimatedPrice"],
      },
    },
  },
  required: ["furniture"],
};

export const generateRoomDesign = async (
  originalImageBase64,
  mimeType,
  styles,
  colors,
  budget,
  instructions
) => {
  try {
    // Step 1: Generate the new room image
    const imageGenerationPrompt = `
      Redesign this room with the following characteristics.
      Do not add any text or overlays on the image.
      - Styles: ${styles.join(", ")}
      - Color Palette: ${colors.join(", ")}
      - Other instructions: ${instructions || "None"}
    `;

    const imageResult = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: originalImageBase64, mimeType } },
          { text: imageGenerationPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const generatedImagePart = imageResult.candidates?.[0]?.content?.parts?.[0];
    if (!generatedImagePart || !generatedImagePart.inlineData) {
      throw new Error("Failed to generate a new image.");
    }
    const generatedImageBase64 = generatedImagePart.inlineData.data;
    const generatedImageMimeType = generatedImagePart.inlineData.mimeType;

    // Step 2: Analyze the generated image for furniture
    const furnitureAnalysisPrompt = `
      You are an expert interior designer. Analyze the following image of a redesigned room.
      - The total cost for all items should be under $${budget} USD.
      
      Identify the key furniture and decor items visible in the room. For each item, provide:
      1. A clear name for the item
      2. A detailed description that would be useful for searching for similar products online (include style, color, material, size characteristics)
      3. An estimated price range for this type of item
      
      Focus on major furniture pieces like sofas, chairs, tables, lighting, rugs, and decorative items. Be specific about style, color, and material characteristics that would help find similar products.
      
      Respond with a JSON object.
    `;

    const furnitureResult = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: {
        parts: [
          {
            inlineData: {
              data: generatedImageBase64,
              mimeType: generatedImageMimeType,
            },
          },
          { text: furnitureAnalysisPrompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: furnitureSchema,
      },
    });

    // Fix: Trim whitespace from the response text before parsing as JSON.
    const furnitureJson = JSON.parse(furnitureResult.text.trim());

    // Step 3: Search for real furniture using SerpAPI
    let furnitureWithSearchResults;
    try {
      furnitureWithSearchResults = await searchFurniture(
        furnitureJson.furniture
      );
    } catch (error) {
      console.error("SerpAPI search failed:", error);
      // If SerpAPI fails, return furniture without search results
      furnitureWithSearchResults = {
        furniture: furnitureJson.furniture.map((item) => ({
          ...item,
          searchResults: [],
        })),
      };
    }

    return {
      imageUrl: `data:${generatedImageMimeType};base64,${generatedImageBase64}`,
      furniture: furnitureWithSearchResults.furniture,
    };
  } catch (error) {
    console.error("Error generating room design:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate design: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the design.");
  }
};

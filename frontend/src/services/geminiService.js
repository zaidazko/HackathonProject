import { GoogleGenAI, Type, Modality } from "@google/genai";

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
          link: {
            type: Type.STRING,
            description: "A real-world, shoppable URL for the item from a popular retailer.",
          },
          price: {
            type: Type.NUMBER,
            description: "Estimated price of the item in USD.",
          },
        },
        required: ["name", "link", "price"],
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
        model: 'gemini-2.5-flash-image',
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
      You are an expert interior designer and personal shopper. Analyze the following image of a redesigned room.
      - The total cost for all items must be under $${budget} USD.
      
      Identify the key furniture and decor items. For each item, find a real-world product link from a popular online retailer and its estimated price in USD. Ensure the total cost is plausible given the budget. Prioritize items that are currently in stock or have been available for purchase from major online retailers within the last 6 months to ensure the links are valid.
      
      Respond with a JSON object.
    `;
    
    const furnitureResult = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [
          { inlineData: { data: generatedImageBase64, mimeType: generatedImageMimeType } },
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

    return {
      imageUrl: `data:${generatedImageMimeType};base64,${generatedImageBase64}`,
      furniture: furnitureJson.furniture,
    };

  } catch (error) {
    console.error("Error generating room design:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate design: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the design.");
  }
};
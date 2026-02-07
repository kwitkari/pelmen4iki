import { GoogleGenAI, Type } from "@google/genai";

export const fetchPelmeniRecipe = async (count: number, diameter: number): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "Error: API Key not found. Please set the API_KEY environment variable.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      I am using a Pelmeni optimization tool.
      I have a dough surface that fits exactly ${count} pelmeni circles of ${diameter}mm diameter.
      
      Please provide a concise, structured cooking summary in JSON format including:
      1. Approximate total weight of filling (meat) needed (assuming standard thickness).
      2. Approximate total weight of flour needed for the dough.
      3. A very short, witty "Chef's tip" for making perfect pelmeni.
      
      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fillingWeightGrams: { type: Type.NUMBER },
            flourWeightGrams: { type: Type.NUMBER },
            chefTip: { type: Type.STRING },
          },
        }
      }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return JSON.stringify({ error: "Failed to fetch recipe data." });
  }
};

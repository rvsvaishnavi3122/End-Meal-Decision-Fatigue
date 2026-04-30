import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Routes
  app.post("/api/generate-recipes", async (req, res) => {
    const { ingredients, dietaryPreference, additionalGoal, cuisineType, maxTime, mealType } = req.body;

    const prompt = `Generate 3 delicious and healthy recipes using ONLY the following available ingredients: ${ingredients.join(", ")}. 
      
      CRITICAL CONSTRAINT: You MUST NOT include any major ingredients outside of this list. However, you may assume the user has very basic pantry staples: water, salt, pepper, and cooking oil.
      
      Dietary Preference: ${dietaryPreference}.
      Cuisine Type: ${cuisineType}.
      Meal Type: ${mealType}. (CRITICAL: The recipes MUST be appropriate for this meal type. If 'Breakfast', focus on morning meals. If 'Snack', focus on small portions.)
      Maximum Cooking Time: ${maxTime}.
      Additional Goals/Notes: ${additionalGoal}.
      
      For each recipe, provide:
      - Title
      - Short mouth-watering description
      - List of ingredients with measurements
      - Numbered cooking instructions
      - Preparation time (e.g., "25 minutes")
      - Estimated calories per serving
      - Relevant dietary tags (e.g., "Vegan", "Vegetarian", "Non-Vegetarian", "Gluten-Free") - ALWAYS include the "${mealType}" as one of the tags if it is not 'Any'.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                ingredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                instructions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                prepTime: { type: Type.STRING },
                calories: { type: Type.NUMBER },
                dietaryTags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["title", "description", "ingredients", "instructions", "prepTime", "calories", "dietaryTags"]
            }
          }
        }
      });

      res.json(JSON.parse(response.text || "[]"));
    } catch (error) {
      console.error("Error generating recipes:", error);
      res.status(500).json({ error: "Failed to generate recipes" });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    const { recipeTitle, ingredients } = req.body;

    function getCategoryFromTitle(title: string): string {
      const t = title.toLowerCase();
      if (t.includes('bread') || t.includes('toast') || t.includes('sandwich')) return 'toast,bread,slices';
      if (t.includes('salad')) return 'salad,fresh,vegetables';
      if (t.includes('soup') || t.includes('stew') || t.includes('broth')) return 'soup,bowl,liquid';
      if (t.includes('curry') || t.includes('dal') || t.includes('masala') || t.includes('indian')) return 'curry,gravy,indian-cuisine';
      if (t.includes('poha')) return 'poha,indian-breakfast,beaten-rice';
      if (t.includes('upma')) return 'upma,semolina,indian-breakfast';
      if (t.includes('drink') || t.includes('smoothie') || t.includes('juice')) return 'drink,beverage,smoothie';
      if (t.includes('dessert') || t.includes('sweet') || t.includes('cake')) return 'dessert,cake,sweet';
      if (t.includes('pasta') || t.includes('noodle')) return 'pasta,italian,noodles';
      if (t.includes('rice') || t.includes('pulao') || t.includes('biryani')) return 'rice,grains,biryani';
      if (t.includes('egg') || t.includes('scramble') || t.includes('omelette')) return 'eggs,omelette,breakfast';
      return 'gourmet,dish,plated';
    }

    function stringToHash(str: string): number {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    }

    const category = getCategoryFromTitle(recipeTitle);
    const cleanTitle = recipeTitle.replace(/[^\w\s]/gi, '');
    const seed = stringToHash(recipeTitle);
    
    const ingredientContext = ingredients && ingredients.length > 0 
      ? `featuring ${ingredients.slice(0, 3).join(' and ')}` 
      : '';

    const prompt = `Professional gourmet food photography of ${cleanTitle}, ${ingredientContext}. 
      The dish is a beautifully plated ${category}, gourmet presentation, natural bright lighting, sharp focus, vibrant colors, 8k resolution, macro shot. 
      Strictly full color, appetizing, highly detailed. No black and white, no animals, no people, no hands.`;

    const maxRetries = 1;
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              return res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
            }
          }
        }
        break; 
      } catch (error: any) {
        attempts++;
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes("SAFETY") || attempts > maxRetries) break;
        await new Promise(resolve => setTimeout(resolve, errorMessage.includes("429") ? 1000 : 500));
      }
    }

    res.json({ imageUrl: `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=800&height=800&seed=${seed}&model=flux&nologo=true` });
  });

  app.post("/api/analyze-pantry", async (req, res) => {
    const { base64Image } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          `Identify as many food items and ingredients as possible in this image. List them as a simple array of strings. 
           Only include actual ingredients, not packaging labels or non-food items.`,
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: "image/jpeg"
            }
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      res.json(JSON.parse(response.text || "[]"));
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

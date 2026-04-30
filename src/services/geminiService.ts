import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, DietaryPreference } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateRecipes(
  ingredients: string[],
  dietaryPreference: DietaryPreference,
  additionalGoal: string,
  cuisineType: string = "Any",
  maxTime: string = "Any",
  mealType: string = "Any"
): Promise<Recipe[]> {
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

    const recipes: Recipe[] = JSON.parse(response.text || "[]");
    return recipes;
  } catch (error) {
    console.error("Error generating recipes:", error);
    throw error;
  }
}

function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getKeywordsFromTitle(title: string): string {
  // Common stop-words for recipe titles
  const stopWords = new Set(['with', 'and', 'the', 'style', 'easy', 'quick', 'simple', 'best', 'delicious', 'healthy', 'home-made', 'style', 'mode', 'traditional', 'authentic']);
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .split(' ')
    .filter(word => !stopWords.has(word) && word.length > 2)
    .join(',');
}

export function getCategoryFromTitle(title: string): string {
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

export async function generateRecipeImage(recipeTitle: string, ingredients?: string[]): Promise<string> {
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
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      // If we reach here, it's a silent failure in candidates
      console.warn(`Gemini image generation attempt ${attempts + 1} succeeded but returned no image data.`);
      break; 
    } catch (error: any) {
      attempts++;
      const errorMessage = error?.message || String(error);
      const isQuotaError = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");
      const isContentFilter = errorMessage.includes("SAFETY");

      console.error(`Error generating image with Gemini (Attempt ${attempts}):`, {
        error: errorMessage,
        isQuotaError,
        isContentFilter
      });

      if (isContentFilter) {
        // Don't retry if it's a content filter issue
        break;
      }

      if (attempts <= maxRetries) {
        // Wait a bit before retrying if it's a quota issue (though small wait won't help much for 429, it might for transient blips)
        const delay = isQuotaError ? 1000 : 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // Final fallback to Pollinations if all retries fail
  return `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=800&height=800&seed=${seed}&model=flux&nologo=true`;
}

export async function analyzePantryImage(base64Image: string): Promise<string[]> {
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

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error analyzing image:", error);
    return [];
  }
}

import { Recipe, DietaryPreference } from "../types";

// Note: GoogleGenAI is now used on the server side to protect the API key.
// The client now calls our internal API routes.

export async function generateRecipes(
  ingredients: string[],
  dietaryPreference: DietaryPreference,
  additionalGoal: string,
  cuisineType: string = "Any",
  maxTime: string = "Any",
  mealType: string = "Any"
): Promise<Recipe[]> {
  try {
    const response = await fetch("/api/generate-recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients,
        dietaryPreference,
        additionalGoal,
        cuisineType,
        maxTime,
        mealType
      }),
    });
    
    if (!response.ok) throw new Error("Failed to generate recipes");
    return await response.json();
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
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeTitle, ingredients }),
    });

    if (!response.ok) throw new Error("Failed to generate image");
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    return `https://pollinations.ai/p/${encodeURIComponent(recipeTitle)}?width=800&height=800&model=flux&nologo=true`;
  }
}

export async function analyzePantryImage(base64Image: string): Promise<string[]> {
  try {
    const response = await fetch("/api/analyze-pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) throw new Error("Failed to analyze pantry");
    return await response.json();
  } catch (error) {
    console.error("Error analyzing image:", error);
    return [];
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Ingredient {
  id: string;
  name: string;
}

export interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  calories: number;
  dietaryTags: string[];
  imageUrl?: string;
}

export type DietaryPreference = 'None' | 'Vegan' | 'Vegetarian' | 'Non-Vegetarian' | 'Gluten-Free' | 'Keto' | 'Paleo' | 'Low-Carb';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  dietaryPreference: DietaryPreference;
  allergies: string[];
  createdAt: number;
}

export interface MealPlan {
  id: string;
  userId: string;
  recipe: Recipe;
  date: string; // ISO string YYYY-MM-DD
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  createdAt: number;
}

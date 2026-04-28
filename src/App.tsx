/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap,
  Sparkles,
  Brain,
  Search, 
  Plus, 
  X, 
  ChefHat, 
  Clock, 
  Flame, 
  Leaf, 
  ArrowRight,
  ArrowLeft,
  Utensils,
  RefreshCw,
  Info,
  Calendar,
  LogOut,
  User as UserIcon,
  Filter,
  Dna,
  Camera,
  Upload
} from 'lucide-react';
import { Recipe, DietaryPreference } from './types';
import { generateRecipes, generateRecipeImage, analyzePantryImage, getKeywordsFromTitle, getCategoryFromTitle } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import MealPlanner from './components/MealPlanner';
import MealPlanModal from './components/MealPlanModal';
import ProfilePanel from './components/ProfilePanel';
import RecipeDetailModal from './components/RecipeDetailModal';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const { user, profile, signIn, loading: authLoading } = useAuth();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('None');
  const [additionalGoal, setAdditionalGoal] = useState('');
  const [cuisineType, setCuisineType] = useState('Any');
  const [maxTime, setMaxTime] = useState('Any');
  const [mealType, setMealType] = useState('Any');
  
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedRecipeForPlan, setSelectedRecipeForPlan] = useState<Recipe | null>(null);
  const [selectedRecipeForView, setSelectedRecipeForView] = useState<Recipe | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'pantry' | 'planner'>('home');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync preferences from profile
  useEffect(() => {
    if (profile) {
      setDietaryPreference(profile.dietaryPreference || 'None');
      setAdditionalGoal(prev => {
        const allergyStr = profile.allergies.length > 0 ? `Avoid: ${profile.allergies.join(', ')}.` : '';
        return prev.includes(allergyStr) ? prev : `${prev} ${allergyStr}`.trim();
      });
    }
  }, [profile]);

  const addIngredient = () => {
    if (inputValue.trim() && !ingredients.includes(inputValue.trim().toLowerCase())) {
      setIngredients([...ingredients, inputValue.trim().toLowerCase()]);
      setInputValue('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const detectedIngredients = await analyzePantryImage(base64);
        if (detectedIngredients.length > 0) {
          const uniqueNew = detectedIngredients.filter(i => !ingredients.includes(i.toLowerCase()));
          setIngredients([...ingredients, ...uniqueNew.map(i => i.toLowerCase())]);
        } else {
          setError("No ingredients detected. Try a clearer photo.");
        }
      } catch (err) {
        setError("AI failed to analyze the image. Please try again.");
      } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const generatedRecipes = await generateRecipes(
        ingredients, 
        dietaryPreference, 
        additionalGoal,
        cuisineType,
        maxTime,
        mealType
      );
      
      setAllRecipes(generatedRecipes);
      
      const recipesWithImages = await Promise.all(
        generatedRecipes.map(async (recipe) => ({
          ...recipe,
          imageUrl: await generateRecipeImage(recipe.title, recipe.ingredients)
        }))
      );
      
      setAllRecipes(recipesWithImages);
    } catch (err: any) {
      if (err?.message?.includes('429') || err?.status === 429) {
        setError('Daily AI generation quota exceeded. Please try again later.');
      } else {
        setError('Failed to generate recipes. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecipes = allRecipes.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const DIETARY_OPTIONS: DietaryPreference[] = [
    'None', 'Vegan', 'Vegetarian', 'Non-Vegetarian', 'Gluten-Free', 'Keto', 'Paleo', 'Low-Carb'
  ];

  const CUISINE_OPTIONS = ['Any', 'Italian', 'Mexican', 'Indian', 'Japanese', 'Mediterranean', 'Middle Eastern'];
  const TIME_OPTIONS = ['Any', '15 mins', '30 mins', '45 mins', '1 hour+'];
  const MEAL_OPTIONS = ['Any', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bento-bg flex items-center justify-center">
        <Dna className="w-12 h-12 text-bento-accent animate-pulse" />
      </div>
    );
  }

  if (showLanding) {
    return (
      <LandingPage 
        onStart={async () => {
          if (!user) {
            await signIn();
          }
          setShowLanding(false);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-bento-bg text-slate-900 font-sans pb-24">
      {/* Header Section */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-bento-bg/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeTab !== 'home' && (
              <button 
                onClick={() => setActiveTab('home')}
                className="p-2 -ml-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
            )}
            <div className="w-10 h-10 bg-bento-accent rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 cursor-pointer" onClick={() => setShowLanding(true)}>
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-slate-800">SmartMeal</h1>
              <p className="text-[9px] text-bento-muted font-bold uppercase tracking-widest leading-none">AI Kitchen</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:border-bento-accent transition-all group"
              >
                <UserIcon className="w-5 h-5 text-slate-600" />
              </button>
            ) : (
              <button 
                onClick={signIn}
                className="px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto pt-24 px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.section 
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Discover Recipes</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search saved recipes..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-bento-accent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Cuisine</label>
                    <select 
                      value={cuisineType} 
                      onChange={(e) => setCuisineType(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-medium focus:ring-2 focus:ring-bento-accent cursor-pointer"
                    >
                      {CUISINE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Max Time</label>
                    <select 
                      value={maxTime} 
                      onChange={(e) => setMaxTime(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-medium focus:ring-2 focus:ring-bento-accent cursor-pointer"
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Dietary</label>
                    <select 
                      value={dietaryPreference} 
                      onChange={(e) => setDietaryPreference(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-medium focus:ring-2 focus:ring-bento-accent cursor-pointer"
                    >
                      {DIETARY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Meal Type</label>
                    <select 
                      value={mealType} 
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-medium focus:ring-2 focus:ring-bento-accent cursor-pointer"
                    >
                      {MEAL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {allRecipes.length > 0 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {filteredRecipes.length} Results Found
                    </p>
                    <button 
                      onClick={() => setActiveTab('pantry')}
                      className="text-[10px] font-bold text-bento-accent uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refine Pantry
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                {filteredRecipes.length > 0 ? (
                  filteredRecipes.map((recipe, idx) => (
                    <RecipeCard 
                      key={idx} 
                      recipe={recipe} 
                      index={idx} 
                      onPlan={() => user ? setSelectedRecipeForPlan(recipe) : signIn()} 
                      onView={() => setSelectedRecipeForView(recipe)}
                    />
                  ))
                ) : (
                  <div className="bg-white border border-slate-200 rounded-[40px] p-12 flex flex-col items-center justify-center text-center h-[400px]">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-[30%] flex items-center justify-center mb-6">
                      <Utensils className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">No recipes yet</h3>
                    <p className="text-xs text-bento-muted max-w-[240px] mx-auto leading-relaxed">Add ingredients in the Pantry tab and tap "Generate" to see AI-powered recipe ideas.</p>
                    <button 
                      onClick={() => setActiveTab('pantry')}
                      className="mt-6 px-6 py-3 bg-bento-accent-soft text-bento-accent rounded-xl text-xs font-bold hover:bg-orange-100/50 transition-colors flex items-center gap-2"
                    >
                      Go to Pantry
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) }
              </div>
            </motion.section>
          )}

          {activeTab === 'pantry' && (
            <motion.section 
              key="pantry"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="bg-bento-accent-soft border border-orange-100 rounded-[32px] p-6 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h2 className="text-xl font-display font-bold text-slate-900 leading-none">Your Pantry</h2>
                    <p className="text-[10px] text-bento-accent font-bold uppercase tracking-widest">Scanning {ingredients.length} items</p>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAnalyzing}
                      className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-orange-100 text-bento-accent flex items-center justify-center disabled:opacity-50"
                      title="Scan Pantry"
                    >
                      {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                      placeholder="Add an ingredient..." 
                      className="w-full pl-5 pr-12 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-bento-accent transition-all text-sm placeholder:text-slate-300"
                    />
                    <button 
                      onClick={addIngredient}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-bento-accent text-white rounded-xl shadow-sm flex items-center justify-center active:scale-95 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {['Onion', 'Garlic', 'Egg', 'Tomato', 'Avocado', 'Bread'].map(staple => (
                      <button
                        key={staple}
                        onClick={() => {
                          if (!ingredients.includes(staple.toLowerCase())) {
                            setIngredients([...ingredients, staple.toLowerCase()]);
                          }
                        }}
                        className="px-3 py-1.5 bg-white/50 border border-orange-100/50 rounded-lg text-[10px] font-bold text-slate-800 uppercase hover:bg-white transition-colors"
                      >
                        + {staple}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 overflow-y-auto flex-grow max-h-[300px] scrollbar-hide mt-8 pb-4">
                  <AnimatePresence>
                    {ingredients.map((item) => (
                      <motion.span 
                        key={item}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-orange-100 text-[11px] font-bold text-slate-700 rounded-xl shadow-sm"
                      >
                        {item}
                        <button onClick={() => removeIngredient(item)} className="p-0.5 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  {ingredients.length === 0 && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-orange-200 py-12">
                      <RefreshCw className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-xs font-bold text-center opacity-60">Ready for your staples</p>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={async () => {
                    await handleGenerate();
                    setActiveTab('home');
                  }}
                  disabled={isLoading || ingredients.length === 0}
                  className="mt-6 w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl shadow-slate-900/10 active:scale-[0.98] group"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Dna className="w-5 h-5 text-orange-300 group-hover:rotate-180 transition-transform duration-500" />
                      Generate Recipes
                      <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 text-white rounded-[32px] p-6 flex flex-col overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl -translate-y-12 translate-x-12" />
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-orange-400" />
                  Personalized AI
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {profile?.dietaryPreference !== 'None' 
                    ? `Matching results to your ${profile?.dietaryPreference} diet.`
                    : "Update your profile to get personalized nutrition advice."}
                </p>
              </div>
            </motion.section>
          )}

          {activeTab === 'planner' && (
            <motion.section 
              key="planner"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="bg-white border border-slate-200 rounded-[32px] p-6 min-h-[600px] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-6 h-6 text-bento-accent" />
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-800 leading-none">Meal Planner</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Organize your Week</p>
                  </div>
                </div>
                <MealPlanner />
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-8 py-4 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'home' ? 'text-bento-accent' : 'text-slate-400'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === 'home' ? 'bg-bento-accent-soft' : ''}`}>
              <Utensils className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Explore</span>
          </button>

          <button 
            onClick={() => setActiveTab('pantry')}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'pantry' ? 'text-bento-accent' : 'text-slate-400'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === 'pantry' ? 'bg-bento-accent-soft' : ''}`}>
              <RefreshCw className={`w-6 h-6 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Pantry</span>
          </button>

          <button 
            onClick={() => setActiveTab('planner')}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'planner' ? 'text-bento-accent' : 'text-slate-400'}`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === 'planner' ? 'bg-bento-accent-soft' : ''}`}>
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Plan</span>
          </button>
        </div>
      </nav>

      {/* Modals & Panels */}
      {selectedRecipeForPlan && (
        <MealPlanModal recipe={selectedRecipeForPlan} onClose={() => setSelectedRecipeForPlan(null)} />
      )}

      <AnimatePresence>
        {selectedRecipeForView && (
          <RecipeDetailModal 
            recipe={selectedRecipeForView} 
            onClose={() => setSelectedRecipeForView(null)} 
            onPlan={() => user ? setSelectedRecipeForPlan(selectedRecipeForView) : signIn()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileOpen && <ProfilePanel onClose={() => setIsProfileOpen(false)} />}
      </AnimatePresence>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-3 text-xs font-medium z-40 shadow-xl"
        >
          <Info className="w-4 h-4 text-amber-500 shrink-0" />
          {error}
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError(null)} />
        </motion.div>
      )}
    </div>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  onPlan: () => void;
  onView: () => void;
}

const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Hero Section */}
      <section className="px-6 pt-20 pb-16 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h1 className="text-[40px] font-display font-black leading-[1.1] text-slate-900 tracking-tight">
            End Meal Decision <span className="text-[#D97706]">Fatigue</span>
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-[320px]">
            Stop wasting time choosing what to cook. Our AI-powered engine gives you instant, personalized meal recommendations in under 10 seconds. Zero thinking required.
          </p>
          <button 
            onClick={onStart}
            className="bg-[#E47C56] text-white px-8 py-4 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
          >
            Start Cooking Smarter
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-12 relative"
        >
          <div className="absolute inset-0 bg-orange-100/50 rounded-[40px] blur-3xl -z-10" />
          <img 
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop" 
            alt="Healthy Bowl" 
            className="w-full h-[400px] object-cover rounded-[40px] shadow-2xl border-4 border-white"
          />
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-white/50">
        <div className="max-w-md mx-auto text-center space-y-3 mb-10">
          <h2 className="text-2xl font-display font-black text-slate-900">How It Works</h2>
          <p className="text-xs text-slate-400 font-medium">Three simple modes to match your cooking style</p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          {[
            {
              icon: <Zap className="w-5 h-5 text-[#E47C56]" />,
              title: "Zero Decision Mode",
              desc: "One tap. One perfect meal. No choices, no thinking. Just instant recommendations tailored to you."
            },
            {
              icon: <Sparkles className="w-5 h-5 text-[#E47C56]" />,
              title: "Smart Recommendations",
              desc: "Get top 3 AI-scored meals based on your pantry, time, dietary needs, and preferences."
            },
            {
              icon: <Brain className="w-5 h-5 text-[#E47C56]" />,
              title: "Learns Your Taste",
              desc: "Track your meal history and ratings. Our engine gets smarter with every choice you make."
            }
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-3"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                {card.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-800">{card.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 text-center space-y-8 max-w-md mx-auto">
        <div className="space-y-4">
          <h2 className="text-2xl font-display font-black text-slate-900">Ready to Cook Without the Stress?</h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Join thousands who've eliminated decision fatigue from their cooking routine.
          </p>
        </div>
        <button 
          onClick={onStart}
          className="bg-[#E47C56] text-white px-10 py-5 rounded-full font-bold text-sm shadow-xl shadow-orange-500/20 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
        >
          Get Started Free
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, index, onPlan, onView }) => {
  return (
    <motion.article 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-200 flex flex-col group/card hover:shadow-md transition-shadow"
    >
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        {recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.triedFallback) {
                target.dataset.triedFallback = '1';
                const keywords = getKeywordsFromTitle(recipe.title);
                const category = getCategoryFromTitle(recipe.title);
                // Reliable food-only source: Unsplash with category and keywords
                target.src = `https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop`; // Best overall food
              } else if (target.dataset.triedFallback === '1') {
                target.dataset.triedFallback = '2';
                const category = getCategoryFromTitle(recipe.title);
                const seed = index + 100;
                // Use a different professional food photo
                target.src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop`;
              } else if (target.dataset.triedFallback === '2') {
                 target.dataset.triedFallback = '3';
                 target.src = 'https://images.unsplash.com/photo-1476224484781-dec2754546cb?q=80&w=800&auto=format&fit=crop';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
             <RefreshCw className="w-6 h-6 animate-spin mb-2" />
             <span className="text-[10px] font-bold uppercase tracking-widest">Imagining Dish...</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {recipe.dietaryTags.slice(0, 2).map(tag => (
            <span key={tag} className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] font-bold text-orange-700 uppercase border border-orange-100 shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-6 flex flex-col gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-display font-bold leading-tight text-slate-800">{recipe.title}</h3>
          <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{recipe.description}</p>
        </div>

        <div className="flex gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-bento-accent" />
            <span className="text-[11px] font-bold text-slate-700">{recipe.prepTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-bold text-slate-700">{recipe.calories} cal</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={onPlan}
            className="flex-1 py-3 bg-bento-accent-soft text-bento-accent rounded-xl text-[11px] font-bold hover:bg-orange-100/50 transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-3.5 h-3.5" />
            Plan
          </button>
          <button 
            onClick={onView}
            className="flex-1 py-3 bg-slate-400 text-white rounded-xl text-[11px] font-bold hover:bg-slate-500 transition-colors flex items-center justify-center gap-2"
          >
            View
          </button>
        </div>
      </div>
    </motion.article>
  );
}

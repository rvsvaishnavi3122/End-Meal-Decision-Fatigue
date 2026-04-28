/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Flame, ChevronRight } from 'lucide-react';
import { Recipe } from '../types';
import { getKeywordsFromTitle, getCategoryFromTitle } from '../services/geminiService';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  onPlan: () => void;
}

export default function RecipeDetailModal({ recipe, onClose, onPlan }: RecipeDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] h-[90vh] sm:h-auto max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="relative h-64 flex-shrink-0">
          <img 
            src={recipe.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop'} 
            alt={recipe.title} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.triedFallback) {
                target.dataset.triedFallback = '1';
                const keywords = getKeywordsFromTitle(recipe.title);
                const category = getCategoryFromTitle(recipe.title);
                target.src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop`;
              } else if (target.dataset.triedFallback === '1') {
                target.dataset.triedFallback = '2';
                target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop';
              } else if (target.dataset.triedFallback === '2') {
                target.dataset.triedFallback = '3';
                target.src = 'https://images.unsplash.com/photo-1476224484781-dec2754546cb?q=80&w=800&auto=format&fit=crop';
              }
            }}
          />
          <div className="absolute top-6 left-6 flex gap-2">
            {recipe.dietaryTags.map(tag => (
              <span key={tag} className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-bold text-orange-700 uppercase border border-orange-100 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          <div className="space-y-4">
            <h2 className="text-3xl font-display font-bold text-slate-800 leading-tight">{recipe.title}</h2>
            <p className="text-slate-500 text-sm leading-relaxed">{recipe.description}</p>
            
            <div className="flex gap-8 py-6 border-y border-slate-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-bento-accent" />
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest leading-none mb-1">Time</p>
                  <p className="text-sm font-bold text-slate-800 leading-none">{recipe.prepTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest leading-none mb-1">Cals</p>
                  <p className="text-sm font-bold text-slate-800 leading-none">{recipe.calories}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-800">Ingredients</h3>
            <ul className="space-y-3">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <div className="w-1.5 h-1.5 bg-bento-accent rounded-full" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-800">Instructions</h3>
            <div className="space-y-6">
              {recipe.instructions.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-bento-accent-soft text-bento-accent rounded-lg flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
          <button 
            onClick={() => {
              onPlan();
              onClose();
            }}
            className="flex-1 py-4 bg-bento-accent text-white rounded-[24px] font-bold text-sm shadow-xl shadow-orange-500/10 active:scale-[0.98] transition-all"
          >
            Add to Meal Plan
          </button>
        </div>
      </motion.div>
    </div>
  );
}

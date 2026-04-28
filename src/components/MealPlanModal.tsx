/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, Check } from 'lucide-react';
import { Recipe, MealPlan } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface MealPlanModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export default function MealPlanModal({ recipe, onClose }: MealPlanModalProps) {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState<MealPlan['mealType']>('Lunch');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const plan: Omit<MealPlan, 'id'> = {
        userId: user.uid,
        recipe,
        date,
        mealType,
        createdAt: Date.now(),
      };
      await addDoc(collection(db, 'users', user.uid, 'mealPlans'), plan);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/mealPlans`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-display font-bold text-slate-800 mb-2">Schedule Meal</h3>
        <p className="text-sm text-slate-500 mb-8 font-medium">{recipe.title}</p>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Select Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-bento-accent transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div>
             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Meal Time</label>
             <div className="grid grid-cols-2 gap-3">
               {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                 <button
                   key={type}
                   onClick={() => setMealType(type as any)}
                   className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                     mealType === type 
                     ? 'bg-bento-accent border-bento-accent text-white' 
                     : 'bg-white border-slate-200 text-slate-500 hover:border-bento-accent'
                   }`}
                 >
                   {type}
                   {mealType === type && <Check className="w-3 h-3" />}
                 </button>
               ))}
             </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Confirm Schedule'}
        </button>
      </motion.div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Clock, 
  Utensils,
  X 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, getMealPlansCollection, handleFirestoreError, OperationType } from '../lib/firebase';
import { onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { MealPlan, Recipe } from '../types';

export default function MealPlanner() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = getMealPlansCollection(user.uid);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p: MealPlan[] = [];
      snapshot.forEach(doc => {
        p.push({ id: doc.id, ...doc.data() } as MealPlan);
      });
      setPlans(p);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/mealPlans`));

    return () => unsubscribe();
  }, [user]);

  const dateKey = selectedDate.toISOString().split('T')[0];
  const todaysPlans = plans.filter(p => p.date === dateKey);

  const removePlan = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'mealPlans', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/mealPlans/${id}`);
    }
  };

  const changeDate = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-display font-bold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-bento-accent" />
          Meal Planner
        </h3>
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 min-w-[100px] text-center">
            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
          </span>
          <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => {
          const plan = todaysPlans.find(p => p.mealType === type);
          return (
            <div key={type} className={`group p-4 rounded-2xl border transition-all ${
              plan ? 'bg-bento-accent-soft border-orange-100' : 'bg-slate-50 border-slate-200 border-dashed opacity-60'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-bento-accent transition-colors">
                  {type}
                </span>
                {plan && (
                  <button 
                    onClick={() => removePlan(plan.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {plan ? (
                <div>
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{plan.recipe.title}</p>
                  <div className="flex items-center gap-3 mt-2">
                     <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {plan.recipe.prepTime}
                     </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-2 h-10">
                   <p className="text-[10px] font-medium text-slate-300">Nothing planned</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
         <p className="text-[10px] text-slate-400 font-medium">Tip: Use the recipe cards to add to plan</p>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, User as UserIcon, Shield, AlertCircle, Save, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DietaryPreference } from '../types';

interface ProfilePanelProps {
  onClose: () => void;
}

const DIETARY_OPTIONS: DietaryPreference[] = [
  'None', 'Vegan', 'Vegetarian', 'Non-Vegetarian', 'Gluten-Free', 'Keto', 'Paleo', 'Low-Carb'
];

export default function ProfilePanel({ onClose }: ProfilePanelProps) {
  const { profile, updateProfile, logOut } = useAuth();
  const [pref, setPref] = useState<DietaryPreference>(profile?.dietaryPreference || 'None');
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>(profile?.allergies || []);
  const [isSaving, setIsSaving] = useState(false);

  const addAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim().toLowerCase())) {
      setAllergies([...allergies, allergyInput.trim().toLowerCase()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (a: string) => {
    setAllergies(allergies.filter(item => item !== a));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({
      dietaryPreference: pref,
      allergies: allergies
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        className="bg-[#FDFCFB] w-full max-w-md h-full shadow-2xl p-8 flex flex-col"
      >
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white border border-slate-200 rounded-[30%] flex items-center justify-center shadow-sm">
                <UserIcon className="w-6 h-6 text-slate-400" />
             </div>
             <div>
               <h3 className="text-xl font-display font-bold text-slate-800">{profile?.displayName}</h3>
               <p className="text-xs text-slate-400 font-medium">{profile?.email}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 space-y-10 overflow-y-auto">
          {/* Dietary Restrictions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-bento-accent" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-800">Dietary Baseline</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPref(opt)}
                  className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${
                    pref === opt 
                    ? 'bg-bento-accent border-bento-accent text-white' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-bento-accent'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-800">Allergies & Sensitivities</h4>
            </div>
            <div className="flex gap-2 mb-4">
               <input 
                 type="text" 
                 value={allergyInput}
                 onChange={(e) => setAllergyInput(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                 placeholder="e.g. Peanuts, Shellfish..."
                 className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-bento-accent text-sm"
               />
               <button onClick={addAllergy} className="px-6 bg-slate-900 text-white rounded-2xl font-bold text-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
               {allergies.map(a => (
                 <span key={a} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-xs font-bold flex items-center gap-2">
                   {a}
                   <X className="w-3 h-3 cursor-pointer" onClick={() => removeAllergy(a)} />
                 </span>
               ))}
            </div>
          </div>
        </div>

        <div className="pt-8 mt-auto space-y-4">
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="w-full py-5 bg-bento-accent text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/10"
           >
             <Save className="w-5 h-5" />
             {isSaving ? 'Saving...' : 'Save Preferences'}
           </button>
           <button 
             onClick={() => { logOut(); onClose(); }}
             className="w-full py-5 bg-white border border-slate-200 text-slate-400 rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-red-500 transition-all group"
           >
             <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             Logout
           </button>
        </div>
      </motion.div>
    </div>
  );
}

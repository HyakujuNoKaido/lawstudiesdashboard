import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ChevronRight, ChevronLeft, CheckCircle2, User, GraduationCap, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentUserId } from '../services/supabaseService';

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    university: 'Université de Lausanne (UNIL)',
    currentSemester: 'Semestre 3 (BA 3)',
    passingGrade: 4.0,
    targetECTS: 180
  });

  const handleNext = () => {
    if (step === 1 && !form.fullName.trim()) {
      alert("Veuillez renseigner votre nom complet.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      // Enregistrement des colonnes de base garanties dans la table profiles de Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: form.fullName,
          university: form.university,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;

      // Sauvegarde des préférences académiques en local pour l'interface
      localStorage.setItem('lexi_academic_prefs', JSON.stringify({
        currentSemester: form.currentSemester,
        passingGrade: form.passingGrade,
        targetECTS: form.targetECTS
      }));
      
      navigate('/');
    } catch (err) {
      console.error("Erreur enregistrement onboarding:", err);
      alert("Échec de l'enregistrement du profil. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface border-y border-r border-l-[4px] border-l-secondary border-y-border border-r-border rounded-r-3xl p-8 shadow-2xl flex flex-col gap-8 animate-in fade-in duration-300">
        
        {/* En-tête Éditoriale */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary mb-1">
            <Scale size={28} />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold">Bienvenue sur Lexi</h1>
            <p className="text-text-muted text-sm mt-1">L'espace de travail premium pour le droit suisse.</p>
          </div>
        </div>

        {/* Indicateur d'étapes (Barre de progression stylisée) */}
        <div className="flex items-center justify-center gap-3 my-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step === i ? 'w-10 bg-secondary' : step > i ? 'w-6 bg-secondary/40' : 'w-4 bg-border'
              }`} 
            />
          ))}
        </div>

        {/* Étape 1 */}
        {step === 1 && (
          <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <User size={18} />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono">1. Identité</h2>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Nom complet *</label>
              <input 
                type="text"
                required
                autoFocus
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="ex: Aniss Bahaji"
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-secondary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Université / Faculté</label>
              <select 
                value={form.university}
                onChange={(e) => setForm({ ...form, university: e.target.value })}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-secondary appearance-none cursor-pointer transition-colors"
              >
                <option value="Université de Genève (UNIGE)">Université de Genève (UNIGE)</option>
                <option value="Université de Lausanne (UNIL)">Université de Lausanne (UNIL)</option>
                <option value="Université de Fribourg (UNIFR)">Université de Fribourg (UNIFR)</option>
                <option value="Université de Berne (UNIBE)">Université de Berne (UNIBE)</option>
                <option value="Université de Zurich (UZH)">Université de Zurich (UZH)</option>
                <option value="Université de Neuchâtel (UNINE)">Université de Neuchâtel (UNINE)</option>
              </select>
            </div>
          </div>
        )}

        {/* Étape 2 */}
        {step === 2 && (
          <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <GraduationCap size={18} />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono">2. Cursus</h2>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Semestre actuel</label>
              <select 
                value={form.currentSemester}
                onChange={(e) => setForm({ ...form, currentSemester: e.target.value })}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-secondary appearance-none cursor-pointer transition-colors"
              >
                <option value="Semestre 1 (BA 1)">Semestre 1 (BA 1)</option>
                <option value="Semestre 2 (BA 2)">Semestre 2 (BA 2)</option>
                <option value="Semestre 3 (BA 3)">Semestre 3 (BA 3)</option>
                <option value="Semestre 4 (BA 4)">Semestre 4 (BA 4)</option>
                <option value="Semestre 5 (BA 5)">Semestre 5 (BA 5)</option>
                <option value="Semestre 6 (BA 6)">Semestre 6 (BA 6)</option>
                <option value="Master en droit (ML)">Master en droit (ML)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Objectif ECTS (généralement 180 pour un BA)</label>
              <input 
                type="number"
                value={form.targetECTS}
                onChange={(e) => setForm({ ...form, targetECTS: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-secondary transition-colors font-mono"
              />
            </div>
          </div>
        )}

        {/* Étape 3 */}
        {step === 3 && (
          <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <Calendar size={18} />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono">3. Barème Suisse</h2>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Seuil de réussite académique</label>
              <select 
                value={form.passingGrade}
                onChange={(e) => setForm({ ...form, passingGrade: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-secondary appearance-none cursor-pointer transition-colors"
              >
                <option value={4.0}>4.0 (Standard UNIL/UNIGE)</option>
                <option value={4.5}>4.5</option>
              </select>
              <p className="text-[11px] text-text-muted mt-2 leading-relaxed border-l-2 border-border pl-3">
                L'application configurera automatiquement les statistiques de réussite sur la base d'une échelle allant jusqu'à 6.0, avec ce seuil comme validation des ECTS.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex items-center gap-3 mt-2">
          {step > 1 && (
            <button 
              type="button"
              onClick={handlePrev}
              className="px-5 py-3.5 rounded-xl bg-surface-elevated border border-border text-text font-medium text-sm hover:bg-border transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft size={16} />
              <span>Retour</span>
            </button>
          )}
          
          {step < 3 ? (
            <button 
              type="button"
              onClick={handleNext}
              className="flex-1 bg-secondary text-white rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold hover:bg-secondary/90 transition-colors cursor-pointer shadow-lg shadow-secondary/20"
            >
              <span>Continuer</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              type="button"
              disabled={loading}
              onClick={handleFinish}
              className="flex-1 bg-accent text-background rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-bold glow-gold hover:bg-accent-strong transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={18} />
              <span>{loading ? 'Création du profil...' : 'Terminer et démarrer'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

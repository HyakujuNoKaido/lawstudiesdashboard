import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ChevronRight, ChevronLeft, CheckCircle2, User, GraduationCap, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SOLO_USER_ID } from '../lib/constants';

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
      // Sauvegarde réelle dans la table profiles de Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: SOLO_USER_ID,
          full_name: form.fullName,
          university: form.university,
          current_semester: form.currentSemester,
          passing_grade: Number(form.passingGrade),
          target_ects: Number(form.targetECTS),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

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
      <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-8 shadow-2xl flex flex-col gap-6 animate-in fade-in duration-300">
        
        {/* En-tête */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-1">
            <Scale size={28} />
          </div>
          <h1 className="font-serif text-2xl font-bold">Bienvenue sur Lexi</h1>
          <p className="text-text-muted text-xs">Votre écosystème intelligent pour les études de droit en Suisse.</p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center gap-2 my-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === i ? 'w-8 bg-accent' : step > i ? 'w-4 bg-accent/40' : 'w-4 bg-border'
              }`} 
            />
          ))}
        </div>

        {/* Étape 1 : Informations personnelles */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-accent mb-1">
              <User size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">Identité</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Nom complet *</label>
              <input 
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="ex: Jean Dupont"
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Université / Faculté</label>
              <select 
                value={form.university}
                onChange={(e) => setForm({ ...form, university: e.target.value })}
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none"
              >
                <option value="Université de Lausanne (UNIL)">Université de Lausanne (UNIL)</option>
                <option value="Université de Genève (UNIGE)">Université de Genève (UNIGE)</option>
                <option value="Université de Fribourg (UNIFR)">Université de Fribourg (UNIFR)</option>
                <option value="Université de Berne (UNIBE)">Université de Berne (UNIBE)</option>
                <option value="Université de Zurich (UZH)">Université de Zurich (UZH)</option>
                <option value="Université de Neuchâtel (UNINE)">Université de Neuchâtel (UNINE)</option>
              </select>
            </div>
          </div>
        )}

        {/* Étape 2 : Cursus académique */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-accent mb-1">
              <GraduationCap size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">Cursus</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Semestre actuel</label>
              <select 
                value={form.currentSemester}
                onChange={(e) => setForm({ ...form, currentSemester: e.target.value })}
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none"
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
              <label className="text-xs font-medium text-text-muted">Objectif ECTS total du diplôme</label>
              <input 
                type="number"
                value={form.targetECTS}
                onChange={(e) => setForm({ ...form, targetECTS: Number(e.target.value) })}
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        )}

        {/* Étape 3 : Barème et validation */}
        {step === 3 && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-accent mb-1">
              <Calendar size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">Barème suisse</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Note de passage (Seuil de réussite)</label>
              <select 
                value={form.passingGrade}
                onChange={(e) => setForm({ ...form, passingGrade: Number(e.target.value) })}
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none"
              >
                <option value={4.0}>4.0 (Standard suisse)</option>
                <option value={4.5}>4.5</option>
              </select>
              <p className="text-[11px] text-text-muted mt-1">En Suisse, la note maximale est 6.0 et la note éliminatoire / seuil de réussite est généralement fixée à 4.0.</p>
            </div>
          </div>
        )}

        {/* Boutons de navigation */}
        <div className="flex items-center gap-3 mt-4">
          {step > 1 && (
            <button 
              type="button"
              onClick={handlePrev}
              className="px-5 py-3 rounded-xl bg-surface-elevated border border-border text-text font-medium text-sm hover:bg-surface-elevated/80 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft size={16} />
              <span>Retour</span>
            </button>
          )}

          {step < 3 ? (
            <button 
              type="button"
              onClick={handleNext}
              className="flex-1 bg-accent text-background rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-semibold glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
            >
              <span>Continuer</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              type="button"
              disabled={loading}
              onClick={handleFinish}
              className="flex-1 bg-accent text-background rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-semibold glow-gold hover:bg-accent-strong transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={18} />
              <span>{loading ? 'Enregistrement...' : 'Terminer et démarrer'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

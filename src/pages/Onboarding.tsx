import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ChevronRight, ChevronLeft, CheckCircle2, User, GraduationCap, Calendar, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from '../lib/toast';

export function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [form, setForm] = useState({
    fullName: '',
    university: 'Université de Lausanne (UNIL)',
    currentSemester: 'Semestre 3 (BA 3)',
    passingGrade: 4.0,
    targetECTS: 180
  });

  // Vérifier si l'utilisateur connecté a déjà un profil
  useEffect(() => {
    if (user && step === 1) {
      checkProfile();
    }
  }, [user]);

  const checkProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (data?.full_name) {
      navigate('/'); // Profil existant -> Dashboard
    } else {
      setStep(2); // Pas de profil -> Suite de l'onboarding
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      toast("L'email et le mot de passe sont requis", "warning");
      return;
    }
    setLoading(true);
    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
        if (error) throw error;
        toast("Connexion réussie", "success");
        // Le useEffect détectera la connexion et vous redirigera
      } else {
        const { error } = await supabase.auth.signUp({ email: authForm.email, password: authForm.password });
        if (error) throw error;
        toast("Compte créé avec succès", "success");
        // Si Supabase nécessite une confirmation par email, le user.id pourrait ne pas s'activer immédiatement.
        // Autrement, on passe à l'étape 2.
        setStep(2);
      }
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 2 && !form.fullName.trim()) {
      toast("Veuillez renseigner votre nom complet.", "warning");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => setStep(prev => Math.max(2, prev - 1));

  const handleFinish = async () => {
    if (!user) {
      toast("Vous devez être authentifié pour finaliser le profil.", "error");
      return;
    }
    
    setLoading(true);
    try {
      // UTILISATION DIRECTE DE USER.ID (Résout l'erreur getCurrentUserId())
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: form.fullName,
          university: form.university,
          cycle: form.currentSemester,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;

      localStorage.setItem('lexi_academic_prefs', JSON.stringify({
        currentSemester: form.currentSemester,
        passingGrade: form.passingGrade,
        targetECTS: form.targetECTS
      }));
      
      navigate('/');
    } catch (err) {
      console.error("Erreur enregistrement onboarding:", err);
      toast("Échec de l'enregistrement du profil.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface border-y border-r border-l-[4px] border-l-secondary border-y-border border-r-border rounded-r-3xl p-8 shadow-apple flex flex-col gap-8 animate-in fade-in duration-300">
        
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary mb-1">
            <Scale size={28} />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold">Bienvenue sur Lexi</h1>
            <p className="text-text-muted text-sm mt-1">L'espace de travail premium pour le droit suisse.</p>
          </div>
        </div>

        {/* ÉTAPE 1 : AUTHENTIFICATION */}
        {step === 1 && (
          <form onSubmit={handleAuth} className="flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-accent mb-1">
              <Lock size={18} />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono">1. Authentification</h2>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Adresse Email</label>
              <input 
                type="email" required value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                placeholder="etudiant@unil.ch"
                className="w-full bg-background border border-border rounded-input py-3 px-4 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Mot de passe</label>
              <input 
                type="password" required value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-input py-3 px-4 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-accent text-background py-3.5 rounded-btn font-bold mt-2 glow-gold cursor-pointer disabled:opacity-50">
              {loading ? 'Vérification...' : (isLoginMode ? 'Se connecter' : 'Créer mon compte')}
            </button>

            <p className="text-xs text-center text-text-muted mt-2">
              {isLoginMode ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}
              <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-accent ml-1 font-bold hover:underline cursor-pointer">
                {isLoginMode ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          </form>
        )}

        {/* ÉTAPE 2 : IDENTITÉ */}
        {step === 2 && (
          <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <User size={18} />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono">2. Identité</h2>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Nom complet *</label>
              <input 
                type="text" required autoFocus value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="ex: Aniss Bahaji"
                className="w-full bg-background border border-border rounded-input py-3 px-4 text-sm focus:outline-none focus:border-secondary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Université / Faculté</label>
              <select 
                value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })}
                className="w-full bg-background border border-border rounded-input py-3 px-4 text-sm focus:outline-none focus:border-secondary cursor-pointer"
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

        {/* ÉTAPE 3 : CURSUS */}
        {step === 3 && (
          <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <GraduationCap size={18} />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono">3. Cursus</h2>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Semestre actuel</label>
              <select 
                value={form.currentSemester} onChange={(e) => setForm({ ...form, currentSemester: e.target.value })}
                className="w-full bg-background border border-border rounded-input py-3 px-4 text-sm focus:outline-none focus:border-secondary cursor-pointer"
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
              <label className="text-xs font-medium text-text-muted">Objectif ECTS (180 pour un BA)</label>
              <input 
                type="number" value={form.targetECTS} onChange={(e) => setForm({ ...form, targetECTS: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-input py-3 px-4 text-sm font-mono focus:outline-none focus:border-secondary"
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 4 : BARÈME */}
        {step === 4 && (
          <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-secondary mb-1">
              <Calendar size={18} />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono">4. Barème Suisse</h2>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted">Seuil de réussite académique</label>
              <select 
                value={form.passingGrade} onChange={(e) => setForm({ ...form, passingGrade: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-input py-3 px-4 text-sm focus:outline-none focus:border-secondary cursor-pointer"
              >
                <option value={4.0}>4.0 (Standard UNIL/UNIGE)</option>
                <option value={4.5}>4.5</option>
              </select>
              <p className="text-[11px] text-text-muted mt-2 leading-relaxed border-l-2 border-border pl-3">
                L'application configurera automatiquement les statistiques de réussite sur la base d'une échelle allant jusqu'à 6.0.
              </p>
            </div>
          </div>
        )}

        {/* NAVIGATION BOTTOM */}
        {step > 1 && (
          <div className="flex items-center gap-3 mt-2">
            <button 
              type="button" onClick={handlePrev}
              className="px-5 py-3.5 rounded-btn bg-surface-elevated border border-border text-text font-medium text-sm hover:bg-surface-interactive transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft size={16} /> <span>Retour</span>
            </button>
            
            {step < 4 ? (
              <button 
                type="button" onClick={handleNext}
                className="flex-1 bg-secondary text-white rounded-btn py-3.5 px-4 flex items-center justify-center gap-2 font-semibold hover:bg-secondary/90 transition-colors cursor-pointer shadow-md"
              >
                <span>Continuer</span> <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                type="button" disabled={loading} onClick={handleFinish}
                className="flex-1 bg-accent text-background rounded-btn py-3.5 px-4 flex items-center justify-center gap-2 font-bold glow-gold hover:bg-accent-strong transition-colors disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>{loading ? 'Création...' : 'Terminer et démarrer'}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

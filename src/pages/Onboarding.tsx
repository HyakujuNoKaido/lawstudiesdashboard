import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Check } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const handleComplete = () => {
    // Plus tard : Sauvegarde dans Supabase Profile
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      
      <div className="w-full max-w-md flex flex-col gap-8">
        
        {/* En-tête / Progression */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 bg-surface-elevated rounded-xl flex items-center justify-center border border-border">
            <BookOpen className="text-accent" size={24} />
          </div>
          <div>
            <h1 className="font-serif text-3xl mb-2">Bienvenue sur Lexi</h1>
            <p className="text-text-muted text-sm">
              Étape {step} sur 3 • {step === 1 ? 'Votre université' : step === 2 ? 'Votre programme' : 'Système de notation'}
            </p>
          </div>
        </div>

        {/* Formulaires par étape */}
        <Card className="flex flex-col gap-6 p-6">
          
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text">Université / Faculté</label>
                <select className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none">
                  <option value="">Sélectionnez un établissement...</option>
                  <option value="unige">Université de Genève (UNIGE)</option>
                  <option value="unil">Université de Lausanne (UNIL)</option>
                  <option value="unine">Université de Neuchâtel (UNINE)</option>
                  <option value="unifr">Université de Fribourg (UNIFR)</option>
                  <option value="autre">Autre établissement</option>
                </select>
              </div>
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-accent text-background rounded-md py-3 px-4 flex items-center justify-center gap-2 font-medium mt-2 hover:bg-accent-strong transition-colors"
              >
                <span>Continuer</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text">Niveau d'études</label>
                <select className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none">
                  <option value="bachelor">Bachelor en Droit (180 ECTS)</option>
                  <option value="master">Master en Droit (90 ECTS)</option>
                  <option value="master120">Master en Droit (120 ECTS)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text">Semestre actuel</label>
                <input 
                  type="number" 
                  defaultValue={1}
                  min={1}
                  max={12}
                  className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <button 
                onClick={() => setStep(3)}
                className="w-full bg-accent text-background rounded-md py-3 px-4 flex items-center justify-center gap-2 font-medium mt-2 hover:bg-accent-strong transition-colors"
              >
                <span>Continuer</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
              <p className="text-sm text-text-muted mb-2">Lexi est préconfiguré pour le système de notation suisse.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-text-muted">Note minimale</label>
                  <input type="number" step="0.1" defaultValue={1.0} className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm" disabled />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-text-muted">Note maximale</label>
                  <input type="number" step="0.1" defaultValue={6.0} className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm" disabled />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text">Seuil de validation</label>
                <input 
                  type="number" 
                  step="0.1" 
                  defaultValue={4.0} 
                  className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <button 
                onClick={handleComplete}
                className="w-full bg-success text-background rounded-md py-3 px-4 flex items-center justify-center gap-2 font-medium mt-2 hover:bg-success/90 transition-colors"
              >
                <Check size={18} />
                <span>Terminer et accéder à Lexi</span>
              </button>
            </div>
          )}

        </Card>

      </div>
    </div>
  );
}

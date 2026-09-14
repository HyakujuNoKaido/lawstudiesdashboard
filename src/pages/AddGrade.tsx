import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Calculator, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function AddGrade() {
  const navigate = useNavigate();
  const [simulatedGrade, setSimulatedGrade] = useState<string>('');
  
  // Constantes suisses de démonstration
  const CREDITS = 12;
  const CURRENT_AVERAGE = 4.2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/courses/1');
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Annuler</span>
        </button>

        <div>
          <h1 className="font-serif text-3xl mb-1">Saisir une note</h1>
          <p className="text-text-muted text-sm">Ajoutez un résultat d'examen ou un contrôle continu.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">Cours / Matière</label>
          <select className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none">
            <option value="1">Droit des obligations (12 ECTS)</option>
            <option value="2">Droit pénal général (9 ECTS)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Note obtenue</label>
            <input 
              type="number" 
              step="0.25"
              min="1.0"
              max="6.0"
              placeholder="ex: 4.5"
              required
              className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent"
              onChange={(e) => setSimulatedGrade(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Poids (%)</label>
            <input 
              type="number" 
              defaultValue={100}
              min="0"
              max="100"
              className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">Type d'évaluation</label>
          <select className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none">
            <option value="exam">Examen final (1ère tentative)</option>
            <option value="exam_retake">Examen final (Rattrapage)</option>
            <option value="continuous">Contrôle continu</option>
            <option value="paper">Travail écrit / Séminaire</option>
          </select>
        </div>

        {/* Simulateur */}
        <Card className="mt-2 border-info/20 bg-info/5">
          <div className="flex items-center gap-2 text-info mb-3">
            <Calculator size={18} />
            <h3 className="font-medium text-sm">Simulateur d'impact</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-text-muted">Moyenne actuelle</span>
              <span className="font-medium">{CURRENT_AVERAGE.toFixed(2)}</span>
            </div>
            
            <div className="text-text-muted">→</div>
            
            <div className="flex flex-col text-right">
              <span className="text-xs text-text-muted">Moyenne projetée</span>
              <span className={`font-medium ${simulatedGrade && parseFloat(simulatedGrade) >= 4.0 ? 'text-success' : simulatedGrade ? 'text-warning' : 'text-text'}`}>
                {simulatedGrade 
                  ? ((CURRENT_AVERAGE * 168 + parseFloat(simulatedGrade) * CREDITS) / 180).toFixed(2)
                  : '--'}
              </span>
            </div>
          </div>
          
          <div className="mt-3 flex items-start gap-2 text-[10px] text-text-muted">
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            <p>Il s'agit d'une estimation. Les règlements stricts de votre université prévalent toujours sur ce calcul.</p>
          </div>
        </Card>

        <button 
          type="submit"
          className="mt-4 w-full bg-accent text-background rounded-md py-3.5 px-4 flex items-center justify-center gap-2 font-medium hover:bg-accent-strong transition-colors"
        >
          <Save size={18} />
          <span>Enregistrer la note</span>
        </button>

      </form>
    </div>
  );
}

import React, { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { GraduationCap, Clock, BrainCircuit, CheckCircle2, Circle } from 'lucide-react';
import { calculateAcademicProgress, CourseRecord } from '../lib/ects';

// Données brutes simulées (viendront de Supabase via un hook)
const MOCK_DB_COURSES: CourseRecord[] = [
  { id: '1', ects: 12, grade: 5.5, status: 'valide' },
  { id: '2', ects: 6, grade: 4.0, status: 'valide' },
  { id: '3', ects: 9, grade: 3.5, status: 'a_reprendre' },
  { id: '4', ects: 18, grade: 4.5, status: 'valide' },
  { id: '5', ects: 12, status: 'en_cours' },
  { id: '6', ects: 6, status: 'en_cours' }
];

export function Dashboard() {
  // Calcul dynamique des statistiques
  const progress = useMemo(() => calculateAcademicProgress(MOCK_DB_COURSES, 180), []);

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header>
        <h1 className="font-serif text-3xl mb-1">Bonjour, Alex</h1>
        <p className="text-text-muted text-sm font-medium">
          Lundi 14 septembre • Semestre d'automne
        </p>
      </header>

      <section>
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-text-muted">
              <GraduationCap size={18} />
              <span className="text-xs uppercase tracking-wider font-semibold">Progression Bachelor</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-serif text-accent">
                {progress.ectsObtained} <span className="text-sm text-text-muted font-sans">/ {progress.totalRequired} ECTS</span>
              </span>
              {progress.weightedAverage && (
                <div className="text-xs font-medium text-success mt-1">
                  Moyenne pondérée : {progress.weightedAverage.toFixed(2)}
                </div>
              )}
            </div>
          </div>
          
          <ProgressBar value={progress.ectsObtained} max={progress.totalRequired} />
          
          <div className="flex justify-between items-center text-xs text-text-muted mt-3">
            <span>{progress.completionPercentage}% complété</span>
            <div className="flex gap-3">
              <span>{progress.ectsInProgress} ECTS en cours</span>
              <span>{progress.ectsRemaining} restants</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card onClick={() => console.log('Ouvrir échéance')}>
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Clock size={16} />
            <span className="text-xs uppercase tracking-wider font-semibold">Prochaine échéance</span>
          </div>
          <p className="font-medium text-text mt-1">Séminaire Droit des obligations</p>
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-text-muted bg-surface-elevated px-2 py-1 rounded-sm">Aujourd'hui, 14:15</span>
            <span className="text-xs text-info">Salle B112</span>
          </div>
        </Card>

        <Card onClick={() => console.log('Ouvrir révision')}>
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <BrainCircuit size={16} />
            <span className="text-xs uppercase tracking-wider font-semibold">Révision du jour</span>
          </div>
          <p className="font-medium text-text mt-1">Droit pénal général</p>
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-text-muted bg-surface-elevated px-2 py-1 rounded-sm">42 cartes dues</span>
            <span className="text-xs text-accent-strong">~15 min</span>
          </div>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-xl">À faire aujourd'hui</h2>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3 p-3 bg-surface rounded-md border border-border group cursor-pointer hover:border-text-muted/40 transition-colors">
            <button className="text-text-muted group-hover:text-accent mt-0.5 transition-colors">
              <Circle size={20} strokeWidth={2} />
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium">Lire l'arrêt ATF 123 IV 56</p>
              <p className="text-xs text-text-muted mt-1">Droit pénal • Pour le séminaire de demain</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-surface rounded-md border border-border/50 opacity-60">
            <button className="text-success mt-0.5">
              <CheckCircle2 size={20} strokeWidth={2} />
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium line-through decoration-text-muted/50">Imprimer le plan d'études</p>
              <p className="text-xs text-text-muted mt-1">Général</p>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}

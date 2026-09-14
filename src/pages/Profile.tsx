import React from 'react';
import { UserRound, LogOut, Settings2, GraduationCap, BrainCircuit, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function Profile() {
  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      {/* En-tête */}
      <header>
        <h1 className="font-serif text-3xl mb-1">Profil</h1>
        <p className="text-text-muted text-sm">Gérez vos paramètres académiques et préférences.</p>
      </header>

      {/* Section Identité */}
      <Card className="flex items-center gap-4">
        <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center text-text-muted border border-border">
          <UserRound size={32} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-medium">Alexandre étudiant</h2>
          <p className="text-sm text-text-muted mt-0.5">Université de Genève (UNIGE)</p>
        </div>
      </Card>

      {/* Section Académique */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <GraduationCap size={18} className="text-accent" />
          <h2 className="font-serif text-xl">Cursus & Notation</h2>
        </div>
        <div className="bg-surface border border-border rounded-md divide-y divide-border">
          
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Programme actuel</p>
              <p className="text-xs text-text-muted mt-0.5">Bachelor en Droit (180 ECTS)</p>
            </div>
            <button className="text-text-muted hover:text-text"><ChevronRight size={18} /></button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Échelle de notation suisse</p>
              <p className="text-xs text-text-muted mt-0.5">Notes de 1.0 à 6.0 (Seuil de validation: 4.0)</p>
            </div>
            <button className="text-text-muted hover:text-text"><ChevronRight size={18} /></button>
          </div>

        </div>
      </section>

      {/* Section Révisions */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <BrainCircuit size={18} className="text-info" />
          <h2 className="font-serif text-xl">Répétition Espacée</h2>
        </div>
        <div className="bg-surface border border-border rounded-md divide-y divide-border">
          
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Nouvelles cartes par jour</p>
              <p className="text-xs text-text-muted mt-0.5">Limite actuelle : 20 cartes/jour</p>
            </div>
            <span className="text-sm font-medium bg-surface-elevated px-3 py-1 rounded-sm border border-border">20</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Heure du rappel quotidien</p>
              <p className="text-xs text-text-muted mt-0.5">Notifications push activées</p>
            </div>
            <span className="text-sm font-medium bg-surface-elevated px-3 py-1 rounded-sm border border-border">18:00</span>
          </div>

        </div>
      </section>

      {/* Section Système */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Settings2 size={18} className="text-text-muted" />
          <h2 className="font-serif text-xl">Application</h2>
        </div>
        <div className="bg-surface border border-border rounded-md divide-y divide-border">
          
          <button className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-elevated/50 transition-colors">
            <span className="font-medium text-sm">Exporter mes données (JSON/CSV)</span>
            <ChevronRight size={18} className="text-text-muted" />
          </button>
          
          <button className="w-full p-4 flex items-center gap-2 text-left text-danger hover:bg-danger/5 transition-colors">
            <LogOut size={18} />
            <span className="font-medium text-sm">Se déconnecter</span>
          </button>

        </div>
      </section>

    </div>
  );
}

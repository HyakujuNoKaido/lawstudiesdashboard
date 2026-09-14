import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

// Données de démonstration
const MOCK_CARD = {
  deckName: 'Droit des obligations (CO)',
  current: 12,
  total: 42,
  front: "Quelles sont les quatre conditions cumulatives de la responsabilité civile extracontractuelle selon l'art. 41 CO ?",
  back: "1. Un préjudice (dommage ou tort moral)\n2. Un acte illicite\n3. Un lien de causalité (naturelle et adéquate)\n4. Une faute (intentionnelle ou par négligence)",
  tags: ["Art. 41 CO", "RC"]
};

export function StudySession() {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);

  const handleMasteryChoice = (quality: 'again' | 'hard' | 'good' | 'easy') => {
    // Ici, nous appellerons la fonction calculateNextReview(currentState, quality)
    // puis nous passerons à la carte suivante.
    console.log(`Qualité sélectionnée : ${quality}`);
    setIsFlipped(false);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-in slide-in-from-bottom-2 duration-300">
      
      {/* En-tête de session */}
      <header className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-surface">
        <div className="flex-1">
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1">
            {MOCK_CARD.deckName}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              Carte {MOCK_CARD.current} <span className="text-text-muted">/ {MOCK_CARD.total}</span>
            </span>
            {/* Mini barre de progression */}
            <div className="w-24 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${(MOCK_CARD.current / MOCK_CARD.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-muted hover:text-text transition-colors"
          aria-label="Quitter la session"
        >
          <X size={20} />
        </button>
      </header>

      {/* Zone de la carte */}
      <main className="flex-1 flex flex-col p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div 
          className="flex-1 bg-surface border border-border rounded-lg p-6 md:p-10 flex flex-col justify-center relative shadow-sm"
        >
          {/* Tags */}
          <div className="absolute top-4 left-4 flex gap-2">
            {MOCK_CARD.tags.map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-text-muted bg-surface-elevated px-2 py-1 rounded-sm">
                {tag}
              </span>
            ))}
          </div>

          {/* Recto */}
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-medium leading-relaxed">
              {MOCK_CARD.front}
            </h2>
          </div>

          {/* Verso (révélé) */}
          {isFlipped && (
            <div className="mt-8 pt-8 border-t border-border animate-in fade-in duration-300">
              <div className="text-text-muted whitespace-pre-line text-lg md:text-xl leading-relaxed text-center">
                {MOCK_CARD.back}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Contrôles inférieurs */}
      <footer className="p-4 md:p-8 pb-safe bg-background max-w-2xl mx-auto w-full">
        {!isFlipped ? (
          <button 
            onClick={() => setIsFlipped(true)}
            className="w-full py-4 bg-surface-elevated hover:bg-border text-text rounded-md font-medium text-lg transition-colors border border-border active:scale-[0.98]"
          >
            Afficher la réponse
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2 md:gap-4 animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => handleMasteryChoice('again')}
              className="flex flex-col items-center justify-center gap-1 py-3 bg-surface-elevated hover:bg-border border border-border rounded-md transition-colors active:scale-95"
            >
              <span className="text-danger font-semibold text-sm">À revoir</span>
              <span className="text-[10px] text-text-muted font-medium">&lt; 1 min</span>
            </button>
            <button 
              onClick={() => handleMasteryChoice('hard')}
              className="flex flex-col items-center justify-center gap-1 py-3 bg-surface-elevated hover:bg-border border border-border rounded-md transition-colors active:scale-95"
            >
              <span className="text-warning font-semibold text-sm">Difficile</span>
              <span className="text-[10px] text-text-muted font-medium">10 min</span>
            </button>
            <button 
              onClick={() => handleMasteryChoice('good')}
              className="flex flex-col items-center justify-center gap-1 py-3 bg-surface-elevated hover:bg-border border border-border rounded-md transition-colors active:scale-95"
            >
              <span className="text-accent font-semibold text-sm">Bien</span>
              <span className="text-[10px] text-text-muted font-medium">1 j</span>
            </button>
            <button 
              onClick={() => handleMasteryChoice('easy')}
              className="flex flex-col items-center justify-center gap-1 py-3 bg-surface-elevated hover:bg-border border border-border rounded-md transition-colors active:scale-95"
            >
              <span className="text-success font-semibold text-sm">Facile</span>
              <span className="text-[10px] text-text-muted font-medium">4 j</span>
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

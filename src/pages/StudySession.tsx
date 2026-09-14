import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, RotateCw, CheckCircle2, BrainCircuit, Award } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { fetchFlashcards, updateFlashcardProgress } from '../services/supabaseService';
import { calculateSM2 } from '../lib/spacedRepetition';

export function StudySession() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    loadCards();
  }, [deckId]);

  async function loadCards() {
    try {
      // Si deckId est spécifique ou général
      const cards = deckId && deckId !== 'all' ? await fetchFlashcards(deckId) : await fetchFlashcards();
      setFlashcards(cards);
    } catch (err) {
      console.error("Erreur chargement flashcards:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleRating = async (quality: number) => {
    if (flashcards.length === 0) return;
    const currentCard = flashcards[currentIndex];

    const currentRepetitions = currentCard.repetitions || 0;
    const currentInterval = currentCard.interval_days || 1;
    const currentEaseFactor = currentCard.ease_factor || 2.5;

    // Application de l'algorithme SM-2
    const result = calculateSM2(quality, currentRepetitions, currentInterval, currentEaseFactor);

    try {
      await updateFlashcardProgress(currentCard.id, result.repetitions, result.intervalDays, result.easeFactor);
      
      if (currentIndex + 1 < flashcards.length) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    } catch (err) {
      console.error("Erreur mise à jour progression flashcard:", err);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-text-muted text-sm">Préparation de la session de révision...</div>;
  }

  if (sessionCompleted || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center animate-in fade-in duration-300 text-text max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-success/10 border border-success/20 flex items-center justify-center text-success mb-2">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-serif text-2xl font-bold">Session terminée !</h1>
        <p className="text-text-muted text-xs">Tu as consolidé ta mémoire à long terme selon l'algorithme de répétition espacée.</p>
        <button 
          onClick={() => navigate('/study')}
          className="mt-4 w-full bg-accent text-background py-3 rounded-xl font-semibold text-sm glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
        >
          Retour aux révisions
        </button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 max-w-xl mx-auto w-full text-text">
      
      <header className="flex justify-between items-center px-1">
        <button 
          onClick={() => navigate('/study')}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 cursor-pointer"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Quitter</span>
        </button>
        <span className="text-xs font-mono text-text-muted">
          Carte {currentIndex + 1} sur {flashcards.length}
        </span>
      </header>

      {/* Carte Interactive Recto/Verso */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="min-h-[320px] bg-surface border border-border rounded-3xl p-8 flex flex-col justify-between cursor-pointer hover:border-accent/50 transition-all shadow-xl relative overflow-hidden group"
      >
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
            {isFlipped ? "Verso (Réponse)" : "Recto (Question)"}
          </span>
          <RotateCw size={16} className="text-text-muted group-hover:text-accent transition-colors" />
        </div>

        <div className="my-auto py-6 text-center">
          <p className="font-serif text-xl md:text-2xl font-medium text-text leading-relaxed">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
        </div>

        <div className="text-center text-[11px] text-text-muted">
          Clique sur la carte pour {isFlipped ? "voir la question" : "découvrir la réponse"}
        </div>
      </div>

      {/* Boutons d'évaluation SM-2 (visibles uniquement une fois la carte retournée) */}
      {isFlipped && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-200">
          <p className="text-xs font-medium text-text-muted text-center">Évalue ta mémorisation :</p>
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => handleRating(1)}
              className="bg-danger/10 border border-danger/30 text-danger py-3 rounded-xl text-xs font-semibold hover:bg-danger/20 transition-colors cursor-pointer"
            >
              À revoir (1)
            </button>
            <button 
              onClick={() => handleRating(3)}
              className="bg-warning/10 border border-warning/30 text-warning py-3 rounded-xl text-xs font-semibold hover:bg-warning/20 transition-colors cursor-pointer"
            >
              Correct (3)
            </button>
            <button 
              onClick={() => handleRating(4)}
              className="bg-info/10 border border-info/30 text-info py-3 rounded-xl text-xs font-semibold hover:bg-info/20 transition-colors cursor-pointer"
            >
              Bien (4)
            </button>
            <button 
              onClick={() => handleRating(5)}
              className="bg-success/10 border border-success/30 text-success py-3 rounded-xl text-xs font-semibold hover:bg-success/20 transition-colors cursor-pointer"
            >
              Parfait (5)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

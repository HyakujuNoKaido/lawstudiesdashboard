import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, BrainCircuit, Check, RotateCcw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { fetchFlashcards, updateFlashcardProgress } from '../services/supabaseService';

export function StudySession() {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashcards().then(data => {
      setCards(data);
    }).finally(() => setLoading(false));
  }, []);

  const handleAnswer = async (quality: number) => {
    const card = cards[currentIndex];
    if (card) {
      try {
        const newRepetitions = (card.repetitions || 0) + 1;
        const interval = quality >= 3 ? (card.interval_days || 1) * 2 : 1;
        await updateFlashcardProgress(card.id, newRepetitions, interval, card.ease_factor || 2.5);
      } catch (err) {
        console.error("Erreur mise à jour flashcard:", err);
      }
    }

    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert("Session de révision terminée !");
      navigate('/study');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-text-muted text-sm">Chargement des cartes...</div>;
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <BrainCircuit size={48} className="text-text-muted" />
        <p className="text-text-muted text-sm text-center">Aucune flashcard disponible pour le moment.</p>
        <button onClick={() => navigate('/study')} className="px-4 py-2 bg-accent text-background rounded-md text-sm font-medium">
          Retour aux révisions
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 md:p-8 max-w-xl mx-auto justify-between animate-in fade-in duration-300">
      
      <header className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/study')}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Quitter</span>
        </button>
        <span className="text-xs text-text-muted font-medium">
          Carte {currentIndex + 1} / {cards.length}
        </span>
      </header>

      <main className="my-auto py-8">
        <Card 
          onClick={() => setIsFlipped(!isFlipped)}
          className="min-h-[280px] p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none relative shadow-lg hover:border-accent/40 transition-all"
        >
          <span className="absolute top-4 left-4 text-[10px] uppercase tracking-wider font-semibold text-text-muted">
            {isFlipped ? 'Réponse' : 'Question'}
          </span>
          
          <p className="font-serif text-xl md:text-2xl my-auto">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>

          <span className="absolute bottom-4 text-xs text-text-muted flex items-center gap-1">
            <RotateCcw size={12} />
            <span>Appuyez pour retourner</span>
          </span>
        </Card>
      </main>

      {isFlipped ? (
        <footer className="grid grid-cols-3 gap-3 pb-4">
          <button 
            onClick={() => handleAnswer(1)}
            className="py-3 bg-danger/10 text-danger rounded-lg font-medium text-xs hover:bg-danger/20 transition-colors"
          >
            À revoir (1)
          </button>
          <button 
            onClick={() => handleAnswer(3)}
            className="py-3 bg-warning/10 text-warning rounded-lg font-medium text-xs hover:bg-warning/20 transition-colors"
          >
            Bien (3)
          </button>
          <button 
            onClick={() => handleAnswer(5)}
            className="py-3 bg-success/10 text-success rounded-lg font-medium text-xs hover:bg-success/20 transition-colors"
          >
            Maîtrisé (5)
          </button>
        </footer>
      ) : (
        <footer className="pb-4">
          <button 
            onClick={() => setIsFlipped(true)}
            className="w-full bg-accent text-background rounded-md py-3.5 font-medium text-sm hover:bg-accent-strong transition-colors"
          >
            Afficher la réponse
          </button>
        </footer>
      )}

    </div>
  );
}

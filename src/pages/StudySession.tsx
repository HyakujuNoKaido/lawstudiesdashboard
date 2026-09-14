import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, RotateCw, CheckCircle2, ListFilter, Keyboard, Settings2, ArrowRight } from 'lucide-react';
import { fetchFlashcards, updateFlashcardProgress } from '../services/supabaseService';
import { calculateSM2 } from '../lib/spacedRepetition';

type LearningMode = 'sm2' | 'qcm' | 'type';

export function StudySession() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Options Quizlet-like
  const [learningMode, setLearningMode] = useState<LearningMode>('sm2');
  const [isReversed, setIsReversed] = useState(false);
  
  // État pour les modes QCM et Saisie
  const [qcmOptions, setQcmOptions] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    loadCards();
  }, [deckId]);

  async function loadCards() {
    try {
      const cards = deckId && deckId !== 'all' ? await fetchFlashcards(deckId) : await fetchFlashcards();
      // On mélange les cartes dues
      const dueCards = cards.filter(f => new Date(f.due_at) <= new Date());
      setFlashcards(dueCards.sort(() => 0.5 - Math.random()));
    } catch (err) {
      console.error("Erreur chargement flashcards:", err);
    } finally {
      setLoading(false);
    }
  }

  const currentCard = flashcards[currentIndex];
  const questionText = currentCard ? (isReversed ? currentCard.back : currentCard.front) : '';
  const answerText = currentCard ? (isReversed ? currentCard.front : currentCard.back) : '';

  // Générateur de fausses réponses pour le mode QCM
  useEffect(() => {
    if (learningMode === 'qcm' && currentCard) {
      const allAnswers = flashcards.map(f => isReversed ? f.front : f.back);
      const otherAnswers = allAnswers.filter(a => a !== answerText);
      const shuffledOthers = otherAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
      setQcmOptions([...shuffledOthers, answerText].sort(() => 0.5 - Math.random()));
      setFeedback(null);
    }
  }, [currentIndex, learningMode, isReversed, currentCard, flashcards]);

  // Logique d'évaluation (Commune à tous les modes)
  const handleRating = useCallback(async (quality: number) => {
    if (!currentCard) return;

    const currentRepetitions = currentCard.repetitions || 0;
    const currentInterval = currentCard.interval_days || 1;
    const currentEaseFactor = currentCard.ease_factor || 2.5;

    const result = calculateSM2(quality, currentRepetitions, currentInterval, currentEaseFactor);

    try {
      await updateFlashcardProgress(currentCard.id, result.repetitions, result.intervalDays, result.easeFactor);
      
      if (currentIndex + 1 < flashcards.length) {
        setIsFlipped(false);
        setTypedAnswer('');
        setFeedback(null);
        setCurrentIndex(prev => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    } catch (err) {
      console.error("Erreur mise à jour flashcard:", err);
    }
  }, [currentCard, currentIndex, flashcards.length]);

  // Raccourcis Clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si l'utilisateur tape dans l'input (Mode Saisie)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (learningMode === 'sm2') {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsFlipped(prev => !prev);
        }
        if (isFlipped) {
          if (e.key === '1') { e.preventDefault(); handleRating(1); } // À revoir
          if (e.key === '2') { e.preventDefault(); handleRating(3); } // Correct
          if (e.key === '3') { e.preventDefault(); handleRating(4); } // Bien
          if (e.key === '4') { e.preventDefault(); handleRating(5); } // Parfait
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [learningMode, isFlipped, handleRating]);


  // Mode QCM Logic
  const handleQcmChoice = (choice: string) => {
    if (choice === answerText) {
      setFeedback('correct');
      setTimeout(() => handleRating(4), 1000); // 4 = Bien
    } else {
      setFeedback('wrong');
      setTimeout(() => handleRating(1), 1500); // 1 = À revoir
    }
  };

  // Mode Saisie Logic
  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim()) return;

    // Normalisation basique (minuscules, pas d'espaces superflus)
    const normalizedTyped = typedAnswer.toLowerCase().trim();
    const normalizedAnswer = answerText.toLowerCase().trim();

    if (normalizedTyped === normalizedAnswer) {
      setFeedback('correct');
      setTimeout(() => handleRating(5), 1000); // 5 = Parfait
    } else {
      setFeedback('wrong');
      setTimeout(() => handleRating(1), 2000); // Laisser le temps de voir l'erreur
    }
  };


  if (loading) return <div className="text-center py-20 text-text-muted text-sm">Préparation du deck...</div>;

  if (sessionCompleted || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center animate-in fade-in duration-300 text-text max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-3xl bg-success/10 border border-success/20 flex items-center justify-center text-success mb-2">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-serif text-2xl font-bold">Session terminée !</h1>
        <p className="text-text-muted text-xs">Tu as révisé toutes les cartes dues. Super travail.</p>
        <button 
          onClick={() => navigate('/study')}
          className="mt-4 w-full bg-accent text-background py-3.5 rounded-xl font-bold glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
        >
          Retourner au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pt-2 pb-16 animate-in fade-in duration-300 max-w-2xl mx-auto w-full text-text px-2">
      
      {/* HEADER & SETTINGS */}
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/study')} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 cursor-pointer">
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Quitter</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-surface border border-border rounded-lg p-1 flex">
              <button 
                onClick={() => setLearningMode('sm2')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${learningMode === 'sm2' ? 'bg-accent/10 text-accent' : 'text-text-muted'}`}
                title="Classique (Auto-évaluation)"
              ><RotateCw size={16} /></button>
              <button 
                onClick={() => { setLearningMode('qcm'); setIsFlipped(true); }}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${learningMode === 'qcm' ? 'bg-accent/10 text-accent' : 'text-text-muted'}`}
                title="QCM"
              ><ListFilter size={16} /></button>
              <button 
                onClick={() => { setLearningMode('type'); setIsFlipped(true); }}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${learningMode === 'type' ? 'bg-accent/10 text-accent' : 'text-text-muted'}`}
                title="Saisie au clavier"
              ><Keyboard size={16} /></button>
            </div>

            <button 
              onClick={() => setIsReversed(!isReversed)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                isReversed ? 'border-accent text-accent bg-accent/5' : 'border-border bg-surface text-text-muted'
              }`}
              title="Inverser Question / Réponse"
            >
              <Settings2 size={14} />
              <span className="hidden sm:inline">Inverser</span>
            </button>
          </div>
        </div>

        <div className="w-full bg-surface border border-border rounded-full h-2 overflow-hidden">
          <div className="bg-accent h-full transition-all duration-300" style={{ width: `${(currentIndex / flashcards.length) * 100}%` }} />
        </div>
      </header>

      {/* --- MODE SM2 CLASSIQUE --- */}
      {learningMode === 'sm2' && (
        <>
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[300px] md:min-h-[380px] bg-surface border border-border rounded-3xl p-8 flex flex-col justify-between cursor-pointer hover:border-accent/40 transition-all shadow-xl relative overflow-hidden group"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                {isFlipped ? "Verso" : "Recto"}
              </span>
              <RotateCw size={16} className="text-text-muted group-hover:text-accent transition-colors" />
            </div>

            <div className="my-auto py-6 text-center">
              <p className="font-serif text-2xl md:text-3xl font-medium text-text leading-relaxed">
                {isFlipped ? answerText : questionText}
              </p>
            </div>

            <div className="text-center text-[11px] text-text-muted flex items-center justify-center gap-2">
              <span className="hidden sm:inline bg-surface-elevated border border-border px-1.5 py-0.5 rounded font-mono">Espace</span>
              <span>pour retourner</span>
            </div>
          </div>

          {isFlipped && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleRating(1)} className="flex flex-col items-center justify-center gap-1 bg-danger/10 border border-danger/30 text-danger py-3 rounded-xl hover:bg-danger/20 transition-colors cursor-pointer">
                  <span className="text-xs font-bold uppercase">À revoir</span>
                  <span className="hidden sm:inline text-[9px] opacity-70 bg-danger/10 px-1 rounded font-mono">1</span>
                </button>
                <button onClick={() => handleRating(3)} className="flex flex-col items-center justify-center gap-1 bg-warning/10 border border-warning/30 text-warning py-3 rounded-xl hover:bg-warning/20 transition-colors cursor-pointer">
                  <span className="text-xs font-bold uppercase">Difficile</span>
                  <span className="hidden sm:inline text-[9px] opacity-70 bg-warning/10 px-1 rounded font-mono">2</span>
                </button>
                <button onClick={() => handleRating(4)} className="flex flex-col items-center justify-center gap-1 bg-info/10 border border-info/30 text-info py-3 rounded-xl hover:bg-info/20 transition-colors cursor-pointer">
                  <span className="text-xs font-bold uppercase">Bien</span>
                  <span className="hidden sm:inline text-[9px] opacity-70 bg-info/10 px-1 rounded font-mono">3</span>
                </button>
                <button onClick={() => handleRating(5)} className="flex flex-col items-center justify-center gap-1 bg-success/10 border border-success/30 text-success py-3 rounded-xl hover:bg-success/20 transition-colors cursor-pointer">
                  <span className="text-xs font-bold uppercase">Parfait</span>
                  <span className="hidden sm:inline text-[9px] opacity-70 bg-success/10 px-1 rounded font-mono">4</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}


      {/* --- MODE QCM --- */}
      {learningMode === 'qcm' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="min-h-[150px] bg-surface-elevated border border-border rounded-3xl p-6 flex flex-col justify-center items-center shadow-lg">
             <p className="font-serif text-xl md:text-2xl font-medium text-center">{questionText}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {qcmOptions.map((opt, idx) => {
              let btnClass = "bg-surface border-border hover:border-accent";
              if (feedback === 'correct' && opt === answerText) btnClass = "bg-success/20 border-success text-success";
              if (feedback === 'wrong') {
                if (opt === answerText) btnClass = "bg-success/20 border-success text-success";
                else btnClass = "bg-danger/20 border-danger text-danger opacity-50";
              }

              return (
                <button 
                  key={idx}
                  disabled={feedback !== null}
                  onClick={() => handleQcmChoice(opt)}
                  className={`p-4 rounded-2xl border text-sm font-medium text-left transition-all ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}


      {/* --- MODE SAISIE --- */}
      {learningMode === 'type' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="min-h-[150px] bg-surface-elevated border border-border rounded-3xl p-6 flex flex-col justify-center items-center shadow-lg">
             <p className="font-serif text-xl md:text-2xl font-medium text-center">{questionText}</p>
          </div>

          <form onSubmit={handleTypeSubmit} className="flex flex-col gap-3">
            <input 
              type="text"
              autoFocus
              disabled={feedback !== null}
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Tapez la réponse exacte..."
              className={`w-full bg-surface border rounded-2xl p-4 text-base focus:outline-none transition-colors ${
                feedback === 'correct' ? 'border-success bg-success/10 text-success' : 
                feedback === 'wrong' ? 'border-danger bg-danger/10 text-danger' : 'border-border focus:border-accent text-text'
              }`}
            />
            
            {feedback === 'wrong' && (
              <div className="bg-surface-elevated border border-success/30 rounded-2xl p-4 animate-in slide-in-from-top-2">
                <span className="text-[10px] text-success uppercase font-bold tracking-wider">La bonne réponse était :</span>
                <p className="font-serif text-lg mt-1">{answerText}</p>
              </div>
            )}

            {!feedback && (
              <button 
                type="submit" 
                className="bg-accent text-background py-4 rounded-2xl font-bold flex items-center justify-center gap-2 glow-gold hover:bg-accent-strong"
              >
                Vérifier <ArrowRight size={18} />
              </button>
            )}
          </form>
        </div>
      )}

    </div>
  );
}

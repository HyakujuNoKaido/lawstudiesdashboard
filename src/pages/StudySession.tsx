import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { RotateCw, ListFilter, Keyboard, Settings2, ArrowRight, CheckCircle2, XCircle, Trophy, LayoutGrid, Timer as TimerIcon, ChevronLeft, BrainCircuit, AlertCircle, Flame, EyeOff, Play } from 'lucide-react';
import { fetchFlashcards, updateFlashcardProgress } from '../services/supabaseService';
import { calculateSM2 } from '../lib/spacedRepetition';
import { useApp } from '../context/AppContext';
import { toast } from '../lib/toast';

type LearningMode = 'sm2' | 'qcm' | 'type' | 'match';
type CardSelection = 'due' | 'hard' | 'unseen' | 'all';
type SessionState = 'setup' | 'active' | 'completed';

function isCloseMatch(typed: string, expected: string): 'exact' | 'close' | 'wrong' {
  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim();
  const nTyped = normalize(typed); const nExpected = normalize(expected);
  if (nTyped === nExpected) return 'exact';
  const wordsT = nTyped.split(/\s+/).filter(w => w.length > 3);
  const wordsE = nExpected.split(/\s+/).filter(w => w.length > 3);
  if (wordsE.length === 0) return 'wrong';
  let matchCount = 0;
  wordsE.forEach(we => { if (wordsT.some(wt => wt.includes(we) || we.includes(wt))) matchCount++; });
  if (matchCount / wordsE.length >= 0.6) return 'close';
  return 'wrong';
}

export function StudySession() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addLog } = useApp();
  const fromPath = location.state?.from || '/study';

  const [allCards, setAllCards] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [sessionErrors, setSessionErrors] = useState<string[]>([]);
  
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [loading, setLoading] = useState(true);
  
  // Configuration de la session
  const [config, setConfig] = useState({
    mode: 'sm2' as LearningMode,
    selection: 'due' as CardSelection,
    limit: 20 as number | 'all'
  });

  // États de jeu (Active)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [sessionStats, setSessionStats] = useState({ mastered: 0, difficult: 0, startTime: Date.now() });

  // Mode Saisie
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'close' | 'wrong' | null>(null);

  // Mode QCM
  const [qcmOptions, setQcmOptions] = useState<string[]>([]);

  // Mode Match
  const [matchItems, setMatchItems] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState(0);

  useEffect(() => {
    loadAllCards();
  }, [deckId]);

  async function loadAllCards() {
    try {
      const cards = deckId && deckId !== 'all' ? await fetchFlashcards(deckId) : await fetchFlashcards();
      setAllCards(cards);
    } catch (err) {
      toast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }

  // --- LOGIQUE DE DÉMARRAGE (SETUP) ---
  const startSession = () => {
    let filtered = [...allCards];
    
    if (config.selection === 'due') filtered = filtered.filter(c => !c.due_at || new Date(c.due_at) <= new Date());
    else if (config.selection === 'hard') filtered = filtered.filter(c => c.ease_factor < 2.5 && c.repetitions > 0);
    else if (config.selection === 'unseen') filtered = filtered.filter(c => c.repetitions === 0);

    if (filtered.length === 0) {
      toast("Aucune carte ne correspond à cette sélection.", "warning");
      return;
    }

    filtered = filtered.sort(() => 0.5 - Math.random());

    if (config.limit !== 'all') {
      filtered = filtered.slice(0, config.limit as number);
    }

    setFlashcards(filtered);
    setCurrentIndex(0);
    setSessionErrors([]);
    setSessionStats({ mastered: 0, difficult: 0, startTime: Date.now() });
    setSessionState('active');

    // Préparation Match si sélectionné
    if (config.mode === 'match') {
      const pool = filtered.slice(0, 6);
      const items: any[] = [];
      pool.forEach(c => {
        items.push({ id: `q_${c.id}`, refId: c.id, text: c.front, type: 'q', matched: false });
        items.push({ id: `a_${c.id}`, refId: c.id, text: c.back, type: 'a', matched: false });
      });
      setMatchItems(items.sort(() => 0.5 - Math.random()));
      setMatchScore(0);
    }
  };

  const currentCard = flashcards[currentIndex];
  const questionText = currentCard ? (isReversed ? currentCard.back : currentCard.front) : '';
  const answerText = currentCard ? (isReversed ? currentCard.front : currentCard.back) : '';

  // Effet QCM
  useEffect(() => {
    if (config.mode === 'qcm' && currentCard && sessionState === 'active') {
      const allAnswers = allCards.map(f => isReversed ? f.front : f.back);
      const otherAnswers = allAnswers.filter(a => a !== answerText);
      const shuffledOthers = otherAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
      setQcmOptions([...shuffledOthers, answerText].sort(() => 0.5 - Math.random()));
      setFeedback(null);
    }
  }, [currentIndex, config.mode, isReversed, currentCard, sessionState, allCards, answerText]);

  // Évaluation classique SM-2
  const handleRating = useCallback(async (quality: number) => {
    if (!currentCard) return;
    
    if (quality <= 2) {
      setSessionErrors(prev => prev.includes(currentCard.id) ? prev : [...prev, currentCard.id]);
    }

    const { repetitions = 0, interval_days = 1, ease_factor = 2.5 } = currentCard;
    const result = calculateSM2(quality, repetitions, interval_days, ease_factor);
    
    if (quality >= 4) setSessionStats(s => ({ ...s, mastered: s.mastered + 1 }));
    else if (quality <= 2) setSessionStats(s => ({ ...s, difficult: s.difficult + 1 }));

    try {
      await updateFlashcardProgress(currentCard.id, result.repetitions, result.intervalDays, result.easeFactor);
      if (currentIndex + 1 < flashcards.length) {
        setIsFlipped(false);
        setTypedAnswer('');
        setFeedback(null);
        setCurrentIndex(prev => prev + 1);
      } else {
        setSessionState('completed');
        addLog(`Session terminée : ${flashcards.length} cartes`, 'study');
      }
    } catch (err) {
      toast("Erreur de synchronisation", "warning");
    }
  }, [currentCard, currentIndex, flashcards.length, addLog]);

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim()) return;
    
    const result = isCloseMatch(typedAnswer, answerText);
    setFeedback(result === 'exact' ? 'correct' : result === 'close' ? 'close' : 'wrong');
    
    setTimeout(() => {
      if (result === 'exact') handleRating(5);
      else if (result === 'close') handleRating(4);
      else handleRating(1);
    }, result === 'wrong' ? 3000 : 1500);
  };

  const handleQcmChoice = (choice: string) => {
    const isCorrect = choice === answerText;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => handleRating(isCorrect ? 4 : 1), isCorrect ? 1000 : 2000);
  };

  const handleMatchSelect = (id: string) => {
    if (!selectedMatch) { setSelectedMatch(id); return; }
    const first = matchItems.find(i => i.id === selectedMatch);
    const second = matchItems.find(i => i.id === id);
    
    if (first && second && first.refId === second.refId && first.type !== second.type) {
      setMatchItems(prev => prev.map(i => i.refId === first.refId ? { ...i, matched: true } : i));
      setMatchScore(s => s + 1);
      setSelectedMatch(null);
      if (matchScore + 1 === matchItems.length / 2) {
        setTimeout(() => setSessionState('completed'), 1000);
      }
    } else {
      setSelectedMatch(null); toast("Mauvaise association", "warning");
    }
  };

  // Raccourcis Clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionState !== 'active' || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || config.mode !== 'sm2') return;
      if (e.code === 'Space') { e.preventDefault(); setIsFlipped(prev => !prev); }
      if (isFlipped) {
        if (e.key === '1') { e.preventDefault(); handleRating(1); }
        if (e.key === '2') { e.preventDefault(); handleRating(3); }
        if (e.key === '3') { e.preventDefault(); handleRating(4); }
        if (e.key === '4') { e.preventDefault(); handleRating(5); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.mode, isFlipped, handleRating, sessionState]);

  if (loading) return <div className="text-center py-20 text-text-muted text-sm font-mono animate-pulse">Préparation du deck...</div>;

  // --- VUE 1 : SETUP ---
  if (sessionState === 'setup') {
    const stats = {
      due: allCards.filter(c => !c.due_at || new Date(c.due_at) <= new Date()).length,
      hard: allCards.filter(c => c.ease_factor < 2.5 && c.repetitions > 0).length,
      unseen: allCards.filter(c => c.repetitions === 0).length,
      total: allCards.length
    };

    return (
      <div className="flex flex-col gap-8 pt-4 pb-16 max-w-2xl mx-auto animate-in fade-in duration-300 w-full px-4">
        <header className="flex items-center gap-4 border-b border-border pb-6">
          <button onClick={() => navigate(fromPath)} className="p-2 bg-surface hover:bg-surface-interactive rounded-xl transition-colors cursor-pointer border border-border/50"><ChevronLeft size={20} /></button>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-text">Préparation de la session</h1>
        </header>

        <div className="flex flex-col gap-6">
          {/* STATS DU SET */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <div className="bg-surface border border-border rounded-card p-4 flex flex-col gap-1 items-center text-center">
                <BrainCircuit size={18} className="text-text-muted mb-1" />
                <span className="font-serif text-2xl font-bold text-text">{stats.total}</span>
                <span className="text-[10px] uppercase font-bold text-text-muted">Total</span>
             </div>
             <div className="bg-warning/10 border border-warning/30 rounded-card p-4 flex flex-col gap-1 items-center text-center">
                <AlertCircle size={18} className="text-warning mb-1" />
                <span className="font-serif text-2xl font-bold text-warning">{stats.due}</span>
                <span className="text-[10px] uppercase font-bold text-warning">Dues</span>
             </div>
             <div className="bg-danger/10 border border-danger/30 rounded-card p-4 flex flex-col gap-1 items-center text-center">
                <Flame size={18} className="text-danger mb-1" />
                <span className="font-serif text-2xl font-bold text-danger">{stats.hard}</span>
                <span className="text-[10px] uppercase font-bold text-danger">Difficiles</span>
             </div>
             <div className="bg-surface border border-border rounded-card p-4 flex flex-col gap-1 items-center text-center">
                <EyeOff size={18} className="text-info mb-1" />
                <span className="font-serif text-2xl font-bold text-info">{stats.unseen}</span>
                <span className="text-[10px] uppercase font-bold text-text-muted">Jamais vues</span>
             </div>
          </div>

          {/* CHOIX DU TYPE DE CARTES */}
          <div className="flex flex-col gap-3">
             <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Quelles cartes réviser ?</label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'due', label: 'Dues', icon: AlertCircle },
                  { id: 'hard', label: 'Difficiles', icon: Flame },
                  { id: 'unseen', label: 'Non vues', icon: EyeOff },
                  { id: 'all', label: 'Toutes', icon: BrainCircuit }
                ].map(opt => (
                  <button 
                    key={opt.id} onClick={() => setConfig({...config, selection: opt.id as CardSelection})}
                    className={`py-3 flex flex-col items-center justify-center gap-1.5 rounded-btn border text-xs font-bold transition-all cursor-pointer ${config.selection === opt.id ? 'bg-accent/10 border-accent text-accent shadow-sm' : 'bg-surface border-border text-text-muted hover:border-accent/40'}`}
                  >
                    <opt.icon size={16} /> {opt.label}
                  </button>
                ))}
             </div>
          </div>

          {/* CHOIX DU MODE */}
          <div className="flex flex-col gap-3">
             <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Mode d'apprentissage</label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'sm2', label: 'Adaptatif', icon: RotateCw },
                  { id: 'qcm', label: 'Test QCM', icon: ListFilter },
                  { id: 'type', label: 'Saisie Libre', icon: Keyboard },
                  { id: 'match', label: 'Association', icon: LayoutGrid }
                ].map(opt => (
                  <button 
                    key={opt.id} onClick={() => setConfig({...config, mode: opt.id as LearningMode})}
                    className={`py-3 flex flex-col items-center justify-center gap-1.5 rounded-btn border text-xs font-bold transition-all cursor-pointer ${config.mode === opt.id ? 'bg-accent/10 border-accent text-accent shadow-sm' : 'bg-surface border-border text-text-muted hover:border-accent/40'}`}
                  >
                    <opt.icon size={16} /> {opt.label}
                  </button>
                ))}
             </div>
          </div>

          {/* CHOIX DE LA LIMITE */}
          <div className="flex flex-col gap-3">
             <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Nombre de cartes</label>
             <div className="flex gap-2">
                {[10, 20, 50, 'all'].map(l => (
                  <button 
                    key={l} onClick={() => setConfig({...config, limit: l as number | 'all'})}
                    className={`flex-1 py-2 rounded-btn border text-xs font-bold transition-all cursor-pointer ${config.limit === l ? 'bg-surface-interactive border-text text-text shadow-sm' : 'bg-surface border-border text-text-muted hover:border-text/40'}`}
                  >
                    {l === 'all' ? 'Toutes' : l}
                  </button>
                ))}
             </div>
          </div>

          <button onClick={startSession} className="mt-4 w-full bg-accent text-background py-4 rounded-btn font-bold flex items-center justify-center gap-2 shadow-apple hover:scale-[1.02] transition-transform cursor-pointer glow-gold">
            <Play size={18} className="fill-background" /> Démarrer la session
          </button>
        </div>
      </div>
    );
  }

  // --- VUE 2 : COMPLETED ---
  if (sessionState === 'completed') {
    const timeSpentMins = Math.max(1, Math.round((Date.now() - sessionStats.startTime) / 60000));
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-10 gap-6 text-center animate-in fade-in zoom-in-95 duration-400 max-w-lg mx-auto px-4">
        <div className="w-20 h-20 rounded-full bg-success/10 border-4 border-success/20 flex items-center justify-center text-success mb-2 shadow-apple-subtle">
          <Trophy size={40} />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold mb-2 text-text">Session Terminée</h1>
          <p className="text-text-muted text-sm font-medium">Excellent travail de mémorisation.</p>
        </div>
        
        <div className="grid grid-cols-3 gap-3 w-full my-4">
          <div className="bg-surface-elevated border border-border/50 rounded-card p-4 flex flex-col items-center shadow-sm">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Durée</span>
            <span className="font-serif text-2xl font-bold mt-1 text-info">{timeSpentMins}m</span>
          </div>
          <div className="bg-surface-elevated border border-border/50 rounded-card p-4 flex flex-col items-center shadow-sm">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Maîtrisées</span>
            <span className="font-serif text-2xl font-bold mt-1 text-success">{sessionStats.mastered}</span>
          </div>
          <div className="bg-surface-elevated border border-border/50 rounded-card p-4 flex flex-col items-center shadow-sm">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Erreurs</span>
            <span className="font-serif text-2xl font-bold mt-1 text-danger">{sessionErrors.length}</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-3 mt-2">
          {sessionErrors.length > 0 && (
            <button 
              onClick={() => {
                const errorCards = allCards.filter(c => sessionErrors.includes(c.id));
                setFlashcards(errorCards.sort(() => 0.5 - Math.random()));
                setCurrentIndex(0); setSessionErrors([]); setSessionState('active');
                setSessionStats({ mastered: 0, difficult: 0, startTime: Date.now() });
              }} 
              className="w-full bg-danger/10 text-danger border border-danger/30 py-3.5 rounded-btn font-bold hover:bg-danger/20 transition-colors cursor-pointer"
            >
              Réviser les {sessionErrors.length} erreurs
            </button>
          )}
          <button onClick={startSession} className="w-full bg-surface-interactive text-text py-3.5 rounded-btn font-bold hover:bg-border transition-colors cursor-pointer">
            Recommencer la même session
          </button>
          <button onClick={() => navigate(fromPath)} className="w-full bg-accent text-background py-3.5 rounded-btn font-bold hover:bg-accent-strong cursor-pointer shadow-sm mt-2">
            Retour au Cockpit
          </button>
        </div>
      </div>
    );
  }

  // --- VUE 3 : ACTIVE ---
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] pt-2 pb-6 max-w-3xl mx-auto w-full text-text px-2 animate-in fade-in duration-300">
      <header className="flex flex-col gap-5 shrink-0">
        <div className="flex justify-between items-center">
          <button onClick={() => setSessionState('setup')} className="flex items-center gap-1.5 text-text-muted hover:text-text transition-colors bg-surface-elevated px-3 py-1.5 rounded-btn border border-border/50 cursor-pointer text-xs font-bold shadow-sm">
            <ChevronLeft size={16} /> Quitter
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-surface border border-border rounded-btn px-3 py-1.5 shadow-sm text-xs font-bold text-accent uppercase tracking-wider">
              {config.mode === 'sm2' ? 'Adaptatif' : config.mode === 'qcm' ? 'QCM' : config.mode === 'type' ? 'Saisie' : 'Match'}
            </div>
            {config.mode !== 'match' && (
              <button onClick={() => setIsReversed(!isReversed)} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-btn text-xs font-bold cursor-pointer transition-colors shadow-sm ${isReversed ? 'border-accent text-accent bg-accent/5' : 'border-border bg-surface text-text-muted hover:text-text'}`}>
                <Settings2 size={14} /> <span className="hidden sm:inline">Inverser</span>
              </button>
            )}
          </div>
        </div>
        <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
          <div className="bg-accent h-full transition-all duration-300 ease-out" style={{ width: `${(currentIndex / flashcards.length) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center py-6 relative">
        
        {config.mode === 'sm2' && (
          <div className="flex flex-col h-full justify-between gap-6 max-h-[600px] w-full max-w-2xl mx-auto">
            <div onClick={() => !isFlipped && setIsFlipped(true)} className={`flex-1 bg-surface border border-border/80 rounded-modal p-8 md:p-12 flex flex-col justify-center items-center text-center transition-all shadow-apple-subtle relative group ${!isFlipped ? 'cursor-pointer hover:border-accent/40' : ''}`}>
              <span className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {isFlipped ? "Réponse" : "Question"} {currentIndex + 1} / {flashcards.length}
              </span>
              <p className="font-serif text-2xl md:text-4xl font-medium leading-tight text-text">{isFlipped ? answerText : questionText}</p>
              {!isFlipped && <div className="absolute bottom-6 opacity-50 flex items-center gap-2 text-xs font-mono text-text-muted"><span className="bg-surface-elevated border border-border px-2 py-0.5 rounded">Espace</span> pour révéler</div>}
            </div>
            {isFlipped && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-bottom-4 duration-300">
                <button onClick={() => handleRating(1)} className="flex flex-col items-center justify-center gap-1.5 bg-surface border border-danger/30 text-danger py-4 rounded-card hover:bg-danger/10 transition-colors cursor-pointer shadow-sm"><span className="text-sm font-bold uppercase">À revoir</span></button>
                <button onClick={() => handleRating(3)} className="flex flex-col items-center justify-center gap-1.5 bg-surface border border-warning/30 text-warning py-4 rounded-card hover:bg-warning/10 transition-colors cursor-pointer shadow-sm"><span className="text-sm font-bold uppercase">Difficile</span></button>
                <button onClick={() => handleRating(4)} className="flex flex-col items-center justify-center gap-1.5 bg-surface border border-info/30 text-info py-4 rounded-card hover:bg-info/10 transition-colors cursor-pointer shadow-sm"><span className="text-sm font-bold uppercase">Bien</span></button>
                <button onClick={() => handleRating(5)} className="flex flex-col items-center justify-center gap-1.5 bg-surface border border-success/30 text-success py-4 rounded-card hover:bg-success/10 transition-colors cursor-pointer shadow-sm"><span className="text-sm font-bold uppercase">Parfait</span></button>
              </div>
            )}
          </div>
        )}

        {config.mode === 'qcm' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="min-h-[150px] bg-surface-elevated border border-border rounded-modal p-6 flex flex-col justify-center items-center shadow-sm relative">
              <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Question {currentIndex + 1}</span>
              <p className="font-serif text-xl md:text-2xl font-medium text-center leading-tight mt-4">{questionText}</p>
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
                  <button key={idx} disabled={feedback !== null} onClick={() => handleQcmChoice(opt)} className={`p-4 rounded-card border text-sm font-medium text-left transition-all cursor-pointer shadow-sm ${btnClass}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {config.mode === 'type' && (
          <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full animate-in fade-in">
            <div className="min-h-[200px] bg-surface border border-border/80 rounded-modal p-8 flex flex-col justify-center items-center shadow-apple-subtle text-center relative">
               <span className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-wider text-text-muted">Question {currentIndex + 1}</span>
              <p className="font-serif text-2xl md:text-3xl font-medium text-text leading-tight">{questionText}</p>
            </div>
            <form onSubmit={handleTypeSubmit} className="flex flex-col gap-4">
              <textarea rows={3} autoFocus disabled={feedback !== null} value={typedAnswer} onChange={(e) => setTypedAnswer(e.target.value)} placeholder="Saisissez la réponse..." className={`w-full bg-surface border rounded-card p-5 text-base focus:outline-none transition-colors resize-none shadow-sm ${feedback === 'correct' ? 'border-success bg-success/5 text-success' : feedback === 'close' ? 'border-warning bg-warning/5 text-warning' : feedback === 'wrong' ? 'border-danger bg-danger/5 text-danger' : 'border-border focus:border-accent text-text'}`} />
              {feedback && (
                <div className={`rounded-card p-5 animate-in slide-in-from-top-2 border ${feedback === 'correct' ? 'bg-success/10 border-success/30' : feedback === 'close' ? 'bg-warning/10 border-warning/30' : 'bg-danger/10 border-danger/30'}`}>
                  <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-wider text-[10px]">
                    {feedback === 'correct' && <><CheckCircle2 size={14} className="text-success" /> <span className="text-success">Exactement !</span></>}
                    {feedback === 'close' && <><CheckCircle2 size={14} className="text-warning" /> <span className="text-warning">Réponse proche (Mots-clés détectés)</span></>}
                    {feedback === 'wrong' && <><XCircle size={14} className="text-danger" /> <span className="text-danger">Erreur, la réponse attendue était :</span></>}
                  </div>
                  {feedback !== 'correct' && <p className="font-serif text-lg text-text leading-relaxed">{answerText}</p>}
                </div>
              )}
              {!feedback && (
                <button type="submit" className="bg-text text-background py-4 rounded-btn font-bold flex items-center justify-center gap-2 shadow-apple hover:scale-[1.01] transition-transform cursor-pointer">
                  Vérifier <ArrowRight size={18} />
                </button>
              )}
            </form>
          </div>
        )}

        {config.mode === 'match' && (
          <div className="flex flex-col gap-6 animate-in fade-in h-full">
            <div className="flex justify-between items-center bg-surface-elevated border border-border p-4 rounded-card shadow-sm">
              <div className="flex items-center gap-2 text-text-muted"><TimerIcon size={18} /> <span className="font-mono text-sm font-bold">Focus Mode</span></div>
              <div className="font-mono font-bold text-accent text-sm">Score : {matchScore} / {matchItems.length / 2}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {matchItems.map((item) => {
                if (item.matched) return <div key={item.id} className="p-4 rounded-card border border-success/20 bg-success/5 text-success/50 flex items-center justify-center text-center opacity-50"><CheckCircle2 size={24} /></div>;
                const isSelected = selectedMatch === item.id;
                return (
                  <button 
                    key={item.id} onClick={() => handleMatchSelect(item.id)} 
                    className={`p-4 rounded-card border text-sm font-medium text-center transition-all cursor-pointer shadow-sm hover:scale-[1.02] flex items-center justify-center min-h-[100px] ${isSelected ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-border text-text hover:border-accent/40'}`}
                  >
                    <span className="line-clamp-4">{item.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

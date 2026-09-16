import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ResourceMenu } from '../components/ui/ResourceMenu';
import { fetchFlashcards, fetchCourses } from '../services/supabaseService';
import { useApp } from '../context/AppContext';
import { toast } from '../lib/toast';
import { BrainCircuit, Zap, CheckCircle2, ChevronRight, AlertCircle, Clock } from 'lucide-react';

export function Study() {
  const navigate = useNavigate();
  const { flashcards: contextCards, courses: contextCourses } = useApp();
  
  const [cards, setCards] = useState<any[]>(contextCards);
  const [courses, setCourses] = useState<any[]>(contextCourses);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cards.length === 0 || courses.length === 0) {
      loadData();
    }
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cardsData, coursesData] = await Promise.all([
        fetchFlashcards(),
        fetchCourses()
      ]);
      setCards(cardsData);
      setCourses(coursesData);
    } catch (err) {
      toast("Erreur lors du chargement des cartes", "error");
    } finally {
      setLoading(false);
    }
  }

  // --- LOGIQUE DES SETS (DECKS) ---
  const decks = courses.map(course => {
    const courseCards = cards.filter(c => c.course_id === course.id);
    const dueCardsCount = courseCards.filter(c => !c.due_at || new Date(c.due_at) <= new Date()).length;
    // Une carte est "maîtrisée" si son ease_factor est au dessus de 2.5
    const masteredCardsCount = courseCards.filter(c => c.ease_factor >= 2.5).length;
    const progressPercent = courseCards.length > 0 ? Math.round((masteredCardsCount / courseCards.length) * 100) : 0;
    
    return {
      ...course,
      totalCards: courseCards.length,
      dueCardsCount,
      progressPercent
    };
  }).filter(deck => deck.totalCards > 0); 

  const totalDueCards = cards.filter(f => !f.due_at || new Date(f.due_at) <= new Date()).length;

  return (
    <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Révisions & Mémoire</h1>
          <p className="text-text-muted text-sm max-w-md">
            L'algorithme SM-2 calcule le moment idéal pour réviser chaque carte afin d'optimiser votre mémorisation.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => navigate('/add/flashcards/batch')}
            className="bg-surface-elevated border border-border text-text px-4 py-2.5 rounded-btn text-sm font-bold flex items-center gap-2 hover:bg-surface-interactive transition-colors cursor-pointer shadow-sm"
          >
            <Zap size={16} className="text-warning" />
            <span>Créer un lot (IA)</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD RÉVISIONS GLOBALES */}
      <Card variant="editorial" className="flex flex-col justify-center relative overflow-hidden p-6 md:p-8 border-l-accent">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${totalDueCards > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                {totalDueCards > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Statut Global</h2>
            </div>
            
            {totalDueCards > 0 ? (
              <div className="flex items-baseline gap-3 mt-1">
                <span className="font-serif text-5xl font-bold text-text">{totalDueCards}</span>
                <span className="text-sm font-medium text-text-muted pb-1">cartes à réviser aujourd'hui</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1 mt-1">
                <span className="font-serif text-3xl font-bold text-success">Mémoire à jour</span>
                <span className="text-sm font-medium text-text-muted">Toutes vos cartes sont programmées pour plus tard.</span>
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/session/all', { state: { from: '/study' } })}
            disabled={totalDueCards === 0}
            className={`w-full md:w-auto px-8 py-4 rounded-btn text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 relative z-10 shrink-0 ${
              totalDueCards > 0 
                ? 'bg-accent text-background glow-gold hover:bg-accent-strong hover:scale-[1.02] cursor-pointer' 
                : 'bg-surface border border-border text-text-muted cursor-not-allowed'
            }`}
          >
            <BrainCircuit size={18} />
            {totalDueCards > 0 ? 'Lancer la session globale' : 'Session terminée'}
          </button>
        </div>
      </Card>

      {/* LISTE DES SETS (DECKS) */}
      <section className="flex flex-col gap-4 mt-2">
        <h3 className="font-serif text-2xl font-bold px-1">Mes Sets d'Étude</h3>
        
        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm font-mono animate-pulse">Analyse de vos paquets...</div>
        ) : decks.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-card text-text-muted text-sm flex flex-col items-center gap-4 bg-surface/30">
            <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center">
              <BrainCircuit size={32} className="text-text-muted opacity-50" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-bold text-text">Aucun set de révision</p>
              <p className="text-xs">Créez des flashcards à partir de vos cours pour commencer à mémoriser.</p>
            </div>
            <button onClick={() => navigate('/add/flashcards/batch')} className="text-accent font-bold text-sm bg-accent/10 px-4 py-2 rounded-btn mt-2 cursor-pointer hover:bg-accent/20 transition-colors">
              Générer mon premier set
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <Card 
                key={deck.id} 
                onClick={() => navigate(`/session/${deck.id}`, { state: { from: '/study' } })}
                className="flex flex-col gap-4 group hover:border-accent/40 cursor-pointer p-5"
              >
                <div className="flex justify-between items-start gap-3">
                  <h4 className="font-bold text-base text-text group-hover:text-accent transition-colors leading-tight">
                    {deck.title}
                  </h4>
                  <div onClick={e => e.stopPropagation()}>
                    <ResourceMenu 
                      onEdit={() => navigate(`/courses/${deck.id}`)}
                      onDuplicate={() => toast("Duplication en cours de développement", "info")}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {deck.dueCardsCount > 0 ? (
                    <Badge variant="warning" className="shrink-0 text-[10px] px-2 font-mono"><Clock size={10} className="mr-1 inline"/> {deck.dueCardsCount} dues</Badge>
                  ) : (
                    <Badge variant="success" className="shrink-0 text-[10px] px-2 font-mono"><CheckCircle2 size={10} className="mr-1 inline"/> À jour</Badge>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 mt-auto pt-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    <span>{deck.totalCards} cartes</span>
                    <span>Maîtrise : {deck.progressPercent}%</span>
                  </div>
                  <ProgressBar value={deck.progressPercent} max={100} colorClass={deck.progressPercent === 100 ? 'bg-success' : 'bg-accent'} />
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-text-muted group-hover:text-text transition-colors mt-1">
                  <span>Étudier ce set</span>
                  <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center group-hover:bg-accent group-hover:text-background transition-colors">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

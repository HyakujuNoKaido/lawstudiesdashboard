import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ResourceMenu } from '../components/ui/ResourceMenu';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { InlineEditableTitle } from '../components/ui/InlineEditableTitle';
import { Skeleton } from '../components/ui/Skeleton';
import { fetchFlashcards, fetchCourses, deleteFlashcardsByCourse, updateCourse } from '../services/supabaseService';
import { useApp } from '../context/AppContext';
import { toast } from '../lib/toast';
import { BrainCircuit, Play, Zap, CheckCircle2, ChevronRight, AlertCircle, Clock, LayoutGrid, List } from 'lucide-react';
import { LexiIcons } from '../lib/icons';

export function Study() {
  const navigate = useNavigate();
  const { flashcards: contextCards, courses: contextCourses } = useApp();
  
  const [cards, setCards] = useState<any[]>(contextCards);
  const [courses, setCourses] = useState<any[]>(contextCourses);
  const [loading, setLoading] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<any>(null);
  
  // Point 11: Mémorisation de la préférence de vue (Grille ou Liste)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('lexi-study-view') as 'grid' | 'list') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('lexi-study-view', viewMode);
  }, [viewMode]);

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

  // --- Point 3: ACTION OPTIMISTE ---
  const handleUpdateDeckTitle = async (deckId: string, newTitle: string) => {
    const deck = courses.find(c => c.id === deckId);
    if (!deck) return;
    
    // UI Optimiste : on met à jour immédiatement
    const previousCourses = [...courses];
    setCourses(prev => prev.map(c => c.id === deckId ? { ...c, title: newTitle } : c));
    
    try {
      await updateCourse(deckId, { ...deck, title: newTitle });
    } catch (err) {
      // Rollback en cas d'erreur
      setCourses(previousCourses);
      throw err;
    }
  };

  const confirmDeleteDeck = async () => {
    if (!deckToDelete) return;
    try {
      await deleteFlashcardsByCourse(deckToDelete.id);
      toast("Set de flashcards supprimé avec succès", "success");
      loadData();
    } catch (err) {
      toast("Erreur lors de la suppression du set", "error");
    } finally {
      setDeckToDelete(null);
    }
  };

  // --- Point 14 : SCORE DE MAÎTRISE HONNÊTE ---
  const decks = courses.map(course => {
    const courseCards = cards.filter(c => c.course_id === course.id);
    
    // Jamais vues : repetitions === 0
    const unseen = courseCards.filter(c => c.repetitions === 0).length;
    
    // À revoir : ease_factor < 2.0 ou dues aujourd'hui (et déjà vues)
    const toReview = courseCards.filter(c => c.repetitions > 0 && (!c.due_at || new Date(c.due_at) <= new Date() || c.ease_factor < 2.0)).length;
    
    // En progression : ease_factor entre 2.0 et 2.5
    const progressing = courseCards.filter(c => c.ease_factor >= 2.0 && c.ease_factor < 2.5 && new Date(c.due_at) > new Date()).length;
    
    // Maîtrisées : ease_factor >= 2.5 et repoussées à plus tard
    const mastered = courseCards.filter(c => c.ease_factor >= 2.5 && new Date(c.due_at) > new Date()).length;

    return {
      ...course,
      totalCards: courseCards.length,
      stats: { unseen, toReview, progressing, mastered }
    };
  }).filter(deck => deck.totalCards > 0); 

  const totalDueCards = cards.filter(f => !f.due_at || new Date(f.due_at) <= new Date()).length;

  // --- Point 4 : SKELETON LOADING ---
  if (loading && decks.length === 0) {
    return (
      <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300 w-full">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1 border-b border-border pb-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-btn" />
        </header>
        <Skeleton className="h-48 w-full rounded-card" />
        <div className="flex justify-between items-center px-1 mt-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-card" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Révisions & Sets</h1>
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
        <div className="flex justify-between items-center px-1">
          <h3 className="font-serif text-2xl font-bold">Mes Sets d'Étude</h3>
          
          {/* Point 11: SÉLECTEUR DE VUE */}
          <div className="hidden sm:flex bg-surface-elevated border border-border rounded-lg p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-surface-interactive text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
              title="Vue Grille"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-surface-interactive text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
              title="Vue Liste"
            >
              <List size={16} />
            </button>
          </div>
        </div>
        
        {decks.length === 0 ? (
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
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
            {decks.map((deck) => (
              <Card 
                key={deck.id} 
                onClick={() => navigate(`/session/${deck.id}`, { state: { from: '/study' } })}
                className={`flex group hover:border-accent/40 cursor-pointer p-5 ${viewMode === 'grid' ? 'flex-col gap-5' : 'flex-row items-center justify-between gap-6'}`}
              >
                <div className={`flex justify-between items-start gap-3 ${viewMode === 'list' ? 'w-1/3' : ''}`}>
                  <div onClick={(e) => e.stopPropagation()} className="flex-1 min-w-0">
                    <InlineEditableTitle 
                      initialTitle={deck.title} 
                      onSave={(newTitle) => handleUpdateDeckTitle(deck.id, newTitle)}
                      textClass="font-bold text-base text-text group-hover:text-accent transition-colors leading-tight truncate"
                    />
                    <div className="text-xs text-text-muted mt-1 font-mono">{deck.totalCards} cartes</div>
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <ResourceMenu 
                      onEdit={() => navigate(`/courses/${deck.id}`, { state: { tab: 'flashcards' } })}
                      onDelete={() => setDeckToDelete(deck)}
                    />
                  </div>
                </div>

                {/* Point 14 : BARRRE DE MAÎTRISE HONNÊTE */}
                <div className={`flex flex-col gap-2 ${viewMode === 'list' ? 'flex-1' : 'mt-auto'}`}>
                  <div className="flex w-full h-2 rounded-full overflow-hidden bg-surface-elevated">
                    <div className="bg-success transition-all duration-300" style={{ width: `${(deck.stats.mastered / deck.totalCards) * 100}%` }} title="Maîtrisées" />
                    <div className="bg-info transition-all duration-300" style={{ width: `${(deck.stats.progressing / deck.totalCards) * 100}%` }} title="En progression" />
                    <div className="bg-warning transition-all duration-300" style={{ width: `${(deck.stats.toReview / deck.totalCards) * 100}%` }} title="À revoir" />
                    <div className="bg-border transition-all duration-300" style={{ width: `${(deck.stats.unseen / deck.totalCards) * 100}%` }} title="Jamais vues" />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-text-muted">
                    <span className="text-success">{deck.stats.mastered} maîtrisées</span>
                    <span className="text-warning">{deck.stats.toReview} à revoir</span>
                    {viewMode === 'list' && <span className="text-border">{deck.stats.unseen} non vues</span>}
                  </div>
                </div>

                <div className={`flex items-center justify-between text-xs font-bold text-text-muted group-hover:text-text transition-colors ${viewMode === 'grid' ? 'pt-3 border-t border-border/50 mt-1' : 'w-32 justify-end'}`}>
                  {viewMode === 'grid' && <span>Ouvrir</span>}
                  <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center group-hover:bg-accent group-hover:text-background transition-colors shrink-0">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal 
        isOpen={!!deckToDelete}
        title="Supprimer ce Set de Flashcards ?"
        message="Cette action supprimera toutes les cartes liées à cette matière. Votre cours et vos documents PDF seront conservés."
        confirmText="Supprimer les cartes"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={confirmDeleteDeck}
        onClose={() => setDeckToDelete(null)}
      />
    </div>
  );
}

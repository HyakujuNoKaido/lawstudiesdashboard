import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { fetchFlashcards, fetchCourses, createFlashcard, updateFlashcard, deleteFlashcard } from '../services/supabaseService';
import { useApp } from '../context/AppContext';
import { LexiIcons } from '../lib/icons';
import { toast } from '../lib/toast';

export function Study() {
  const navigate = useNavigate();
  
  // On récupère les données pré-chargées et les réglages depuis notre "cerveau" global
  const { settings, flashcards: contextCards, courses: contextCourses } = useApp();
  
  const [cards, setCards] = useState<any[]>(contextCards);
  const [courses, setCourses] = useState<any[]>(contextCourses);
  const [loading, setLoading] = useState(false);

  // Modal State pour Ajout / Édition d'une carte unique
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    front: '',
    back: '',
    course_id: ''
  });

  // Le mode résumé dynamique
  const isCompact = settings.listDensity === 'compact';

  useEffect(() => {
    // Si le contexte est vide (ex: rafraîchissement forcé), on recharge
    if (cards.length === 0) {
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
      if (coursesData.length > 0 && !form.course_id) {
        setForm(f => ({ ...f, course_id: coursesData[0].id }));
      }
    } catch (err) {
      console.error("Erreur chargement révisions:", err);
      toast("Erreur lors du chargement des cartes", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ front: '', back: '', course_id: courses[0]?.id || '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (card: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(card.id);
    setForm({
      front: card.front,
      back: card.back,
      course_id: card.course_id || courses[0]?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer cette flashcard ?")) return;
    try {
      await deleteFlashcard(id);
      toast("Flashcard supprimée avec succès", "success");
      loadData();
    } catch (err) {
      console.error("Erreur suppression flashcard:", err);
      toast("Impossible de supprimer la carte", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.front || !form.back || !form.course_id) return;
    try {
      if (editingId) {
        await updateFlashcard(editingId, form);
        toast("Flashcard mise à jour", "success");
      } else {
        await createFlashcard(form);
        toast("Nouvelle flashcard ajoutée", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Erreur sauvegarde flashcard:", err);
      toast("Échec de l'enregistrement", "error");
    }
  };

  // --- ANALYSE DE LA MÉMOIRE ---
  const dueCards = cards.filter(f => new Date(f.due_at) <= new Date());
  const dueCardsCount = dueCards.length;
  
  const averageEase = cards.length > 0 
    ? cards.reduce((acc, c) => acc + (Number(c.ease_factor) || 2.5), 0) / cards.length 
    : 2.5;
  const memoryHealthScore = Math.min(100, Math.max(0, Math.round(((averageEase - 1.3) / 1.7) * 100)));

  return (
    <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Mémoire & Répétition</h1>
          <p className="text-text-muted text-sm max-w-md">
            Pilotez votre apprentissage à long terme grâce à l'algorithme d'espacement (SM-2).
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={handleOpenAdd}
            className="bg-surface border border-border text-text px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:border-accent/50 transition-colors cursor-pointer"
          >
            <LexiIcons.Add size={16} className="text-text-muted" />
            <span className="hidden sm:inline">Carte unique</span>
          </button>
          <button 
            onClick={() => navigate('/add/flashcards/batch')}
            className="bg-surface-elevated border border-border text-text px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-accent/50 transition-colors cursor-pointer"
          >
            <LexiIcons.Memory size={16} className="text-accent" />
            <span>Créer un lot</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD MÉMOIRE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Call to action de révision (7 col) */}
        <Card variant="editorial" className="md:col-span-7 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${dueCardsCount > 0 ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>
              <LexiIcons.Memory size={20} />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Session du jour</h2>
          </div>
          
          <div className="flex items-end gap-3 mb-4">
            <span className="font-serif text-5xl font-bold text-text">{dueCardsCount}</span>
            <span className="text-sm font-medium text-text-muted pb-1">cartes en attente</span>
          </div>
          
          {/* Smart Back : On passe la route actuelle pour que la session sache où revenir */}
          <button 
            onClick={() => navigate('/session/all', { state: { from: '/study' } })}
            disabled={dueCardsCount === 0}
            className={`w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
              dueCardsCount > 0 
                ? 'bg-accent text-background glow-gold hover:bg-accent-strong cursor-pointer' 
                : 'bg-surface-elevated border border-border text-text-muted cursor-not-allowed'
            }`}
          >
            <LexiIcons.Forward size={18} />
            {dueCardsCount > 0 ? 'Démarrer la révision' : 'Aucune révision pour le moment'}
          </button>
        </Card>

        {/* Statistiques (5 col) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <Card className="flex-1 bg-surface flex flex-col justify-center p-4">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Cartes Actives</span>
              <LexiIcons.Memory size={14} className="text-text-muted" />
            </div>
            <span className="font-serif text-2xl font-bold text-text">{cards.length}</span>
          </Card>
          
          <Card className="flex-1 bg-surface flex flex-col justify-center p-4">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Santé de la mémoire</span>
              <LexiIcons.Success size={14} className={memoryHealthScore > 75 ? 'text-success' : memoryHealthScore > 50 ? 'text-warning' : 'text-danger'} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-text">{memoryHealthScore}%</span>
              <span className="text-[10px] text-text-muted">Taux de rétention</span>
            </div>
          </Card>
        </div>
      </div>

      {/* LISTE DES CARTES */}
      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-xl font-bold px-1">Bibliothèque de cartes</h3>
        
        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm font-mono animate-pulse">Chargement de la base de connaissances...</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl text-text-muted text-sm flex flex-col items-center gap-3">
            <LexiIcons.Memory size={32} className="text-text-muted opacity-30" />
            <p>Votre mémoire est vide. Créez des flashcards à partir de vos cours.</p>
          </div>
        ) : (
          <div className={`flex flex-col ${isCompact ? 'border border-border bg-surface rounded-2xl overflow-hidden shadow-sm' : 'gap-3'}`}>
            {cards.map((card, index) => {
              const isDue = new Date(card.due_at) <= new Date();
              return (
                <div 
                  key={card.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors group hover:bg-surface-elevated ${
                    isCompact 
                      ? `p-3 ${index !== cards.length - 1 ? 'border-b border-border/50' : ''}` 
                      : 'bg-surface border border-border p-4 rounded-xl'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="text-[9px]">{card.courses?.title || 'Matière générale'}</Badge>
                      {isDue && <Badge variant="warning" className="px-1.5 py-0 text-[9px] bg-warning/10 text-warning border-transparent">À réviser</Badge>}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-medium text-sm text-text truncate">
                        <span className="text-text-muted mr-2">Q:</span>{card.front}
                      </p>
                      {/* En mode compact, on masque le verso pour aérer la liste */}
                      {!isCompact && (
                        <p className="text-sm text-text-muted truncate">
                          <span className="text-text-muted opacity-50 mr-2">R:</span>{card.back}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 md:pl-4 md:border-l md:border-border/50">
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-0.5">
                        Prochaine
                      </span>
                      <span className="text-xs font-mono text-text">
                        {new Date(card.due_at).toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => handleOpenEdit(card, e)}
                        className="p-2 text-text-muted hover:text-accent transition-colors rounded-lg cursor-pointer"
                        title="Modifier"
                      >
                        <LexiIcons.Edit size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(card.id, e)}
                        className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors rounded-lg cursor-pointer"
                        title="Supprimer"
                      >
                        <LexiIcons.Delete size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Ajout / Édition Flashcard Unique */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl font-bold">{editingId ? "Modifier la carte" : "Nouvelle carte"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text p-1">
                <LexiIcons.Delete size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Cours associé</label>
                <select 
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Question (Recto)</label>
                <textarea 
                  rows={3}
                  required
                  value={form.front}
                  onChange={(e) => setForm({ ...form, front: e.target.value })}
                  placeholder="ex: Quelles sont les conditions de la responsabilité civile ?"
                  className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent resize-none"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Réponse (Verso)</label>
                <textarea 
                  rows={3}
                  required
                  value={form.back}
                  onChange={(e) => setForm({ ...form, back: e.target.value })}
                  placeholder="ex: 1. Acte illicite, 2. Dommage, 3. Faute, 4. Causalité adéquate."
                  className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent resize-none"
                />
              </div>
              
              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface-elevated border border-border text-text py-3.5 rounded-xl text-sm font-medium hover:bg-surface/80"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-accent text-background py-3.5 rounded-xl text-sm font-bold glow-gold hover:bg-accent-strong flex items-center justify-center gap-2"
                >
                  <LexiIcons.Edit size={16} />
                  <span>{editingId ? 'Mettre à jour' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

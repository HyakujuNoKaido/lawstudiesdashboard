import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Plus, Trash2, Edit3, Play, X, Save } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { fetchFlashcards, fetchCourses, createFlashcard, updateFlashcard, deleteFlashcard } from '../services/supabaseService';

export function Study() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State pour Ajout / Édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    front: '',
    back: '',
    course_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
      loadData();
    } catch (err) {
      console.error("Erreur suppression flashcard:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.front || !form.back || !form.course_id) return;

    try {
      if (editingId) {
        await updateFlashcard(editingId, form);
      } else {
        await createFlashcard(form);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Erreur sauvegarde flashcard:", err);
      alert("Échec de l'enregistrement de la flashcard.");
    }
  };

  const dueCardsCount = cards.filter(f => new Date(f.due_at) <= new Date()).length;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      <header className="flex justify-between items-center px-1">
        <div>
          <h1 className="font-serif text-3xl font-bold">Révisions & Fiches</h1>
          <p className="text-text-muted text-xs">Système de répétition espacée (Flashcards).</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleOpenAdd}
            className="bg-surface border border-border text-text px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:border-accent/50 transition-colors"
          >
            <Plus size={16} className="text-accent" />
            <span>Créer</span>
          </button>

          <button 
            onClick={() => navigate('/study/session')}
            disabled={cards.length === 0}
            className="bg-accent text-background px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 glow-gold hover:bg-accent-strong transition-colors disabled:opacity-50"
          >
            <Play size={16} />
            <span>Lancer</span>
          </button>
        </div>
      </header>

      {/* Stats carte */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-surface border-border p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-semibold text-text-muted">Cartes dues</span>
          <span className="font-serif text-2xl font-bold text-accent">{dueCardsCount}</span>
        </Card>
        <Card className="bg-surface border-border p-4 flex flex-col gap-1">
          <span className="text-[10px] uppercase font-semibold text-text-muted">Total cartes</span>
          <span className="font-serif text-2xl font-bold text-text">{cards.length}</span>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-semibold px-1">Toutes vos flashcards</h2>

        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm">Chargement des cartes...</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl text-text-muted text-sm">
            Aucune flashcard enregistrée. Cliquez sur "Créer" pour commencer.
          </div>
        ) : (
          cards.map(card => (
            <Card key={card.id} className="bg-surface border-border p-4 flex flex-col gap-3 hover:border-accent/40 transition-colors">
              <div className="flex justify-between items-start gap-2">
                <Badge variant="outline">{card.courses?.title || 'Matière générale'}</Badge>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => handleOpenEdit(card, e)}
                    className="p-1.5 text-text-muted hover:text-accent transition-colors"
                    title="Modifier"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(card.id, e)}
                    className="p-1.5 text-text-muted hover:text-danger transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-1 border-t border-border/60">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-text-muted font-medium">Question (Recto)</span>
                  <p className="font-medium text-text mt-0.5">{card.front}</p>
                </div>
                <div className="flex flex-col border-t md:border-t-0 md:border-l border-border/60 pt-2 md:pt-0 md:pl-3">
                  <span className="text-[10px] uppercase text-text-muted font-medium">Réponse (Verso)</span>
                  <p className="text-text-muted mt-0.5">{card.back}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Ajout / Édition Flashcard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-xl font-bold">{editingId ? "Modifier la flashcard" : "Créer une flashcard"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Cours associé</label>
                <select 
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
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
                  placeholder="ex: Quelles sont les conditions de la responsabilité civile aquilienne ?"
                  className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Réponse (Verso)</label>
                <textarea 
                  rows={3}
                  required
                  value={form.back}
                  onChange={(e) => setForm({ ...form, back: e.target.value })}
                  placeholder="ex: 1. Acte illicite, 2. Dommage, 3. Faute, 4. Lien de causalité adéquate."
                  className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface border border-border text-text py-3 rounded-xl text-sm font-medium hover:bg-surface/80"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-accent text-background py-3 rounded-xl text-sm font-semibold glow-gold hover:bg-accent-strong flex items-center justify-center gap-1.5"
                >
                  <Save size={16} />
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

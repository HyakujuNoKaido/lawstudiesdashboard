// src/pages/CreateFlashcardsBatch.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Trash2, BrainCircuit } from 'lucide-react';
import { fetchCourses, fetchCourseChapters, createFlashcardsBatch } from '../services/supabaseService';

export function CreateFlashcardsBatch() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [courseId, setCourseId] = useState('');
  const [chapterId, setChapterId] = useState('');
  
  // Tableau dynamique de flashcards
  const [cards, setCards] = useState([{ id: Date.now().toString(), front: '', back: '' }]);

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      if (data.length > 0) {
        setCourseId(data[0].id);
        loadChapters(data[0].id);
      }
      setLoading(false);
    });
  }, []);

  const loadChapters = async (cId: string) => {
    const data = await fetchCourseChapters(cId);
    setChapters(data);
    setChapterId(''); // Reset chapter when course changes
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCourseId = e.target.value;
    setCourseId(newCourseId);
    loadChapters(newCourseId);
  };

  const addCardRow = () => {
    setCards([...cards, { id: Date.now().toString(), front: '', back: '' }]);
  };

  const removeCardRow = (id: string) => {
    if (cards.length > 1) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  const updateCard = (id: string, field: 'front' | 'back', value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSubmit = async () => {
    // Filtrer les cartes vides
    const validCards = cards.filter(c => c.front.trim() !== '' && c.back.trim() !== '');
    
    if (validCards.length === 0) {
      alert("Ajoutez au moins une carte valide (avec question et réponse).");
      return;
    }
    if (!courseId) {
      alert("Sélectionnez un cours.");
      return;
    }

    setSaving(true);
    try {
      const payload = validCards.map(c => ({
        course_id: courseId,
        chapter_id: chapterId || undefined,
        front: c.front,
        back: c.back
      }));

      await createFlashcardsBatch(payload);
      alert(`${validCards.length} flashcard(s) créées avec succès !`);
      navigate('/study');
    } catch (err) {
      console.error("Erreur création lot:", err);
      alert("Échec de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Chargement...</div>;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 animate-in fade-in duration-300 max-w-3xl mx-auto w-full text-text">
      
      <header className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">Créer un lot de Flashcards</h1>
            <p className="text-text-muted text-xs">Créez plusieurs cartes rapidement pour un cours.</p>
          </div>
        </div>
      </header>

      {/* Configuration du Lot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface border border-border p-5 rounded-2xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Matière *</label>
          <select value={courseId} onChange={handleCourseChange} className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none">
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Chapitre (Optionnel)</label>
          <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none">
            <option value="">Général (Aucun chapitre)</option>
            {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      {/* Éditeur de Lot de Cartes */}
      <div className="flex flex-col gap-4">
        {cards.map((card, index) => (
          <div key={card.id} className="bg-surface border border-border p-4 rounded-2xl flex flex-col gap-3 relative group">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-xs font-bold text-text-muted uppercase">Carte {index + 1}</span>
              {cards.length > 1 && (
                <button onClick={() => removeCardRow(card.id)} className="text-text-muted hover:text-danger p-1 transition-colors">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-text-muted uppercase font-bold">Recto (Question)</label>
                <textarea 
                  rows={2} 
                  value={card.front} 
                  onChange={(e) => updateCard(card.id, 'front', e.target.value)} 
                  placeholder="Tapez le concept juridique..." 
                  className="w-full bg-surface-elevated border border-transparent focus:border-accent rounded-xl p-3 text-sm font-medium resize-none transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-accent uppercase font-bold">Verso (Réponse)</label>
                <textarea 
                  rows={2} 
                  value={card.back} 
                  onChange={(e) => updateCard(card.id, 'back', e.target.value)} 
                  placeholder="Tapez la définition ou la réponse..." 
                  className="w-full bg-surface-elevated border border-transparent focus:border-accent rounded-xl p-3 text-sm font-medium resize-none transition-colors"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-2">
        <button onClick={addCardRow} className="flex items-center gap-2 bg-surface-elevated border border-border px-5 py-3 rounded-full text-sm font-medium hover:border-accent/50 transition-colors cursor-pointer text-text">
          <Plus size={18} className="text-accent" /> Ajouter une carte
        </button>
      </div>

      {/* Barre d'action fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-40 flex justify-center">
        <div className="max-w-3xl w-full flex justify-end">
          <button onClick={handleSubmit} disabled={saving} className="bg-accent text-background px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 glow-gold hover:bg-accent-strong transition-colors cursor-pointer disabled:opacity-50">
            <Save size={18} />
            {saving ? 'Création en cours...' : 'Sauvegarder le lot'}
          </button>
        </div>
      </div>

    </div>
  );
}

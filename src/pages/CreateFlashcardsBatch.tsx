import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Trash2, BrainCircuit, ClipboardPaste, X } from 'lucide-react';
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
  
  // État pour l'import rapide (Texte brut)
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');

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
    setChapterId(''); 
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

  // NOUVEAU : Analyse du texte brut pour générer les cartes
  const handleBulkImportProcess = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newCards: any[] = [];

    lines.forEach((line, i) => {
      // Détecte automatiquement la tabulation (Excel/Notion) ou un tiret comme séparateur
      let separator = '\t';
      if (!line.includes('\t') && line.includes(' - ')) separator = ' - ';
      if (!line.includes('\t') && !line.includes(' - ') && line.includes(';')) separator = ';';

      const parts = line.split(separator);
      if (parts.length >= 2) {
        newCards.push({
          id: `${Date.now()}_${i}`,
          front: parts[0].trim(),
          back: parts.slice(1).join(separator).trim() // Rejoint le reste au cas où il y aurait plusieurs séparateurs dans la définition
        });
      }
    });

    if (newCards.length > 0) {
      // Si la première carte manuelle est vide, on la remplace. Sinon on ajoute à la suite.
      const currentCards = (cards.length === 1 && !cards[0].front && !cards[0].back) ? [] : cards;
      setCards([...currentCards, ...newCards]);
      setBulkText('');
      setShowBulkImport(false);
    } else {
      alert("Aucune carte n'a pu être extraite. Vérifiez que vous utilisez bien un séparateur (Tabulation, ' - ' ou ';').");
    }
  };

  const handleSubmit = async () => {
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold">Créer un lot de Flashcards</h1>
              <p className="text-text-muted text-xs">Créez plusieurs cartes rapidement pour un cours.</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 bg-surface-elevated border border-border px-3.5 py-2 rounded-xl text-xs font-semibold hover:border-accent/50 transition-colors cursor-pointer text-text"
          >
            <ClipboardPaste size={16} className="text-accent" />
            <span className="hidden sm:inline">Import Rapide</span>
          </button>
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

      {/* Modale Import Rapide */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-surface-elevated border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-serif text-xl font-bold">Import Rapide (Copier-Coller)</h3>
              <button onClick={() => setShowBulkImport(false)} className="p-1.5 hover:bg-surface rounded-xl text-text-muted"><X size={20} /></button>
            </div>
            
            <p className="text-xs text-text-muted leading-relaxed">
              Copiez-collez un texte depuis Word, Excel ou Notion. <br/>
              Assurez-vous d'avoir une carte par ligne. La question et la réponse doivent être séparées par une <b>Tabulation</b>, un tiret (<b> - </b>) ou un point-virgule (<b>;</b>).
            </p>

            <textarea
              autoFocus
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Exemple :&#10;Erga omnes [TAB] À l'égard de tous&#10;Art. 41 CO [TAB] Responsabilité civile extracontractuelle"
              className="w-full h-64 bg-surface border border-border rounded-xl p-4 text-sm font-mono focus:border-accent resize-none whitespace-pre"
            />

            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowBulkImport(false)} className="flex-1 bg-surface border border-border py-3 rounded-xl text-sm font-medium hover:bg-surface/80">Annuler</button>
              <button onClick={handleBulkImportProcess} className="flex-1 bg-accent text-background py-3 rounded-xl text-sm font-bold glow-gold hover:bg-accent-strong">Générer les cartes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

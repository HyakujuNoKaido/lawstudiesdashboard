import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Trash2, BrainCircuit, ClipboardPaste, X, Sparkles, Loader2 } from 'lucide-react';
import { fetchCourses, fetchCourseChapters, createFlashcardsBatch } from '../services/supabaseService';
// Remplacement de l'import pour utiliser la version détaillée
import { generateAIFlashcardsDetailed } from '../lib/aiService';
import { toast } from '../lib/toast';

// On étend l'interface locale pour stocker les métadonnées de l'IA
interface FlashcardRow {
  id: string;
  front: string;
  back: string;
  category?: string;
  difficulty?: string;
  sourcePages?: number[];
}

export function CreateFlashcardsBatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { courseId?: string; chapterId?: string; extractedText?: string; sourceType?: 'pdf' | 'text' } | null;

  const [courses, setCourses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [courseId, setCourseId] = useState(state?.courseId || '');
  const [chapterId, setChapterId] = useState(state?.chapterId || '');

  // Utilisation de la nouvelle interface pour les cartes
  const [cards, setCards] = useState<FlashcardRow[]>([{ id: Date.now().toString(), front: '', back: '' }]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      if (data.length > 0) {
        const initialCourse = state?.courseId || data[0].id;
        setCourseId(initialCourse);
        loadChapters(initialCourse);
      }
      setLoading(false);
    });

    // Si on reçoit du texte extrait (par exemple depuis CourseDetail), on lance l'IA direct
    if (state?.extractedText) {
      handleAIGeneration(state.extractedText);
    }
  }, []);

  const loadChapters = async (cId: string) => {
    const data = await fetchCourseChapters(cId);
    setChapters(data);
    if (!state?.chapterId) setChapterId(''); 
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCourseId = e.target.value;
    setCourseId(newCourseId);
    loadChapters(newCourseId);
  };

  const addCardRow = () => setCards([...cards, { id: Date.now().toString(), front: '', back: '' }]);
  const removeCardRow = (id: string) => { if (cards.length > 1) setCards(cards.filter(c => c.id !== id)); };
  const updateCard = (id: string, field: 'front' | 'back', value: string) => setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));

  const handleAIGeneration = async (text: string) => {
    setGenerating(true);
    toast("L'IA génère vos cartes. Veuillez patienter...", "info");
    try {
      // Récupération des titres pour donner un meilleur contexte au prompt IA
      const selectedCourse = courses.find(c => c.id === courseId);
      const selectedChapter = chapters.find(c => c.id === chapterId);

      // Appel de la fonction détaillée
      const result = await generateAIFlashcardsDetailed(text, {
        courseId,
        chapterId,
        courseTitle: selectedCourse?.title,
        chapterTitle: selectedChapter?.title,
        sourceType: state?.sourceType || 'pdf', // Par défaut 'pdf' si texte extrait
        count: 20, // Valeur cible ajustable
        difficulty: 'mixed'
      });

      if (result.cards && result.cards.length > 0) {
        const mappedCards = result.cards.map((c, i) => ({
          id: `${Date.now()}_${i}`,
          front: c.question,
          back: c.answer,
          category: c.category,
          difficulty: c.difficulty,
          sourcePages: c.sourcePages
        }));

        // Si le lot manuel était vide, on l'écrase
        if (cards.length === 1 && !cards[0].front && !cards[0].back) {
          setCards(mappedCards);
        } else {
          setCards([...cards, ...mappedCards]);
        }

        // --- AFFICHAGE DU RAPPORT DÉTAILLÉ ---
        if (result.rejectedCount > 0 || result.duplicateCount > 0) {
          toast(`${result.validCount} cartes créées. ${result.duplicateCount} doublons et ${result.rejectedCount} incomplètes ignorées.`, "warning");
          if (result.warnings.length > 0) {
            console.warn("Rapport de nettoyage IA :", result.warnings);
          }
        } else {
          toast(`${result.validCount} flashcards générées avec succès ! Vous pouvez les modifier.`, "success");
        }
      } else {
        toast("Aucune carte valide n'a pu être extraite du texte.", "warning");
      }
    } catch (err: any) {
      toast(err.message || "Erreur lors de la génération IA.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkImportProcess = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newCards: FlashcardRow[] = [];
    lines.forEach((line, i) => {
      let separator = '\t';
      if (!line.includes('\t') && line.includes(' - ')) separator = ' - ';
      if (!line.includes('\t') && !line.includes(' - ') && line.includes(';')) separator = ';';
      const parts = line.split(separator);
      if (parts.length >= 2) {
        newCards.push({ id: `${Date.now()}_${i}`, front: parts[0].trim(), back: parts.slice(1).join(separator).trim() });
      }
    });
    if (newCards.length > 0) {
      const currentCards = (cards.length === 1 && !cards[0].front && !cards[0].back) ? [] : cards;
      setCards([...currentCards, ...newCards]);
      setBulkText(''); setShowBulkImport(false);
    } else {
      toast("Aucune carte n'a pu être extraite. Vérifiez le séparateur (Tabulation, ' - ' ou ';').", "warning");
    }
  };

  const handleSubmit = async () => {
    const validCards = cards.filter(c => c.front.trim() !== '' && c.back.trim() !== '');
    if (validCards.length === 0) { toast("Ajoutez au moins une carte valide.", "warning"); return; }
    if (!courseId) { toast("Sélectionnez un cours.", "warning"); return; }
    
    setSaving(true);
    try {
      // Note : si ta table Supabase évolue pour accepter 'category' et 'source_pages', 
      // tu pourras ajouter ces champs dans ce payload.
      const payload = validCards.map(c => ({
        course_id: courseId,
        chapter_id: chapterId || undefined,
        front: c.front,
        back: c.back
      }));
      await createFlashcardsBatch(payload);
      toast(`${validCards.length} flashcard(s) créées avec succès !`, "success");
      navigate('/study');
    } catch (err) {
      toast("Échec de la sauvegarde.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Chargement...</div>;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 animate-in fade-in duration-300 max-w-4xl mx-auto w-full text-text relative">
      <header className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-info/10 border border-info/20 text-info flex items-center justify-center shadow-inner">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold">Créateur de Set</h1>
              <p className="text-text-muted text-xs md:text-sm">Vérifiez et éditez vos cartes avant de les injecter dans la mémoire.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 bg-surface border border-border px-4 py-2.5 rounded-btn text-xs font-bold hover:bg-surface-interactive transition-colors cursor-pointer text-text shadow-sm"
          >
            <ClipboardPaste size={16} className="text-accent" />
            <span className="hidden sm:inline">Copier-Coller texte</span>
          </button>
        </div>
      </header>

      {/* Configuration d'Organisation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface border border-border p-5 rounded-card shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Set de destination (Cours) *</label>
          <select value={courseId} onChange={handleCourseChange} className="w-full bg-surface-elevated border border-border/50 rounded-input py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none cursor-pointer">
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Tag optionnel (Chapitre)</label>
          <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} className="w-full bg-surface-elevated border border-border/50 rounded-input py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none cursor-pointer">
            <option value="">Général (Aucun chapitre)</option>
            {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      {generating && (
        <div className="flex flex-col items-center justify-center p-12 bg-warning/5 border border-warning/20 rounded-card gap-4 animate-pulse">
          <Sparkles size={32} className="text-warning" />
          <p className="font-serif text-lg text-text">L'IA analyse le document et rédige les flashcards...</p>
        </div>
      )}

      {/* Éditeur de Lot de Cartes (Preview) */}
      {!generating && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
             <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{cards.length} cartes générées</span>
          </div>
          {cards.map((card, index) => (
            <div key={card.id} className="bg-surface border border-border p-5 rounded-card flex flex-col gap-3 relative group shadow-sm focus-within:border-accent/40 transition-colors">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Carte {index + 1}</span>
                  {/* NOUVEAU: Affichage de la catégorie IA */}
                  {card.category && (
                    <span className="text-[9px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full uppercase">
                      {card.category}
                    </span>
                  )}
                  {/* NOUVEAU: Affichage de la traçabilité PDF */}
                  {card.sourcePages && card.sourcePages.length > 0 && (
                    <span className="text-[9px] font-bold bg-info/10 text-info px-2 py-0.5 rounded-full uppercase">
                      Page(s) {card.sourcePages.join(', ')}
                    </span>
                  )}
                </div>
                <button onClick={() => removeCardRow(card.id)} className="text-text-muted hover:text-danger p-1 rounded-md hover:bg-danger/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Recto (Question)</label>
                  <textarea 
                    rows={2} value={card.front} onChange={(e) => updateCard(card.id, 'front', e.target.value)} 
                    placeholder="Le concept juridique..." 
                    className="w-full bg-background border border-border/50 focus:border-accent rounded-input p-3 text-sm font-medium resize-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-accent uppercase font-bold tracking-wider">Verso (Réponse)</label>
                  <textarea 
                    rows={2} value={card.back} onChange={(e) => updateCard(card.id, 'back', e.target.value)} 
                    placeholder="La définition ou réponse..." 
                    className="w-full bg-background border border-border/50 focus:border-accent rounded-input p-3 text-sm font-medium resize-none transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!generating && (
        <div className="flex justify-center mt-2">
          <button onClick={addCardRow} className="flex items-center gap-2 bg-surface border border-border px-5 py-3 rounded-full text-sm font-bold hover:bg-surface-interactive transition-colors cursor-pointer text-text shadow-sm">
            <Plus size={18} className="text-text-muted" /> Ajouter une carte manuelle
          </button>
        </div>
      )}

      {/* Barre d'action fixe en bas */}
      {!generating && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-40 flex justify-center">
          <div className="max-w-4xl w-full flex justify-end">
            <button onClick={handleSubmit} disabled={saving} className="bg-accent text-background px-8 py-3.5 rounded-btn font-bold flex items-center gap-2 glow-gold hover:bg-accent-strong transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-apple">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Injection dans la mémoire...' : 'Valider et Sauvegarder le Set'}
            </button>
          </div>
        </div>
      )}

      {/* Modale Import Rapide (Inchangée) */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-surface-elevated border border-border rounded-modal p-6 shadow-apple flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <h3 className="font-serif text-xl font-bold">Import Rapide (Copier-Coller)</h3>
              <button onClick={() => setShowBulkImport(false)} className="p-1.5 hover:bg-surface rounded-full text-text-muted cursor-pointer"><X size={20} /></button>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Copiez-collez un texte depuis Word, Excel ou Notion. <br/>
              Assurez-vous d'avoir une carte par ligne. La question et la réponse doivent être séparées par une <b>Tabulation</b>, un tiret (<b> - </b>) ou un point-virgule (<b>;</b>).
            </p>
            <textarea
              autoFocus value={bulkText} onChange={(e) => setBulkText(e.target.value)}
              placeholder="Exemple :&#10;Erga omnes [TAB] À l'égard de tous&#10;Art. 41 CO [TAB] Responsabilité civile extracontractuelle"
              className="w-full h-64 bg-background border border-border rounded-input p-4 text-sm font-mono focus:border-accent resize-none whitespace-pre"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowBulkImport(false)} className="flex-1 bg-surface border border-border py-3 rounded-btn text-sm font-bold hover:bg-surface-interactive cursor-pointer">Annuler</button>
              <button onClick={handleBulkImportProcess} className="flex-1 bg-accent text-background py-3 rounded-btn text-sm font-bold glow-gold hover:bg-accent-strong cursor-pointer">Générer les cartes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

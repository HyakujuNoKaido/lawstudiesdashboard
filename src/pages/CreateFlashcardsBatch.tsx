import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Trash2, BrainCircuit, ClipboardPaste, X, Sparkles, Loader2 } from 'lucide-react';
import { fetchCourses, fetchCourseChapters, createFlashcardsBatch } from '../services/supabaseService';
import { generateAIFlashcardsDetailed, FlashcardGenerationResult } from '../lib/aiService';
import { toast } from '../lib/toast';

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
  const state = location.state as { courseId?: string; chapterId?: string; extractedText?: string; sourceType?: 'pdf' | 'text' | 'note'; pageCount?: number } | null;

  const [courses, setCourses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [courseId, setCourseId] = useState('');
  const [chapterId, setChapterId] = useState('');

  const [cards, setCards] = useState<FlashcardRow[]>([{ id: Date.now().toString(), front: '', back: '' }]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  const [generationReport, setGenerationReport] = useState<FlashcardGenerationResult | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        const data = await fetchCourses();
        setCourses(data);

        const initialCourse = state?.courseId || data[0]?.id;

        if (initialCourse) {
          setCourseId(initialCourse);
          const chapterData = await fetchCourseChapters(initialCourse);
          setChapters(chapterData);
          if (state?.chapterId) setChapterId(state.chapterId);

          if (state?.extractedText) {
            const selectedCourse = data.find(c => c.id === initialCourse);
            const selectedChapter = chapterData.find(c => c.id === state.chapterId);
            
            await generateCardsFromText(
              state.extractedText,
              state.sourceType || 'pdf',
              initialCourse,
              state.chapterId || '',
              selectedCourse?.title,
              selectedChapter?.title,
              state.pageCount
            );
          }
        }
      } catch (err) {
        console.error("Erreur initialisation:", err);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const addCardRow = () => setCards([...cards, { id: Date.now().toString(), front: '', back: '' }]);
  const removeCardRow = (id: string) => { if (cards.length > 1) setCards(cards.filter(c => c.id !== id)); };
  const updateCard = (id: string, field: 'front' | 'back', value: string) => setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));

  const generateCardsFromText = async (
    text: string,
    sourceType: 'pdf' | 'text' | 'note',
    selectedCourseId: string,
    selectedChapterId: string,
    courseTitle?: string,
    chapterTitle?: string,
    maxPages?: number
  ) => {
    if (!selectedCourseId) {
      toast("Veuillez sélectionner un cours avant de générer.", "warning");
      return;
    }
    
    setGenerating(true);
    setGenerationReport(null);
    toast("L'IA analyse le document et génère vos cartes...", "info");
    
    try {
      const result = await generateAIFlashcardsDetailed(text, {
        courseId: selectedCourseId,
        chapterId: selectedChapterId || undefined,
        courseTitle,
        chapterTitle,
        sourceType,
        count: 30,
        difficulty: 'mixed',
        availablePages: maxPages ? Array.from({ length: maxPages }, (_, i) => i + 1) : undefined
      });

      setGenerationReport(result);

      if (result.cards.length === 0) {
        toast("Aucune flashcard valide n’a été générée. Vérifiez le contenu.", "warning");
        return;
      }

      const mappedCards = result.cards.map((c, index) => ({
        id: `${Date.now()}-${index}`,
        front: c.question,
        back: c.answer,
        category: c.category,
        difficulty: c.difficulty,
        sourcePages: c.sourcePages
      }));

      setCards((currentCards) => {
        const isEmpty = currentCards.length === 1 && !currentCards[0].front.trim() && !currentCards[0].back.trim();
        return isEmpty ? mappedCards : [...currentCards, ...mappedCards];
      });

      toast(`${result.validCount} flashcard(s) générée(s).`, result.rejectedCount > 0 ? "warning" : "success");

    } catch (err: any) {
      console.error('Erreur génération IA :', err);
      toast(err.message || "La génération IA a échoué. Aucune carte n’a été enregistrée.", "error");
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
      setBulkText(''); 
      setShowBulkImport(false);
      toast(`${newCards.length} cartes importées avec succès.`, "success");
    } else {
      toast("Aucune carte n'a pu être extraite. Vérifiez le séparateur.", "warning");
    }
  };

  const handleAIGenerationFromModal = () => {
    if (!bulkText.trim()) return;
    const selectedCourse = courses.find(c => c.id === courseId);
    const selectedChapter = chapters.find(c => c.id === chapterId);
    generateCardsFromText(bulkText, 'text', courseId, chapterId, selectedCourse?.title, selectedChapter?.title);
    setShowBulkImport(false);
    setBulkText('');
  };

  const handleSubmit = async () => {
    const validCards = cards.filter(c => c.front.trim() !== '' && c.back.trim() !== '');
    if (validCards.length === 0) { toast("Ajoutez au moins une carte valide.", "warning"); return; }
    if (!courseId) { toast("Sélectionnez un cours.", "warning"); return; }
    
    setSaving(true);
    try {
      const payload = validCards.map(c => ({
        courseid: courseId,
        chapterid: chapterId || undefined,
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

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 max-w-4xl mx-auto w-full relative">
      <header className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors -ml-2 p-2 w-fit cursor-pointer">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Créateur de Set</h1>
              <p className="text-gray-500 text-xs md:text-sm">Vérifiez et éditez vos cartes avant de les sauvegarder.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
          >
            <ClipboardPaste size={16} className="text-blue-600" />
            <span className="hidden sm:inline">Générer via texte</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Set de destination (Cours) *</label>
          <select value={courseId} onChange={handleCourseChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-3 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tag optionnel (Chapitre)</label>
          <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-3 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
            <option value="">Général (Aucun chapitre)</option>
            {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      {generating && (
        <div className="flex flex-col items-center justify-center p-12 bg-yellow-50 border border-yellow-200 rounded-2xl gap-4 animate-pulse">
          <Sparkles size={32} className="text-yellow-600" />
          <p className="text-lg font-medium text-gray-800">L'IA rédige les flashcards...</p>
        </div>
      )}

      {generationReport && !generating && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Génération terminée</p>
              <p className="mt-1 text-xs text-gray-600">Les cartes sont prêtes à être vérifiées ci-dessous.</p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 border border-green-200">
              {generationReport.validCount} Valides
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-xl font-bold text-gray-900">{generationReport.generatedCount}</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mt-1">Générées</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-xl font-bold text-yellow-600">{generationReport.duplicateCount}</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mt-1">Doublons</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-4 text-center shadow-sm">
              <p className="text-xl font-bold text-red-600">{generationReport.rejectedCount}</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mt-1">Ignorées</p>
            </div>
          </div>

          {generationReport.warnings.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                Voir les détails de nettoyage
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside bg-white p-3 rounded-lg border border-gray-200">
                {generationReport.warnings.slice(0, 5).map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {!generating && (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between px-1">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{cards.length} carte(s) à valider</span>
          </div>
          {cards.map((card, index) => (
            <div key={card.id} className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col gap-3 relative group shadow-sm focus-within:border-blue-300 transition-colors">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Carte {index + 1}</span>
                  {card.category && (
                    <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase">
                      {card.category}
                    </span>
                  )}
                  {card.sourcePages && card.sourcePages.length > 0 && (
                    <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                      Page(s) {card.sourcePages.join(', ')}
                    </span>
                  )}
                </div>
                <button onClick={() => removeCardRow(card.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Recto (Question)</label>
                  <textarea 
                    rows={2} value={card.front} onChange={(e) => updateCard(card.id, 'front', e.target.value)} 
                    placeholder="Le concept juridique..." 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg p-3 text-sm font-medium resize-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Verso (Réponse)</label>
                  <textarea 
                    rows={2} value={card.back} onChange={(e) => updateCard(card.id, 'back', e.target.value)} 
                    placeholder="La définition ou réponse..." 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg p-3 text-sm font-medium resize-none transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!generating && (
        <div className="flex justify-center mt-4">
          <button onClick={addCardRow} className="flex items-center gap-2 bg-white border border-gray-200 px-5 py-3 rounded-full text-sm font-bold hover:bg-gray-50 transition-colors cursor-pointer text-gray-700 shadow-sm">
            <Plus size={18} className="text-gray-500" /> Ajouter une carte manuelle
          </button>
        </div>
      )}

      {!generating && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-200 z-40 flex justify-center">
          <div className="max-w-4xl w-full flex justify-end">
            <button onClick={handleSubmit} disabled={saving} className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-lg">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Injection dans la mémoire...' : 'Valider et Sauvegarder le Set'}
            </button>
          </div>
        </div>
      )}

      {showBulkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Importer du texte</h3>
              <button onClick={() => setShowBulkImport(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Vous pouvez importer des cartes exactes (Format : "Question - Réponse") ou demander à l'IA de concevoir des cartes depuis vos notes.
            </p>
            <textarea
              autoFocus value={bulkText} onChange={(e) => setBulkText(e.target.value)}
              placeholder="Collez votre texte de cours ou vos cartes formatées ici..."
              className="w-full h-64 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono focus:border-blue-500 resize-none whitespace-pre"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleBulkImportProcess} className="flex-1 bg-white border border-gray-200 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 cursor-pointer text-gray-700">
                Parser (Format exact)
              </button>
              <button onClick={handleAIGenerationFromModal} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 cursor-pointer">
                Générer avec l'IA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

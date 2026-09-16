import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, FileText, LayoutGrid, Scale, Plus, X, CheckSquare, Square, FolderInput, UploadCloud, Sparkles, Calendar, BookOpen, FileEdit, BrainCircuit, CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronRight, ClipboardPaste, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { InlineEditableTitle } from '../components/ui/InlineEditableTitle';
import { ResourceMenu } from '../components/ui/ResourceMenu';
import { BulkSelectionToolbar } from '../components/ui/BulkSelectionToolbar';
import { fetchCourseById, updateCourse, fetchCourseChapters, fetchCourseDocuments, fetchCourseGrades, fetchNotes, fetchFlashcards, fetchCourses, deleteDocument, createChapter, parseAndCreateChaptersFromSyllabus, fetchEvents, updateChapterParent, batchMoveItems, batchMoveFlashcards, batchDeleteFlashcards, getCurrentUserId, updateFlashcard, createFlashcard, deleteFlashcard } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import { extractTextFromPDF, generateAISummary } from '../lib/aiService';

type TabType = 'overview' | 'chapters' | 'resources' | 'notes' | 'flashcards' | 'grades';

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState<TabType>((location.state as any)?.tab || 'overview');
  
  const [course, setCourse] = useState<any>(null);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [courseEvents, setCourseEvents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [parentChapterId, setParentChapterId] = useState<string | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<{id: string, path: string} | null>(null);
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiTarget, setAiTarget] = useState<{ type: 'document' | 'chapter', id: string, name: string } | null>(null);
  const [aiConfig, setAiConfig] = useState({ action: 'flashcards', pageStart: '', pageEnd: '' });

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState({ front: '', back: '' });
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);
  const [batchTargetId, setBatchTargetId] = useState<string | null>(null);
  const [moveContext, setMoveContext] = useState<'chapters_docs' | 'flashcards'>('chapters_docs');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSyllabusText, setBulkSyllabusText] = useState('');

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  async function loadData() {
    setLoading(true);
    try {
      const [courseData, chaptersData, docsData, gradesData, notesData, flashcardsData, eventsData, allCoursesData] = await Promise.all([
        fetchCourseById(courseId!), fetchCourseChapters(courseId!), fetchCourseDocuments(courseId!), fetchCourseGrades(courseId!), fetchNotes(), fetchFlashcards(courseId!), fetchEvents(), fetchCourses()
      ]);
      setCourse(courseData); setChapters(chaptersData); setDocuments(docsData); setGrades(gradesData);
      setNotes(notesData.filter((n: any) => n.course_id === courseId)); setFlashcards(flashcardsData); setCourseEvents(eventsData.filter((e: any) => e.course_id === courseId));
      setAllCourses(allCoursesData);
      const initialOpenState: Record<string, boolean> = {};
      chaptersData.forEach((ch: any) => { initialOpenState[ch.id] = true; });
      setOpenChapters(initialOpenState);
    } catch (err) { toast("Erreur de chargement du cours", "error"); } finally { setLoading(false); }
  }

  const handleUpdateCourseTitle = async (newTitle: string) => {
    if (!courseId) return;
    await updateCourse(courseId, { ...course, title: newTitle });
    setCourse({ ...course, title: newTitle });
  };

  const handleUpdateChapterTitle = async (chapterId: string, newTitle: string) => {
    const { error } = await supabase.from('chapters').update({ title: newTitle }).eq('id', chapterId);
    if (error) throw error;
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, title: newTitle } : c));
  };

  const toggleChapter = (chapterId: string) => setOpenChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  const handleToggleAll = (open: boolean) => {
    const newState: Record<string, boolean> = {};
    chapters.forEach(ch => { newState[ch.id] = open; });
    setOpenChapters(newState);
  };
  const toggleSelectChapter = (id: string) => setSelectedChapterIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const toggleSelectDoc = (id: string) => setSelectedDocIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const toggleSelectCard = (id: string) => setSelectedCardIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);

  const clearSelection = () => { setSelectedChapterIds([]); setSelectedDocIds([]); setSelectedCardIds([]); setIsSelectMode(false); };
  const totalSelectedCount = selectedChapterIds.length + selectedDocIds.length + selectedCardIds.length;

  const handleSelectAll = () => {
    if (selectedChapterIds.length === chapters.length && selectedDocIds.length === documents.length) clearSelection();
    else { setSelectedChapterIds(chapters.map(c => c.id)); setSelectedDocIds(documents.map(d => d.id)); }
  };

  const handleBatchDelete = async () => {
    try {
      if (selectedChapterIds.length > 0) await supabase.from('chapters').delete().in('id', selectedChapterIds);
      if (selectedDocIds.length > 0) {
        for (const docId of selectedDocIds) {
          const doc = documents.find(d => d.id === docId);
          if (doc?.bucket_path) await supabase.storage.from('user-documents').remove([doc.bucket_path]);
        }
        await supabase.from('documents').delete().in('id', selectedDocIds);
      }
      if (selectedCardIds.length > 0) await batchDeleteFlashcards(selectedCardIds);
      toast(`${totalSelectedCount} éléments supprimés`, "success", () => { toast("Annulation (Simulation)", "info"); loadData(); });
      clearSelection(); setIsBatchDeleteModalOpen(false); loadData();
    } catch (err) { toast("Erreur lors de la suppression", "error"); }
  };

  const openBatchMoveModal = (context: 'chapters_docs' | 'flashcards') => { setMoveContext(context); setBatchTargetId(null); setIsBatchMoveModalOpen(true); };

  const handleBatchMoveSubmit = async () => {
    try {
      if (moveContext === 'chapters_docs') await batchMoveItems(selectedChapterIds, selectedDocIds, batchTargetId);
      else if (moveContext === 'flashcards' && batchTargetId) await batchMoveFlashcards(selectedCardIds, batchTargetId);
      toast(`${totalSelectedCount} éléments déplacés`, "success", () => { toast("Déplacement annulé", "info"); loadData(); });
      clearSelection(); setIsBatchMoveModalOpen(false); loadData();
    } catch (err) { toast("Erreur lors du déplacement", "error"); }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !courseId) return;
    try {
      await createChapter({ course_id: courseId, title: newChapterTitle.trim(), parent_id: parentChapterId, order_index: chapters.length + 1 });
      setNewChapterTitle(''); setIsAddingChapter(false); setParentChapterId(null); toast("Chapitre ajouté", "success"); loadData();
    } catch (err) { toast("Erreur lors de la création", "error"); }
  };

  const confirmDeleteChapter = async () => {
    if (!chapterToDelete) return;
    try { await supabase.from('chapters').delete().eq('id', chapterToDelete); setChapterToDelete(null); toast("Chapitre supprimé", "success"); loadData(); } catch (err) { toast("Erreur lors de la suppression", "error"); }
  };

  const handleBulkImport = async () => {
    if (!bulkSyllabusText.trim() || !courseId) return;
    try {
      await parseAndCreateChaptersFromSyllabus(courseId, bulkSyllabusText);
      setBulkSyllabusText(''); setShowBulkModal(false); toast("Syllabus importé", "success"); loadData();
    } catch (err) { toast("Erreur lors de l'importation", "error"); }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try { await deleteDocument(docToDelete.id, docToDelete.path); setDocToDelete(null); toast("Document supprimé", "success"); loadData(); } catch (err) { toast("Erreur lors de la suppression", "error"); }
  };

  // --- NOUVEAU HANDLE LAUNCH AI ---
  const handleLaunchAI = async () => {
    if (!aiTarget) return;
    setIsAIModalOpen(false);
    toast(`Extraction du texte de ${aiTarget.name}...`, "info");
    try {
      let textToAnalyze = "";
      if (aiTarget.type === 'document') {
        const doc = documents.find(d => d.id === aiTarget.id);
        const { data: urlData } = await supabase.storage.from('user-documents').createSignedUrl(doc!.bucket_path, 60);
        textToAnalyze = await extractTextFromPDF(urlData!.signedUrl, aiConfig.pageStart ? parseInt(aiConfig.pageStart) : undefined, aiConfig.pageEnd ? parseInt(aiConfig.pageEnd) : undefined);
      } else if (aiTarget.type === 'chapter') {
        const chapterNotes = notes.filter(n => n.title.includes(aiTarget.name));
        textToAnalyze = chapterNotes.map(n => n.content).join('\n\n');
        if (!textToAnalyze) throw new Error("Aucune note dans ce chapitre.");
      }
      
      if (aiConfig.action === 'flashcards') {
        // Au lieu de sauvegarder directement, on redirige vers l'éditeur de lot avec le texte !
        navigate('/add/flashcards/batch', {
          state: {
            courseId: courseId!,
            chapterId: aiTarget.type === 'chapter' ? aiTarget.id : undefined,
            extractedText: textToAnalyze
          }
        });
      } else if (aiConfig.action === 'summary') {
        const summary = await generateAISummary(textToAnalyze);
        const userId = await getCurrentUserId();
        await supabase.from('notes').insert([{ user_id: userId, course_id: courseId, title: `Résumé IA : ${aiTarget.name}`, content: summary }]);
        toast("Résumé généré dans vos notes", "success"); loadData();
      }
    } catch (err: any) { toast(err.message || "L'extraction a échoué.", "error"); }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.front || !cardForm.back || !courseId) return;
    try {
      if (editingCardId) { await updateFlashcard(editingCardId, { ...cardForm, course_id: courseId }); toast("Carte modifiée", "success"); } 
      else { await createFlashcard({ ...cardForm, course_id: courseId }); toast("Carte ajoutée", "success"); }
      setIsCardModalOpen(false); loadData();
    } catch (err) { toast("Erreur lors de la sauvegarde", "error"); }
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;
    try { await deleteFlashcard(cardToDelete); toast("Carte supprimée", "success", () => loadData()); setCardToDelete(null); loadData(); } catch (err) { toast("Erreur", "error"); }
  };

  const buildChapterTree = (flatChapters: any[]) => {
    const map = new Map(); const roots: any[] = [];
    flatChapters.forEach(ch => map.set(ch.id, { ...ch, children: [] }));
    flatChapters.forEach(ch => { if (ch.parent_id && map.has(ch.parent_id)) map.get(ch.parent_id).children.push(map.get(ch.id)); else roots.push(map.get(ch.id)); });
    return roots;
  };

  if (loading) return <div className="text-center p-12 text-text-muted font-mono animate-pulse">Chargement...</div>;
  if (!course) return <div className="text-center p-12 text-text-muted">Cours introuvable</div>;

  const chapterTree = buildChapterTree(chapters);
  const dueCardsCount = flashcards.filter(f => !f.due_at || new Date(f.due_at) <= new Date()).length;
  const masteredCards = flashcards.filter(f => f.ease_factor >= 2.5).length;
  const progressPercent = flashcards.length > 0 ? Math.round((masteredCards / flashcards.length) * 100) : 0;
  const nextEvent = courseEvents.filter(e => new Date(e.event_date) > new Date()).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0];

  const renderChapterItem = (chapter: any, depth = 0) => {
    const chapterDocs = documents.filter(d => d.chapter_id === chapter.id);
    const chapterCards = flashcards.filter(f => f.chapter_id === chapter.id);
    const isOpen = openChapters[chapter.id] ?? true;
    const isSelected = selectedChapterIds.includes(chapter.id);
    const docsCount = chapterDocs.length; const cardsCount = chapterCards.length;

    return (
      <div key={chapter.id} className="flex flex-col gap-2 relative">
        <div className={`bg-surface border rounded-card overflow-hidden shadow-none transition-all ${isSelected ? 'border-accent bg-accent/5' : 'border-border/60'}`}>
          <div className="p-3.5 flex items-center justify-between hover:bg-surface-interactive transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
              {isSelectMode && (
                <div onClick={(e) => { e.stopPropagation(); toggleSelectChapter(chapter.id); }} className="text-accent cursor-pointer shrink-0">
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-text-muted" />}
                </div>
              )}
              <div className="text-text-muted shrink-0 cursor-pointer p-1 hover:text-text" onClick={() => !isSelectMode && toggleChapter(chapter.id)}>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                <InlineEditableTitle initialTitle={chapter.title} onSave={(newTitle) => handleUpdateChapterTitle(chapter.id, newTitle)} textClass="text-sm font-semibold font-sans truncate" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {!isSelectMode && (
                <>
                  <div className="hidden md:flex items-center gap-2 mr-2">
                    <div className="flex items-center gap-1 text-[10px] bg-surface-elevated px-2 py-0.5 rounded border border-border/50"><FileText size={10} className={docsCount > 0 ? 'text-info' : 'text-text-muted opacity-50'} /><span className="font-mono">{docsCount}</span></div>
                    <div className="flex items-center gap-1 text-[10px] bg-surface-elevated px-2 py-0.5 rounded border border-border/50"><BrainCircuit size={10} className={cardsCount > 0 ? 'text-warning' : 'text-text-muted opacity-50'} /><span className="font-mono">{cardsCount}</span></div>
                    {docsCount > 0 && cardsCount > 0 ? <CheckCircle2 size={14} className="text-success ml-1" /> : <Circle size={14} className="text-text-muted opacity-30 ml-1" />}
                  </div>
                  <button onClick={() => { setAiTarget({ type: 'chapter', id: chapter.id, name: chapter.title }); setIsAIModalOpen(true); }} className="p-1.5 text-text-muted hover:text-warning transition-colors rounded cursor-pointer group/ai" title="Générer avec IA"><Sparkles size={16} className="group-hover/ai:animate-pulse" /></button>
                  <div className="pl-1 border-l border-border/50 ml-1">
                    <ResourceMenu onMove={() => { setSelectedChapterIds([chapter.id]); openBatchMoveModal('chapters_docs'); }} onDelete={() => setChapterToDelete(chapter.id)} />
                  </div>
                </>
              )}
            </div>
          </div>
          {isOpen && (
            <div className="border-t border-border/40 bg-background/20 flex flex-col">
              {chapterDocs.length > 0 && (
                <div className="flex flex-col divide-y divide-border/40">
                  {chapterDocs.map(doc => {
                    const isPdf = doc.mime_type === 'application/pdf' || doc.original_name.endsWith('.pdf');
                    return (
                      <div key={doc.id} onClick={() => isSelectMode ? toggleSelectDoc(doc.id) : navigate(`/viewer/${doc.id}`)} className={`p-3 pl-12 flex items-center justify-between cursor-pointer transition-colors ${selectedDocIds.includes(doc.id) ? 'bg-accent/15' : 'hover:bg-surface-interactive'}`}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isSelectMode && <div onClick={(e) => { e.stopPropagation(); toggleSelectDoc(doc.id); }} className="text-accent cursor-pointer shrink-0">{selectedDocIds.includes(doc.id) ? <CheckSquare size={16} /> : <Square size={16} className="text-text-muted" />}</div>}
                          <div className={`p-1.5 rounded-lg shrink-0 ${isPdf ? 'bg-danger/10 text-danger' : 'bg-info/10 text-info'}`}><FileText size={14} /></div>
                          <p className="text-sm font-medium text-text truncate hover:text-accent transition-colors">{doc.original_name}</p>
                        </div>
                        {!isSelectMode && (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setAiTarget({ type: 'document', id: doc.id, name: doc.original_name }); setIsAIModalOpen(true); }} className="p-1.5 text-text-muted hover:text-warning rounded-lg transition-colors cursor-pointer"><Sparkles size={14} /></button>
                            <ResourceMenu onMove={() => { setSelectedDocIds([doc.id]); openBatchMoveModal('chapters_docs'); }} onDelete={() => setDocToDelete({ id: doc.id, path: doc.bucket_path })} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {chapter.children && chapter.children.length > 0 && <div className="flex flex-col gap-2 p-2.5 border-t border-border/30 bg-background/40">{chapter.children.map((child: any) => renderChapterItem(child, depth + 1))}</div>}
              {chapterDocs.length === 0 && (!chapter.children || chapter.children.length === 0) && <div className="p-4 text-center text-xs text-text-muted italic flex items-center justify-center gap-3">Chapitre vide. <button onClick={() => navigate('/add/document', { state: { courseId, chapterId: chapter.id } })} className="text-accent hover:underline cursor-pointer flex items-center gap-1"><UploadCloud size={12}/> Ajouter un document</button></div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 animate-in fade-in duration-300">
      <header className="flex flex-col gap-6 text-text">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/courses')} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 cursor-pointer"><ChevronLeft size={20} /> <span className="text-sm font-medium">Retour</span></button>
          <ResourceMenu onEdit={() => navigate(`/edit/course/${course.id}`)} onDelete={() => toast("Utilisez la page Plan d'études pour supprimer un cours entier", "info")} />
        </div>
        <div>
          <InlineEditableTitle initialTitle={course.title} onSave={handleUpdateCourseTitle} textClass="font-serif text-4xl md:text-5xl font-bold mb-3 leading-tight" />
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted mt-2">
            <Badge variant="outline" className="font-mono bg-surface">{course.course_code || 'Général'}</Badge>
            <span className="text-accent font-bold bg-accent/10 px-2 py-1 rounded-md">{course.ects} ECTS</span>
            <span>•</span><span className="flex items-center gap-1.5"><Scale size={14} /> {course.teacher_name || 'Professeur non spécifié'}</span>
          </div>
        </div>

        <div className="flex bg-surface-elevated p-1 rounded-xl overflow-x-auto custom-scrollbar border border-border/50 shadow-inner w-full sm:w-fit mt-2">
          {[{ id: 'overview', label: "Vue d'ensemble" }, { id: 'chapters', label: `Chapitres (${chapters.length})` }, { id: 'resources', label: `Documents (${documents.length})` }, { id: 'notes', label: `Notes (${notes.length})` }, { id: 'flashcards', label: `Flashcards (${flashcards.length})` }, { id: 'grades', label: `Résultats` }].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as TabType); setIsSelectMode(false); clearSelection(); }} className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-btn text-sm font-bold transition-all cursor-pointer ${activeTab === tab.id ? 'bg-accent text-background shadow-apple-subtle' : 'text-text-muted hover:text-text hover:bg-surface-interactive'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-2">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2 bg-surface p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between"><h3 className="font-bold text-sm text-text-muted uppercase tracking-wider">Progression de la matière</h3><span className="font-serif text-2xl font-bold text-accent">{progressPercent}%</span></div>
                <ProgressBar value={progressPercent} max={100} colorClass="bg-accent" />
                <div className="flex justify-between items-center mt-2"><span className="text-xs text-text-muted">{flashcards.length} cartes au total</span>{dueCardsCount > 0 ? <span className="text-xs font-bold text-warning flex items-center gap-1"><AlertCircle size={14}/> {dueCardsCount} à réviser</span> : <span className="text-xs font-bold text-success flex items-center gap-1"><CheckCircle2 size={14}/> À jour</span>}</div>
              </Card>
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/editor/new')} className="flex-1 bg-surface-elevated border border-border rounded-card flex items-center justify-center gap-2 font-bold text-sm hover:bg-surface-interactive hover:border-accent/50 transition-all cursor-pointer group"><FileEdit size={18} className="text-text-muted group-hover:text-accent transition-colors" /> Note rapide</button>
                <button onClick={() => navigate('/session/' + course.id, { state: { from: `/courses/${course.id}` } })} className="flex-1 bg-accent text-background rounded-card flex items-center justify-center gap-2 font-bold text-sm glow-gold hover:bg-accent-strong transition-all cursor-pointer"><BrainCircuit size={18} /> Réviser</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nextEvent ? (
                <Card className="bg-info/10 border border-info/20 p-5 flex flex-col gap-3"><div className="flex items-center gap-2 text-info font-bold text-xs uppercase tracking-wider"><Calendar size={16} /> Prochaine échéance</div><div><h4 className="font-serif text-lg font-bold text-text">{nextEvent.title}</h4><p className="text-sm text-text-muted mt-1">{new Date(nextEvent.event_date).toLocaleString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}</p></div></Card>
              ) : (<Card className="bg-surface p-5 flex items-center justify-center text-center border-dashed"><p className="text-sm text-text-muted">Aucune échéance planifiée pour ce cours.</p></Card>)}
              <Card className="bg-surface p-5 flex flex-col gap-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-text-muted">Derniers ajouts</h4>
                <div className="flex flex-col gap-3 mt-2">
                  {documents.slice(0,2).map(d => <div key={d.id} onClick={() => navigate(`/viewer/${d.id}`)} className="flex items-center justify-between cursor-pointer hover:text-accent transition-colors text-sm group"><div className="flex items-center gap-3"><FileText size={14} className="text-text-muted group-hover:text-accent" /> <span className="truncate">{d.original_name}</span></div><ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" /></div>)}
                  {notes.slice(0,1).map(n => <div key={n.id} onClick={() => navigate(`/editor/${n.id}`)} className="flex items-center justify-between cursor-pointer hover:text-accent transition-colors text-sm group"><div className="flex items-center gap-3"><FileEdit size={14} className="text-text-muted group-hover:text-accent" /> <span className="truncate">{n.title}</span></div><ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" /></div>)}
                  {documents.length === 0 && notes.length === 0 && <span className="text-xs text-text-muted italic">La matière est vide.</span>}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'chapters' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2 bg-surface p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-text flex items-center gap-2"><LayoutGrid size={18} className="text-accent" /> Plan du cours</h2>
                {chapters.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-text-muted font-medium bg-surface-elevated px-2 py-1 rounded-md border border-border/50">
                    <button onClick={() => handleToggleAll(true)} className="hover:text-text transition-colors cursor-pointer">Tout déplier</button><span>|</span><button onClick={() => handleToggleAll(false)} className="hover:text-text transition-colors cursor-pointer">Tout plier</button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button onClick={() => { setIsSelectMode(!isSelectMode); if (isSelectMode) clearSelection(); }} className={`text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-btn border transition-colors cursor-pointer shrink-0 ${isSelectMode ? 'bg-accent text-background border-accent' : 'bg-surface-elevated border-border text-text hover:bg-surface-interactive'}`}><CheckSquare size={14} /> Sélection</button>
                <button onClick={() => setShowBulkModal(true)} className="text-xs text-text font-bold flex items-center gap-1 hover:bg-surface-interactive transition-colors cursor-pointer bg-surface-elevated px-3 py-2 rounded-btn border border-border shrink-0"><ClipboardPaste size={14} className="text-text-muted" /> Importer Plan</button>
                <button onClick={() => { setParentChapterId(null); setIsAddingChapter(true); }} className="text-xs text-background font-bold flex items-center gap-1 cursor-pointer bg-text px-3 py-2 rounded-btn hover:bg-text/90 shrink-0"><Plus size={14} /> Chapitre</button>
              </div>
            </div>
            
            {isAddingChapter && (
              <form onSubmit={handleCreateChapter} className="bg-surface border border-accent/40 p-4 rounded-2xl flex flex-col gap-3 animate-in fade-in duration-200">
                <span className="text-xs font-bold text-accent">{parentChapterId ? "Ajouter un sous-chapitre" : "Ajouter un chapitre principal"}</span>
                <div className="flex gap-2">
                  <input type="text" autoFocus value={newChapterTitle} onChange={(e) => setNewChapterTitle(e.target.value)} placeholder="Intitulé (ex: 1.1 Notion de consentement)" className="flex-1 bg-background border border-border rounded-input px-3 py-2 text-sm focus:border-accent" />
                  <button type="submit" className="bg-accent text-background px-4 py-2 rounded-btn text-xs font-bold cursor-pointer">Créer</button>
                </div>
              </form>
            )}

            {chapters.length === 0 && !isAddingChapter ? (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl text-text-muted text-sm flex flex-col items-center gap-3"><LayoutGrid size={32} className="opacity-20" /><p>Aucun chapitre. Construisez la structure du cours.</p></div>
            ) : (<div className="flex flex-col gap-3">{chapterTree.map(rootChapter => renderChapterItem(rootChapter, 0))}</div>)}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
             {documents.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-muted text-sm">Aucun document importé.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map(doc => {
                  const isPdf = doc.mime_type === 'application/pdf' || doc.original_name.endsWith('.pdf');
                  return (
                    <Card key={doc.id} onClick={() => navigate(`/viewer/${doc.id}`)} className="p-4 flex items-center gap-4 hover:border-accent/50 cursor-pointer group">
                      <div className={`p-3 rounded-xl shrink-0 ${isPdf ? 'bg-danger/10 text-danger' : 'bg-info/10 text-info'}`}><FileText size={20} /></div>
                      <div className="flex flex-col min-w-0 flex-1"><span className="font-bold text-sm text-text truncate group-hover:text-accent transition-colors">{doc.original_name}</span><span className="text-[10px] text-text-muted font-mono uppercase tracking-wider mt-1">{doc.document_type} • {doc.chapters?.title || 'Global'}</span></div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}><ResourceMenu onDelete={() => setDocToDelete({ id: doc.id, path: doc.bucket_path })} /></div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {notes.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-muted text-sm">Aucune note liée à ce cours.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {notes.map(note => (
                  <Card key={note.id} onClick={() => navigate(`/editor/${note.id}`)} className="p-5 flex flex-col gap-3 cursor-pointer hover:border-accent/50 group">
                    <h3 className="font-serif font-bold text-lg text-text group-hover:text-accent transition-colors truncate">{note.title}</h3>
                    <p className="text-sm text-text-muted line-clamp-3 font-serif">{note.content}</p>
                    <span className="text-[10px] text-text-muted font-mono mt-2">Mise à jour : {new Date(note.updated_at).toLocaleDateString()}</span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="flex justify-between items-center mb-2 bg-surface p-4 rounded-2xl border border-border">
              <h2 className="text-sm font-bold text-text">Cartes du Set ({flashcards.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => setIsSelectMode(!isSelectMode)} className={`text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-btn border transition-colors cursor-pointer ${isSelectMode ? 'bg-accent text-background border-accent' : 'bg-surface-elevated border-border text-text hover:bg-surface-interactive'}`}><CheckSquare size={14} /> Sélection</button>
                <button onClick={() => { setEditingCardId(null); setCardForm({front: '', back: ''}); setIsCardModalOpen(true); }} className="text-xs bg-surface-elevated border border-border px-3 py-2 rounded-btn font-bold flex items-center gap-1.5 hover:bg-surface-interactive cursor-pointer"><Plus size={14} /> Ajouter</button>
              </div>
            </div>
            
            {flashcards.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-muted text-sm">Aucune flashcard.</div>
            ) : (
              <div className="flex flex-col border border-border bg-surface rounded-card overflow-hidden shadow-sm">
                {flashcards.map((card, idx) => {
                  const isSelected = selectedCardIds.includes(card.id);
                  return (
                    <div key={card.id} onClick={() => isSelectMode ? toggleSelectCard(card.id) : null} className={`p-4 flex items-start gap-4 transition-colors group ${idx !== flashcards.length -1 ? 'border-b border-border/50' : ''} ${isSelected ? 'bg-accent/5 border-l-4 border-l-accent' : 'hover:bg-surface-interactive border-l-4 border-l-transparent'}`}>
                      {isSelectMode && <div className="mt-1 text-accent cursor-pointer shrink-0">{isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-text-muted" />}</div>}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2"><Badge variant={card.ease_factor >= 2.5 ? 'success' : 'warning'} className="text-[9px] shrink-0 mb-1">{card.ease_factor >= 2.5 ? 'Maîtrisée' : 'À revoir'}</Badge></div>
                        <p className="text-sm font-medium text-text"><span className="text-text-muted font-mono mr-2 text-xs">Q:</span>{card.front}</p>
                        <p className="text-sm text-text-muted mt-1"><span className="opacity-50 font-mono mr-2 text-xs">R:</span>{card.back}</p>
                      </div>
                      {!isSelectMode && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ResourceMenu onEdit={() => { setEditingCardId(card.id); setCardForm({front: card.front, back: card.back}); setIsCardModalOpen(true); }} onMove={() => { setSelectedCardIds([card.id]); openBatchMoveModal('flashcards'); }} onDelete={() => setCardToDelete(card.id)} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="flex flex-col gap-4 animate-in fade-in">
            {grades.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-muted text-sm">Aucune note enregistrée.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {grades.map(g => (
                  <Card key={g.id} className="p-5 flex items-center justify-between border-l-4 border-l-info">
                    <div className="flex flex-col"><span className="font-bold text-sm text-text">{g.eval_type}</span><span className="text-xs text-text-muted">Pondération : {g.weight}%</span></div>
                    <span className={`font-serif text-3xl font-bold ${g.grade >= 4.0 ? 'text-success' : 'text-danger'}`}>{g.grade.toFixed(2)}</span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BulkSelectionToolbar 
        selectedCount={totalSelectedCount} onClear={clearSelection}
        onMove={() => {
          if (selectedCardIds.length > 0 && selectedChapterIds.length === 0 && selectedDocIds.length === 0) openBatchMoveModal('flashcards');
          else if (selectedChapterIds.length > 0 || selectedDocIds.length > 0) openBatchMoveModal('chapters_docs');
          else toast("Sélection mixte non supportée pour le déplacement", "warning");
        }}
        onDelete={() => setIsBatchDeleteModalOpen(true)}
      />

      {/* --- MODALE IA : REVISITÉE POUR PRÉVISUALISATION --- */}
      {isAIModalOpen && aiTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-modal p-6 shadow-apple flex flex-col gap-5 text-text">
            <div className="flex justify-between items-center pb-3 border-b border-border/50">
              <h3 className="font-serif text-xl font-bold flex items-center gap-2 text-warning"><Sparkles size={20} /> Assistant IA Lexi</h3>
              <button onClick={() => setIsAIModalOpen(false)} className="p-1.5 hover:bg-surface rounded-full text-text-muted cursor-pointer"><X size={20} /></button>
            </div>
            <p className="text-sm font-medium text-text">Cible : <span className="text-accent">{aiTarget.name}</span></p>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] uppercase font-bold text-text-muted">Type de tâche</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setAiConfig({...aiConfig, action: 'flashcards'})} className={`py-2 px-3 rounded-btn text-xs font-bold border transition-colors cursor-pointer ${aiConfig.action === 'flashcards' ? 'bg-warning/10 border-warning text-warning' : 'bg-surface border-border text-text-muted'}`}>Flashcards</button>
                <button onClick={() => setAiConfig({...aiConfig, action: 'summary'})} className={`py-2 px-3 rounded-btn text-xs font-bold border transition-colors cursor-pointer ${aiConfig.action === 'summary' ? 'bg-info/10 border-info text-info' : 'bg-surface border-border text-text-muted'}`}>Résumé</button>
              </div>
            </div>
            {aiTarget.type === 'document' && (
              <div className="flex flex-col gap-2 p-3 bg-surface border border-border rounded-xl">
                <label className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1.5">Fichier volumineux ? Cibler les pages</label>
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="Début" value={aiConfig.pageStart} onChange={(e) => setAiConfig({...aiConfig, pageStart: e.target.value})} className="w-full bg-background border border-border rounded-input px-3 py-2 text-sm focus:border-warning" />
                  <span className="text-text-muted">à</span>
                  <input type="number" placeholder="Fin" value={aiConfig.pageEnd} onChange={(e) => setAiConfig({...aiConfig, pageEnd: e.target.value})} className="w-full bg-background border border-border rounded-input px-3 py-2 text-sm focus:border-warning" />
                </div>
              </div>
            )}
            <button onClick={handleLaunchAI} className="mt-2 bg-text text-background py-3 rounded-btn text-sm font-bold shadow-sm hover:scale-[1.02] transition-transform cursor-pointer">Extraire et Prévisualiser</button>
          </div>
        </div>
      )}

      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-modal p-6 shadow-apple flex flex-col gap-4">
            <h3 className="font-serif text-xl font-bold">{editingCardId ? "Modifier la carte" : "Nouvelle carte"}</h3>
            <form onSubmit={handleSaveCard} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-[10px] uppercase font-bold text-text-muted">
                Question (Recto)
                <textarea required rows={3} value={cardForm.front} onChange={(e) => setCardForm({...cardForm, front: e.target.value})} className="bg-background border border-border rounded-input px-3 py-2 text-sm font-serif text-text focus:border-accent resize-none" />
              </label>
              <label className="flex flex-col gap-1 text-[10px] uppercase font-bold text-accent">
                Réponse (Verso)
                <textarea required rows={3} value={cardForm.back} onChange={(e) => setCardForm({...cardForm, back: e.target.value})} className="bg-background border border-border rounded-input px-3 py-2 text-sm font-serif text-text focus:border-accent resize-none" />
              </label>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsCardModalOpen(false)} className="px-4 py-2 bg-surface border border-border rounded-btn text-xs font-bold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-accent text-background rounded-btn text-xs font-bold glow-gold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBatchMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-modal p-6 shadow-apple flex flex-col gap-4 text-text">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <h3 className="font-serif text-xl font-bold">Déplacer la sélection</h3>
              <button onClick={() => setIsBatchMoveModalOpen(false)} className="p-1.5 hover:bg-surface rounded-full text-text-muted cursor-pointer"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-accent">Destination</label>
              <select value={batchTargetId || ''} onChange={(e) => setBatchTargetId(e.target.value ? e.target.value : null)} className="bg-background border border-border rounded-input px-3.5 py-2.5 text-sm text-text w-full focus:border-accent cursor-pointer">
                {moveContext === 'chapters_docs' ? (
                  <><option value="">(Racine du cours actuel)</option>{chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</>
                ) : (
                  <><option value="" disabled>Sélectionner un Set (Cours)...</option>{allCourses.filter(c => c.id !== courseId).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</>
                )}
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setIsBatchMoveModalOpen(false)} className="flex-1 bg-surface border border-border py-2.5 rounded-btn text-sm cursor-pointer">Annuler</button>
              <button onClick={handleBatchMoveSubmit} disabled={moveContext === 'flashcards' && !batchTargetId} className="flex-1 bg-accent text-background py-2.5 rounded-btn text-sm font-bold glow-gold cursor-pointer disabled:opacity-50">Déplacer</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!docToDelete} title="Supprimer le document ?" message="Ce document sera effacé." confirmText="Supprimer" isDanger={true} onConfirm={handleDeleteDocument} onClose={() => setDocToDelete(null)} />
      <ConfirmModal isOpen={!!chapterToDelete} title="Supprimer le chapitre ?" message="Les sous-chapitres associés seront également supprimés." confirmText="Supprimer" isDanger={true} onConfirm={confirmDeleteChapter} onClose={() => setChapterToDelete(null)} />
      <ConfirmModal isOpen={isBatchDeleteModalOpen} title="Supprimer la sélection ?" message={`Supprimer les ${totalSelectedCount} éléments ?`} confirmText="Tout supprimer" isDanger={true} onConfirm={handleBatchDelete} onClose={() => setIsBatchDeleteModalOpen(false)} />
      <ConfirmModal isOpen={!!cardToDelete} title="Supprimer la flashcard ?" message="Cette carte sera définitivement effacée." confirmText="Supprimer" isDanger={true} onConfirm={confirmDeleteCard} onClose={() => setCardToDelete(null)} />
    </div>
  );
}

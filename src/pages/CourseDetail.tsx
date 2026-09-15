import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Edit3, Trash2, BrainCircuit, FileEdit, Award, LayoutGrid, Scale, Plus, X, Check, ClipboardPaste, ChevronRight, ChevronDown, Calendar, Clock, CornerDownRight, CheckSquare, Square } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { fetchCourseById, fetchCourseChapters, fetchCourseDocuments, fetchCourseGrades, fetchNotes, fetchFlashcards, deleteDocument, createChapter, parseAndCreateChaptersFromSyllabus, fetchEvents, createEvent } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [courseEvents, setCourseEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [docToDelete, setDocToDelete] = useState<{id: string, path: string} | null>(null);

  // Gestion des chapitres
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [parentChapterId, setParentChapterId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);

  // Import en masse
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSyllabusText, setBulkSyllabusText] = useState('');

  // Planning du cours
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', event_date: '', category: 'Cours' });
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // État plié/déplié des chapitres
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  // NOUVEAU : État pour la sélection multiple (Batch Selection)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  async function loadData() {
    setLoading(true);
    try {
      const [courseData, chaptersData, docsData, gradesData, notesData, flashcardsData, eventsData] = await Promise.all([
        fetchCourseById(courseId!),
        fetchCourseChapters(courseId!),
        fetchCourseDocuments(courseId!),
        fetchCourseGrades(courseId!),
        fetchNotes(),
        fetchFlashcards(courseId!),
        fetchEvents()
      ]);
      setCourse(courseData);
      setChapters(chaptersData);
      setDocuments(docsData);
      setGrades(gradesData);
      setNotes(notesData.filter((n: any) => n.course_id === courseId));
      setFlashcards(flashcardsData);
      setCourseEvents(eventsData.filter((e: any) => e.course_id === courseId));

      const initialOpenState: Record<string, boolean> = {};
      chaptersData.forEach((ch: any) => { initialOpenState[ch.id] = true; });
      setOpenChapters(initialOpenState);
    } catch (err) {
      console.error("Erreur chargement:", err);
      toast("Erreur de chargement du cours", "error");
    } finally {
      setLoading(false);
    }
  }

  const toggleChapter = (chapterId: string) => {
    setOpenChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleToggleAll = (open: boolean) => {
    const newState: Record<string, boolean> = {};
    chapters.forEach(ch => { newState[ch.id] = open; });
    setOpenChapters(newState);
  };

  // Gestion de la sélection multiple
  const toggleSelectChapter = (id: string) => {
    setSelectedChapterIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedChapterIds.length === chapters.length && selectedDocIds.length === documents.length) {
      setSelectedChapterIds([]);
      setSelectedDocIds([]);
    } else {
      setSelectedChapterIds(chapters.map(c => c.id));
      setSelectedDocIds(documents.map(d => d.id));
    }
  };

  // Suppression en masse (Batch Delete)
  const handleBatchDelete = async () => {
    try {
      if (selectedChapterIds.length > 0) {
        const { error } = await supabase.from('chapters').delete().in('id', selectedChapterIds);
        if (error) throw error;
      }
      if (selectedDocIds.length > 0) {
        // Supprimer les fichiers physiques du storage avant de supprimer les lignes
        for (const docId of selectedDocIds) {
          const doc = documents.find(d => d.id === docId);
          if (doc?.bucket_path) {
            await supabase.storage.from('user-documents').remove([doc.bucket_path]);
          }
        }
        const { error } = await supabase.from('documents').delete().in('id', selectedDocIds);
        if (error) throw error;
      }
      toast("Éléments sélectionnés supprimés avec succès", "success");
      setSelectedChapterIds([]);
      setSelectedDocIds([]);
      setIsSelectMode(false);
      setIsBatchDeleteModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast("Erreur lors de la suppression groupée", "error");
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !courseId) return;
    try {
      await createChapter({
        course_id: courseId,
        title: newChapterTitle.trim(),
        parent_id: parentChapterId,
        order_index: chapters.length + 1
      });
      setNewChapterTitle('');
      setIsAddingChapter(false);
      setParentChapterId(null);
      toast("Chapitre ou sous-chapitre ajouté", "success");
      loadData();
    } catch (err) {
      toast("Erreur lors de la création", "error");
    }
  };

  const handleUpdateChapter = async (chapterId: string) => {
    if (!editingTitle.trim()) return;
    try {
      const { error } = await supabase.from('chapters').update({ title: editingTitle.trim() }).eq('id', chapterId);
      if (error) throw error;
      setEditingChapterId(null);
      toast("Chapitre mis à jour", "success");
      loadData();
    } catch (err) {
      toast("Erreur lors de la modification", "error");
    }
  };

  const confirmDeleteChapter = async () => {
    if (!chapterToDelete) return;
    try {
      const { error } = await supabase.from('chapters').delete().eq('id', chapterToDelete);
      if (error) throw error;
      setChapterToDelete(null);
      toast("Chapitre supprimé", "success");
      loadData();
    } catch (err) {
      toast("Erreur lors de la suppression", "error");
    }
  };

  const handleBulkImport = async () => {
    if (!bulkSyllabusText.trim() || !courseId) return;
    try {
      await parseAndCreateChaptersFromSyllabus(courseId, bulkSyllabusText);
      setBulkSyllabusText('');
      setShowBulkModal(false);
      toast("Table des matières hiérarchique importée !", "success");
      loadData();
    } catch (err) {
      toast("Erreur lors de l'importation", "error");
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete.id, docToDelete.path);
      setDocToDelete(null);
      toast("Document supprimé", "success");
      loadData();
    } catch (err) {
      toast("Impossible de supprimer le document", "error");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.event_date || !courseId) return;
    try {
      await createEvent({ title: eventForm.title, event_date: eventForm.event_date, category: eventForm.category, course_id: courseId });
      setEventForm({ title: '', event_date: '', category: 'Cours' });
      setIsAddingEvent(false);
      toast("Créneau ajouté au planning", "success");
      loadData();
    } catch (err) {
      toast("Erreur lors de l'ajout du créneau", "error");
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventToDelete);
      if (error) throw error;
      setEventToDelete(null);
      toast("Créneau supprimé", "success");
      loadData();
    } catch (err) {
      toast("Erreur", "error");
    }
  };

  const buildChapterTree = (flatChapters: any[]) => {
    const map = new Map();
    const roots: any[] = [];
    flatChapters.forEach(ch => map.set(ch.id, { ...ch, children: [] }));
    flatChapters.forEach(ch => {
      if (ch.parent_id && map.has(ch.parent_id)) {
        map.get(ch.parent_id).children.push(map.get(ch.id));
      } else {
        roots.push(map.get(ch.id));
      }
    });
    return roots;
  };

  if (loading) return <div className="text-center p-12 text-text-muted font-mono animate-pulse">Chargement...</div>;
  if (!course) return <div className="text-center p-12 text-text-muted">Cours introuvable</div>;

  const dueCardsCount = flashcards.filter(f => new Date(f.due_at) <= new Date()).length;
  const chapterTree = buildChapterTree(chapters);
  const totalSelectedCount = selectedChapterIds.length + selectedDocIds.length;

  const renderChapterItem = (chapter: any, depth = 0) => {
    const chapterDocs = documents.filter(d => d.chapter_id === chapter.id);
    const hasCards = flashcards.some(f => f.chapter_id === chapter.id);
    const isEditing = editingChapterId === chapter.id;
    const isOpen = openChapters[chapter.id] ?? true;
    const isSelected = selectedChapterIds.includes(chapter.id);
    const indentClass = depth === 1 ? 'ml-6 border-l-2 border-accent/30 pl-2' : depth >= 2 ? 'ml-12 border-l-2 border-secondary/30 pl-2' : '';

    return (
      <div key={chapter.id} className={`flex flex-col gap-2 ${indentClass}`}>
        <div className={`bg-surface border rounded-2xl overflow-hidden shadow-sm group transition-all ${isSelected ? 'border-accent bg-accent/5' : 'border-border'}`}>
          <div 
            onClick={() => {
              if (isSelectMode) {
                toggleSelectChapter(chapter.id);
              } else if (!isEditing) {
                toggleChapter(chapter.id);
              }
            }}
            className="p-3.5 flex items-center justify-between bg-surface hover:bg-surface-elevated transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
              {/* Checkbox en mode sélection */}
              {isSelectMode && (
                <div onClick={(e) => { e.stopPropagation(); toggleSelectChapter(chapter.id); }} className="text-accent cursor-pointer shrink-0">
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-text-muted" />}
                </div>
              )}
              <div className="text-text-muted shrink-0">
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              {depth > 0 && <CornerDownRight size={14} className="text-accent shrink-0" />}
              <h3 className="font-semibold text-sm text-text truncate">{chapter.title}</h3>
            </div>

            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {hasCards && <Badge variant="info" className="hidden sm:flex text-[9px] bg-info/10 border-transparent text-info"><BrainCircuit size={10}/> Cartes</Badge>}
              <span className="text-xs text-text-muted font-medium bg-background px-2 py-0.5 rounded-md">
                {chapterDocs.length} doc{chapterDocs.length !== 1 && 's'}
              </span>
              {!isSelectMode && (
                <div className="flex items-center gap-1 border-l border-border pl-2 ml-1">
                  <button onClick={() => { setParentChapterId(chapter.id); setIsAddingChapter(true); }} className="p-1 text-text-muted hover:text-accent transition-colors rounded cursor-pointer" title="Ajouter un sous-chapitre"><Plus size={14} /></button>
                  <button onClick={() => { setEditingChapterId(chapter.id); setEditingTitle(chapter.title); }} className="p-1 text-text-muted hover:text-accent transition-colors rounded cursor-pointer" title="Modifier"><Edit3 size={14} /></button>
                  <button onClick={() => setChapterToDelete(chapter.id)} className="p-1 text-text-muted hover:text-danger transition-colors rounded cursor-pointer" title="Supprimer"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="p-3 bg-surface-elevated border-t border-border flex gap-2" onClick={(e) => e.stopPropagation()}>
              <input type="text" autoFocus value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-1 text-sm text-text w-full focus:border-accent" />
              <button onClick={() => handleUpdateChapter(chapter.id)} className="px-3 bg-success text-white rounded-lg text-xs font-bold cursor-pointer">OK</button>
              <button onClick={() => setEditingChapterId(null)} className="px-3 bg-surface border border-border rounded-lg text-xs cursor-pointer">Annuler</button>
            </div>
          )}

          {isOpen && chapterDocs.length > 0 && (
            <div className="border-t border-border/50 bg-background/50 flex flex-col divide-y divide-border/50">
              {chapterDocs.map(doc => {
                const isPdf = doc.mime_type === 'application/pdf' || doc.original_name.endsWith('.pdf');
                const isDocSelected = selectedDocIds.includes(doc.id);
                return (
                  <div 
                    key={doc.id} 
                    onClick={() => {
                      if (isSelectMode) toggleSelectDoc(doc.id);
                      else navigate(`/viewer/${doc.id}`);
                    }} 
                    className={`p-3 pl-12 flex items-center justify-between cursor-pointer transition-colors ${isDocSelected ? 'bg-accent/10' : 'hover:bg-surface'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isSelectMode && (
                        <div onClick={(e) => { e.stopPropagation(); toggleSelectDoc(doc.id); }} className="text-accent cursor-pointer shrink-0">
                          {isDocSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-text-muted" />}
                        </div>
                      )}
                      <div className={`p-1.5 rounded-lg shrink-0 ${isPdf ? 'bg-danger/10 text-danger' : 'bg-info/10 text-info'}`}>
                        <FileText size={14} />
                      </div>
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-medium text-text truncate hover:text-accent transition-colors">{doc.original_name}</p>
                      </div>
                    </div>
                    {!isSelectMode && (
                      <button onClick={(e) => { e.stopPropagation(); setDocToDelete({ id: doc.id, path: doc.bucket_path }); }} className="p-1.5 text-text-muted hover:text-danger rounded-lg transition-colors cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {chapter.children && chapter.children.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            {chapter.children.map((child: any) => renderChapterItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 pt-2 pb-24 animate-in fade-in duration-300 relative">
      <header className="flex flex-col gap-6 text-text border-b border-border pb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/courses')} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 cursor-pointer">
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Plan d'études</span>
          </button>
          <button onClick={() => navigate(`/edit/course/${course.id}`)} className="flex items-center gap-1.5 bg-surface border border-border px-3 py-2 rounded-xl text-xs font-medium text-text hover:border-accent transition-colors cursor-pointer">
            <Edit3 size={14} /> Modifier
          </button>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-secondary border-secondary/30 font-mono">{course.course_code}</Badge>
            <Badge variant={course.status === 'Validé' ? 'success' : 'default'} className="font-mono">{course.status}</Badge>
            <span className="text-xs font-bold bg-surface-elevated px-2 py-1 rounded-md">{course.ects} ECTS</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3 leading-tight">{course.title}</h1>
          <p className="text-sm text-text-muted flex items-center gap-2">
            <Scale size={16} className="text-accent" />
            {course.teacher_name ? `Dispensé par ${course.teacher_name}` : 'Matière générale'} • {course.semester}
          </p>
        </div>
      </header>

      {/* Raccourcis rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card variant="minimal" onClick={() => navigate('/add/document')} className="cursor-pointer bg-surface p-4 flex items-center gap-3 hover:border-accent/50 transition-colors border">
          <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted"><FileText size={18} /></div>
          <span className="text-xs font-bold leading-tight">Ajouter<br/>Document</span>
        </Card>
        <Card variant="minimal" onClick={() => navigate('/notes')} className="cursor-pointer bg-surface p-4 flex items-center gap-3 hover:border-accent/50 transition-colors border">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><FileEdit size={18} /></div>
          <span className="text-xs font-bold leading-tight">Nouvelle<br/>Note</span>
        </Card>
        <Card variant="minimal" onClick={() => navigate('/add/flashcards/batch')} className="cursor-pointer bg-surface p-4 flex items-center gap-3 hover:border-accent/50 transition-colors border">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center text-info"><BrainCircuit size={18} /></div>
          <span className="text-xs font-bold leading-tight">Créer<br/>Flashcards</span>
        </Card>
        <Card variant="minimal" onClick={() => navigate('/add/grade')} className="cursor-pointer bg-surface p-4 flex items-center gap-3 hover:border-accent/50 transition-colors border">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning"><Award size={18} /></div>
          <span className="text-xs font-bold leading-tight">Ajouter<br/>Note / Examen</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE (Chapitres hiérarchiques avec sélection multiple) */}
        <section className="lg:col-span-2 flex flex-col gap-4 text-text">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <LayoutGrid size={16} /> Structure hiérarchique ({chapters.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Bouton de bascule du mode sélection */}
              <button 
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  if (isSelectMode) { setSelectedChapterIds([]); setSelectedDocIds([]); }
                }} 
                className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${isSelectMode ? 'bg-accent text-background border-accent font-bold' : 'bg-surface border-border text-text'}`}
              >
                <CheckSquare size={14} /> {isSelectMode ? 'Mode sélection actif' : 'Sélectionner'}
              </button>
              <button onClick={() => setShowBulkModal(true)} className="text-xs text-text font-semibold flex items-center gap-1 hover:border-accent/50 transition-colors cursor-pointer bg-surface px-3 py-1.5 rounded-lg border border-border">
                <ClipboardPaste size={14} className="text-accent" /> Table des matières
              </button>
              <button onClick={() => { setParentChapterId(null); setIsAddingChapter(true); }} className="text-xs text-accent font-bold flex items-center gap-1 hover:underline cursor-pointer bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20">
                <Plus size={14} /> Chapitre
              </button>
            </div>
          </div>

          {/* Barre d'outils flottante de sélection multiple */}
          {isSelectMode && (
            <div className="bg-surface-elevated border border-accent/40 px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <button onClick={handleSelectAll} className="text-xs font-bold text-accent hover:underline cursor-pointer">
                  {totalSelectedCount === chapters.length + documents.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <span className="text-xs text-text-muted">|</span>
                <span className="text-xs font-semibold text-text">{totalSelectedCount} élément(s) sélectionné(s)</span>
              </div>
              <button 
                disabled={totalSelectedCount === 0}
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className="bg-danger/10 text-danger border border-danger/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-danger/20 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Trash2 size={14} /> Supprimer la sélection
              </button>
            </div>
          )}

          {/* Formulaire d'ajout */}
          {isAddingChapter && (
            <form onSubmit={handleCreateChapter} className="bg-surface border border-accent/40 p-4 rounded-2xl flex flex-col gap-3 animate-in fade-in duration-200">
              <span className="text-xs font-bold text-accent">
                {parentChapterId ? "Ajouter un sous-chapitre" : "Ajouter un chapitre principal"}
              </span>
              <div className="flex gap-2">
                <input 
                  type="text"
                  autoFocus
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Intitulé (ex: 1.1 Notion de consentement)"
                  className="flex-1 bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm focus:border-accent"
                />
                <button type="submit" className="bg-accent text-background px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Créer</button>
                <button type="button" onClick={() => { setIsAddingChapter(false); setParentChapterId(null); }} className="p-2 text-text-muted hover:text-text"><X size={18}/></button>
              </div>
            </form>
          )}

          {chapters.length === 0 && !isAddingChapter ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-muted text-sm">
              Aucun chapitre. Collez votre table des matières ou créez un chapitre principal.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {chapterTree.map(rootChapter => renderChapterItem(rootChapter, 0))}
            </div>
          )}
        </section>

        {/* COLONNE DROITE (Planning, Mémoire & Notes) */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <Calendar size={16} /> Planning & Créneaux
              </h2>
              <button onClick={() => setIsAddingEvent(true)} className="text-xs text-accent font-bold flex items-center gap-1 hover:underline cursor-pointer bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">
                <Plus size={12} /> Créneau
              </button>
            </div>

            {isAddingEvent && (
              <form onSubmit={handleCreateEvent} className="bg-surface border border-accent/40 p-3 rounded-2xl flex flex-col gap-2.5">
                <input type="text" required value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Titre (ex: Séminaire)" className="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="datetime-local" required value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} className="bg-surface-elevated border border-border rounded-xl px-2 py-2 text-xs" />
                  <select value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })} className="bg-surface-elevated border border-border rounded-xl px-2 py-2 text-xs">
                    <option value="Cours">Cours</option>
                    <option value="Examen">Examen</option>
                    <option value="Séminaire">Séminaire</option>
                    <option value="Rendu">Rendu</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-1">
                  <button type="submit" className="flex-1 bg-accent text-background py-1.5 rounded-xl text-xs font-bold">Enregistrer</button>
                  <button type="button" onClick={() => setIsAddingEvent(false)} className="px-3 bg-surface border border-border text-text-muted py-1.5 rounded-xl text-xs">Annuler</button>
                </div>
              </form>
            )}

            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2.5">
              {courseEvents.length === 0 ? (
                <p className="text-xs text-text-muted italic text-center py-2">Aucun créneau programmé.</p>
              ) : (
                courseEvents.map(evt => (
                  <div key={evt.id} className="flex items-center justify-between bg-surface-elevated p-2.5 rounded-xl border border-border/50 text-xs">
                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                      <span className="font-semibold text-text truncate">{evt.title}</span>
                      <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                        <Clock size={10} /> {new Date(evt.event_date).toLocaleString('fr-CH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button onClick={() => setEventToDelete(evt.id)} className="p-1.5 text-text-muted hover:text-danger rounded-lg"><Trash2 size={14} /></button>
                  </div>
                ))
              )}
            </div>
          </div>

          <Card onClick={() => navigate(`/study`)} className="bg-surface border-border p-5 cursor-pointer hover:border-info/50 group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-info/10 text-info rounded-xl group-hover:scale-110 transition-transform"><BrainCircuit size={20} /></div>
              <ChevronRight size={18} className="text-text-muted group-hover:text-info" />
            </div>
            <h3 className="font-serif font-bold text-xl mb-1">Répétition espacée</h3>
            <p className="text-sm text-text-muted">À réviser : <span className="font-bold text-info">{dueCardsCount}</span></p>
          </Card>
        </aside>
      </div>

      {/* Modale d'import en masse */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-surface-elevated border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-text">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-serif text-xl font-bold">Importer la table des matières hiérarchique</h3>
              <button onClick={() => setShowBulkModal(false)} className="p-1.5 hover:bg-surface rounded-xl text-text-muted"><X size={20} /></button>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Collez votre table des matières. Le parseur détecte automatiquement les niveaux (Chapitres I, II, 1.1, 1.1.1) grâce à l'indentation et la numérotation.
            </p>
            <textarea autoFocus value={bulkSyllabusText} onChange={(e) => setBulkSyllabusText(e.target.value)} placeholder="I. Introduction&#10;  1. Notion de base&#10;    1.1 Sous-point..." className="w-full h-48 bg-surface border border-border rounded-xl p-4 text-sm font-serif resize-none" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 bg-surface border border-border py-3 rounded-xl text-sm">Annuler</button>
              <button onClick={handleBulkImport} className="flex-1 bg-accent text-background py-3 rounded-xl text-sm font-bold glow-gold">Lancer l'import intelligent</button>
            </div>
          </div>
        </div>
      )}

      {/* Modales de suppression unitaire */}
      <ConfirmModal isOpen={!!docToDelete} title="Supprimer le document ?" message="Ce document sera définitivement effacé." confirmText="Supprimer" cancelText="Annuler" isDanger={true} onConfirm={handleDeleteDocument} onClose={() => setDocToDelete(null)} />
      <ConfirmModal isOpen={!!chapterToDelete} title="Supprimer le chapitre ?" message="Attention, les sous-chapitres associés seront également supprimés." confirmText="Supprimer" cancelText="Annuler" isDanger={true} onConfirm={confirmDeleteChapter} onClose={() => setChapterToDelete(null)} />
      <ConfirmModal isOpen={!!eventToDelete} title="Supprimer le créneau ?" message="Supprimer cet événement du calendrier ?" confirmText="Supprimer" cancelText="Annuler" isDanger={true} onConfirm={confirmDeleteEvent} onClose={() => setEventToDelete(null)} />

      {/* Modale de confirmation pour la suppression en masse */}
      <ConfirmModal 
        isOpen={isBatchDeleteModalOpen} 
        title="Supprimer la sélection ?" 
        message={`Voulez-vous vraiment supprimer les ${totalSelectedCount} éléments sélectionnés (chapitres et/ou documents) ?`} 
        confirmText="Tout supprimer" 
        cancelText="Annuler" 
        isDanger={true} 
        onConfirm={handleBatchDelete} 
        onClose={() => setIsBatchDeleteModalOpen(false)} 
      />
    </div>
  );
}

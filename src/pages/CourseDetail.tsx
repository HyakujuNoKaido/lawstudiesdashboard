import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Edit3, Trash2, BrainCircuit, FileEdit, Award, LayoutGrid, Scale, Plus, X, Check, ClipboardPaste } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { fetchCourseById, fetchCourseChapters, fetchCourseDocuments, fetchCourseGrades, fetchNotes, fetchFlashcards, deleteDocument, createChapter, parseAndCreateChaptersFromSyllabus } from '../services/supabaseService';
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
  const [loading, setLoading] = useState(true);
  const [docToDelete, setDocToDelete] = useState<{id: string, path: string} | null>(null);

  // États pour la gestion des chapitres
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  
  // État pour l'édition d'un chapitre
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // État pour la modale de suppression de chapitre
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);

  // État pour l'import rapide par copier-coller de la table des matières
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSyllabusText, setBulkSyllabusText] = useState('');

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  async function loadData() {
    setLoading(true);
    try {
      const [courseData, chaptersData, docsData, gradesData, notesData, flashcardsData] = await Promise.all([
        fetchCourseById(courseId!),
        fetchCourseChapters(courseId!),
        fetchCourseDocuments(courseId!),
        fetchCourseGrades(courseId!),
        fetchNotes(),
        fetchFlashcards(courseId!)
      ]);
      setCourse(courseData);
      setChapters(chaptersData);
      setDocuments(docsData);
      setGrades(gradesData);
      setNotes(notesData.filter((n: any) => n.course_id === courseId));
      setFlashcards(flashcardsData);
    } catch (err) {
      console.error("Erreur chargement:", err);
      toast("Erreur de chargement du cours", "error");
    } finally {
      setLoading(false);
    }
  }

  // Création d'un chapitre unitaire
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !courseId) return;
    try {
      await createChapter({
        course_id: courseId,
        title: newChapterTitle.trim(),
        order_index: chapters.length + 1
      });
      setNewChapterTitle('');
      setIsAddingChapter(false);
      toast("Chapitre ajouté", "success");
      loadData();
    } catch (err) {
      toast("Erreur lors de la création du chapitre", "error");
    }
  };

  // Modification d'un chapitre
  const handleUpdateChapter = async (chapterId: string) => {
    if (!editingTitle.trim()) return;
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ title: editingTitle.trim() })
        .eq('id', chapterId);
      if (error) throw error;
      setEditingChapterId(null);
      toast("Chapitre mis à jour", "success");
      loadData();
    } catch (err) {
      toast("Erreur lors de la modification", "error");
    }
  };

  // Suppression d'un chapitre
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

  // Import en masse par copier-coller de la table des matières
  const handleBulkImport = async () => {
    if (!bulkSyllabusText.trim() || !courseId) return;
    try {
      await parseAndCreateChaptersFromSyllabus(courseId, bulkSyllabusText);
      setBulkSyllabusText('');
      setShowBulkModal(false);
      toast("Table des matières importée avec succès !", "success");
      loadData();
    } catch (err) {
      toast("Erreur lors de l'importation en masse", "error");
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

  if (loading) return <div className="text-center p-12 text-text-muted font-mono animate-pulse">Chargement du plan d'études...</div>;
  if (!course) return <div className="text-center p-12 text-text-muted">Cours introuvable</div>;

  const dueCardsCount = flashcards.filter(f => new Date(f.due_at) <= new Date()).length;

  return (
    <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300">
      {/* HEADER ÉDITORIAL */}
      <header className="flex flex-col gap-6 text-text border-b border-border pb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/courses')} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 cursor-pointer">
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Plan d'études</span>
          </button>
          <button 
            onClick={() => navigate(`/edit/course/${course.id}`)}
            className="flex items-center gap-1.5 bg-surface border border-border px-3 py-2 rounded-xl text-xs font-medium text-text hover:border-accent transition-colors cursor-pointer"
          >
            <Edit3 size={14} />
            <span className="hidden sm:inline">Modifier</span>
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

      {/* TOOLBAR D'ACTIONS RAPIDES */}
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
        {/* COLONNE GAUCHE (Documents & Chapitres) */}
        <section className="lg:col-span-2 flex flex-col gap-4 text-text">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <LayoutGrid size={16} /> Contenu du cours & Chapitres
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowBulkModal(true)}
                className="text-xs text-text font-semibold flex items-center gap-1 hover:border-accent/50 transition-colors cursor-pointer bg-surface px-3 py-1.5 rounded-lg border border-border"
              >
                <ClipboardPaste size={14} className="text-accent" /> Coller la table des matières
              </button>
              <button 
                onClick={() => setIsAddingChapter(true)}
                className="text-xs text-accent font-bold flex items-center gap-1 hover:underline cursor-pointer bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20"
              >
                <Plus size={14} /> Chapitre
              </button>
            </div>
          </div>

          {/* Formulaire d'ajout rapide de chapitre */}
          {isAddingChapter && (
            <form onSubmit={handleCreateChapter} className="bg-surface border border-accent/40 p-4 rounded-2xl flex gap-2 animate-in fade-in duration-200">
              <input 
                type="text"
                autoFocus
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Intitulé du chapitre (ex: Chapitre 1 - La formation du contrat)"
                className="flex-1 bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm focus:border-accent"
              />
              <button type="submit" className="bg-accent text-background px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
                Créer
              </button>
              <button type="button" onClick={() => setIsAddingChapter(false)} className="p-2 text-text-muted hover:text-text">
                <X size={18} />
              </button>
            </form>
          )}

          {chapters.length === 0 && documents.length === 0 && !isAddingChapter ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-muted text-sm flex flex-col items-center gap-2">
              <p>Ce cours est vide. Ajoutez des chapitres ou collez votre table des matières.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {chapters.map((chapter) => {
                const chapterDocs = documents.filter(d => d.chapter_id === chapter.id);
                const hasCards = flashcards.some(f => f.chapter_id === chapter.id);
                const isEditing = editingChapterId === chapter.id;

                return (
                  <div key={chapter.id} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm group">
                    <div className="p-4 flex items-center justify-between bg-surface hover:bg-surface-elevated transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-background border border-border text-text-muted flex items-center justify-center font-bold text-xs shrink-0">
                          {chapter.order_index}
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input 
                              type="text"
                              autoFocus
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="bg-background border border-border rounded-lg px-2.5 py-1 text-sm text-text w-full focus:border-accent"
                            />
                            <button onClick={() => handleUpdateChapter(chapter.id)} className="p-1.5 text-success hover:bg-success/10 rounded"><Check size={16}/></button>
                            <button onClick={() => setEditingChapterId(null)} className="p-1.5 text-text-muted hover:bg-surface rounded"><X size={16}/></button>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-sm text-text truncate">{chapter.title}</h3>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasCards && <Badge variant="info" className="hidden sm:flex text-[9px] bg-info/10 border-transparent text-info"><BrainCircuit size={10}/> Cartes</Badge>}
                        <span className="text-xs text-text-muted font-medium bg-background px-2 py-1 rounded-md hidden sm:inline">
                          {chapterDocs.length} doc{chapterDocs.length !== 1 && 's'}
                        </span>
                        {!isEditing && (
                          <div className="flex items-center gap-1 border-l border-border pl-2 ml-1">
                            <button 
                              onClick={() => { setEditingChapterId(chapter.id); setEditingTitle(chapter.title); }}
                              className="p-1.5 text-text-muted hover:text-accent transition-colors rounded"
                              title="Modifier le chapitre"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button 
                              onClick={() => setChapterToDelete(chapter.id)}
                              className="p-1.5 text-text-muted hover:text-danger transition-colors rounded"
                              title="Supprimer le chapitre"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {chapterDocs.length > 0 && (
                      <div className="border-t border-border/50 bg-background/50 flex flex-col divide-y divide-border/50">
                        {chapterDocs.map(doc => {
                          const isPdf = doc.mime_type === 'application/pdf' || doc.original_name.endsWith('.pdf');
                          return (
                            <div key={doc.id} className="p-3 flex items-center justify-between cursor-pointer hover:bg-surface transition-colors" onClick={() => navigate(`/viewer/${doc.id}`)}>
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`p-2 rounded-lg shrink-0 ${isPdf ? 'bg-danger/10 text-danger' : 'bg-info/10 text-info'}`}>
                                  <FileText size={16} />
                                </div>
                                <div className="min-w-0 pr-2">
                                  <p className="text-sm font-medium text-text truncate hover:text-accent transition-colors">{doc.original_name}</p>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-text-muted">
                                    <span className="uppercase">{doc.document_type}</span>
                                    {doc.atf_ref && <span className="text-warning bg-warning/10 px-1 rounded">{doc.atf_ref}</span>}
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDocToDelete({ id: doc.id, path: doc.bucket_path }); }}
                                className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COLONNE DROITE (Widgets Mémoire & Notes) */}
        <aside className="lg:col-span-1 flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
            <BrainCircuit size={16} /> Travail personnel
          </h2>
          <Card onClick={() => navigate(`/study`)} className="bg-surface border-border p-5 cursor-pointer hover:border-info/50 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-info/10 text-info rounded-xl group-hover:scale-110 transition-transform"><BrainCircuit size={20} /></div>
              <ChevronRight size={18} className="text-text-muted group-hover:text-info transition-colors" />
            </div>
            <h3 className="font-serif font-bold text-xl mb-1">Répétition espacée</h3>
            <div className="flex flex-col gap-1 mt-3">
              <p className="text-sm text-text-muted flex justify-between">Total du cours: <span className="font-bold text-text">{flashcards.length}</span></p>
              <p className="text-sm text-text-muted flex justify-between">À réviser: <span className="font-bold text-info">{dueCardsCount}</span></p>
            </div>
          </Card>
          <Card className="bg-surface border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-accent/10 text-accent rounded-xl"><FileEdit size={20} /></div>
              <h3 className="font-serif font-bold text-xl">Notes de cours</h3>
            </div>
            {notes.length === 0 ? (
              <p className="text-xs text-text-muted italic">Aucune note liée à ce cours.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {notes.map(n => (
                  <div key={n.id} onClick={() => navigate(`/editor/${n.id}`)} className="text-sm font-medium hover:text-accent cursor-pointer truncate flex items-center gap-2 p-2 rounded-lg hover:bg-surface-elevated transition-colors border border-transparent hover:border-border">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></div>
                    <span className="truncate">{n.title}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* Modale d'import en masse (Table des matières) */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-surface-elevated border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-text">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-serif text-xl font-bold">Coller la table des matières</h3>
              <button onClick={() => setShowBulkModal(false)} className="p-1.5 hover:bg-surface rounded-xl text-text-muted"><X size={20} /></button>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Copiez-collez le plan de votre cours ou votre table des matières (PDF, Word, syllabus). L'intelligence de l'application détectera automatiquement les chapitres par ligne.
            </p>
            <textarea
              autoFocus
              value={bulkSyllabusText}
              onChange={(e) => setBulkSyllabusText(e.target.value)}
              placeholder="Chapitre 1 : Introduction au droit des obligations&#10;Chapitre 2 : La conclusion du contrat&#10;Chapitre 3 : Les vices du consentement..."
              className="w-full h-48 bg-surface border border-border rounded-xl p-4 text-sm focus:border-accent resize-none font-serif"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 bg-surface border border-border py-3 rounded-xl text-sm font-medium hover:bg-surface/80">Annuler</button>
              <button onClick={handleBulkImport} className="flex-1 bg-accent text-background py-3 rounded-xl text-sm font-bold glow-gold hover:bg-accent-strong">Importer les chapitres</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression de document */}
      <ConfirmModal 
        isOpen={!!docToDelete}
        title="Supprimer le document ?"
        message="Ce document sera définitivement effacé de vos ressources."
        confirmText="Supprimer"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={handleDeleteDocument}
        onClose={() => setDocToDelete(null)}
      />

      {/* Modale de confirmation de suppression de chapitre */}
      <ConfirmModal 
        isOpen={!!chapterToDelete}
        title="Supprimer le chapitre ?"
        message="Voulez-vous vraiment supprimer ce chapitre ? Les documents associés ne seront pas supprimés mais perdront leur rattachement."
        confirmText="Supprimer"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={confirmDeleteChapter}
        onClose={() => setChapterToDelete(null)}
      />
    </div>
  );
}

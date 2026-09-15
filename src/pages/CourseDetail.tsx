import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, ChevronDown, Edit3, Trash2, BrainCircuit, FileEdit, Award, LayoutGrid, Scale } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { fetchCourseById, fetchCourseChapters, fetchCourseDocuments, fetchCourseGrades, fetchNotes, fetchFlashcards, deleteDocument } from '../services/supabaseService';
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
            <LayoutGrid size={16} /> Contenu du cours
          </h2>
          
          {chapters.length === 0 && documents.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-muted text-sm">
              Ce cours est vide. Commencez par ajouter votre plan de cours.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {chapters.map((chapter) => {
                const chapterDocs = documents.filter(d => d.chapter_id === chapter.id);
                // On détermine si le chapitre a des flashcards pour afficher un badge de "richesse"
                const hasCards = flashcards.some(f => f.chapter_id === chapter.id);
                
                return (
                  <div key={chapter.id} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm group">
                    <div className="p-4 flex items-center justify-between cursor-pointer bg-surface hover:bg-surface-elevated transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-background border border-border text-text-muted flex items-center justify-center font-bold text-xs shrink-0 group-hover:border-accent group-hover:text-accent transition-colors">
                          {chapter.order_index}
                        </div>
                        <h3 className="font-semibold text-sm text-text leading-snug">{chapter.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasCards && <Badge variant="info" className="hidden sm:flex text-[9px] bg-info/10 border-transparent text-info"><BrainCircuit size={10}/> Cartes</Badge>}
                        <span className="text-xs text-text-muted font-medium bg-background px-2 py-1 rounded-md">
                          {chapterDocs.length} doc{chapterDocs.length !== 1 && 's'}
                        </span>
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
          
          {/* Widget Flashcards */}
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

          {/* Widget Notes */}
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

      {/* Modale de suppression */}
      <ConfirmModal 
        isOpen={!!docToDelete}
        title="Supprimer le document ?"
        message="Ce document sera définitivement effacé de vos ressources. S'il a servi à créer des notes ou flashcards, celles-ci seront conservées."
        confirmText="Supprimer"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={handleDeleteDocument}
        onClose={() => setDocToDelete(null)}
      />
    </div>
  );
}

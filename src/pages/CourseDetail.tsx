import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, ChevronDown, CheckCircle2, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { fetchCourseById, fetchCourseChapters, fetchCourseDocuments, deleteDocument } from '../services/supabaseService';

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // État pour la suppression d'un document
  const [docToDelete, setDocToDelete] = useState<{id: string, path: string} | null>(null);

  useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId]);

  async function loadData() {
    setLoading(true);
    try {
      const [courseData, chaptersData, docsData] = await Promise.all([
        fetchCourseById(courseId!),
        fetchCourseChapters(courseId!),
        fetchCourseDocuments(courseId!)
      ]);
      setCourse(courseData);
      setChapters(chaptersData);
      setDocuments(docsData);
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete.id, docToDelete.path);
      setDocToDelete(null);
      loadData(); // Recharger les docs
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert("Impossible de supprimer ce document.");
    }
  };

  if (loading) return <div className="text-center p-8 text-text-muted">Chargement...</div>;
  if (!course) return <div className="text-center p-8 text-text-muted">Cours introuvable</div>;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <header className="flex flex-col gap-4 text-text">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 cursor-pointer">
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Retour</span>
          </button>
          
          {/* NOUVEAU: Bouton d'édition */}
          <button 
            onClick={() => navigate(`/edit/course/${course.id}`)}
            className="flex items-center gap-1.5 bg-surface border border-border px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer"
          >
            <Edit3 size={14} />
            <span>Modifier</span>
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-accent border-accent/30">{course.course_code}</Badge>
            <Badge variant={course.status === 'Validé' ? 'success' : 'default'}>{course.status}</Badge>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 leading-tight">{course.title}</h1>
          <div className="flex items-center gap-4 text-xs font-medium text-text-muted">
            <span>{course.ects} Crédits ECTS</span>
            <span>•</span>
            <span>{course.semester}</span>
            {course.teacher_name && (
              <>
                <span>•</span>
                <span>{course.teacher_name}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CHAPITRES ET DOCUMENTS */}
      <section className="flex flex-col gap-4 mt-4 text-text">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="font-serif text-xl font-bold">Ressources du cours</h2>
        </div>

        {chapters.length === 0 && documents.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl text-text-muted text-sm">
            Aucun chapitre ou document pour le moment.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chapters.map((chapter) => {
              const chapterDocs = documents.filter(d => d.chapter_id === chapter.id);
              
              return (
                <div key={chapter.id} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-elevated transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                        {chapter.order_index}
                      </div>
                      <h3 className="font-medium text-sm text-text">{chapter.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted font-medium px-2 py-0.5 bg-background rounded-full">
                        {chapterDocs.length} doc{chapterDocs.length !== 1 && 's'}
                      </span>
                      <ChevronDown size={18} className="text-text-muted" />
                    </div>
                  </div>

                  {chapterDocs.length > 0 && (
                    <div className="border-t border-border bg-background/50 p-2 flex flex-col gap-1.5">
                      {chapterDocs.map(doc => (
                        <Card 
                          key={doc.id}
                          className="bg-surface p-3 flex items-center justify-between cursor-pointer hover:border-accent/40 transition-colors group"
                        >
                          {/* Clique sur le reste pour ouvrir le doc */}
                          <div className="flex items-center gap-3 min-w-0 flex-1" onClick={() => navigate(`/viewer/${doc.id}`)}>
                            <div className="text-accent bg-accent/10 p-2 rounded-lg shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0 pr-2">
                              <p className="text-sm font-medium text-text truncate group-hover:text-accent transition-colors">{doc.original_name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
                                <span className="uppercase">{doc.document_type}</span>
                                {doc.atf_ref && (
                                  <>
                                    <span>•</span>
                                    <span className="text-warning font-mono">{doc.atf_ref}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span className="flex items-center gap-1 text-success">
                                  <CheckCircle2 size={10} />
                                  Analysé
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* NOUVEAU: Bouton de suppression du document */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDocToDelete({ id: doc.id, path: doc.bucket_path }); }}
                            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                            title="Supprimer ce document"
                          >
                            <Trash2 size={16} />
                          </button>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modale de suppression de document */}
      <ConfirmModal 
        isOpen={!!docToDelete}
        title="Supprimer le document ?"
        message="Ce document sera définitivement effacé de vos ressources. Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={handleDeleteDocument}
        onClose={() => setDocToDelete(null)}
      />

    </div>
  );
}

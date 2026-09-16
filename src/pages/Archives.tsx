import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, RotateCcw, Trash2, ChevronLeft, BookOpen, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { fetchArchivedResources, archiveResource } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

export function Archives() {
  const navigate = useNavigate();
  const [archivedCourses, setArchivedCourses] = useState<any[]>([]);
  const [archivedDocs, setArchivedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Élément ciblé pour suppression définitive
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'courses' | 'documents'; name: string } | null>(null);

  useEffect(() => {
    loadArchives();
  }, []);

  async function loadArchives() {
    setLoading(true);
    try {
      const data = await fetchArchivedResources();
      setArchivedCourses(data.courses);
      setArchivedDocs(data.documents);
    } catch (err) {
      toast("Erreur lors du chargement des archives", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleRestore = async (table: 'courses' | 'documents', id: string, name: string) => {
    try {
      await archiveResource(table, id, false);
      toast(`"${name}" a été restauré avec succès`, "success");
      loadArchives();
    } catch (err) {
      toast("Échec de la restauration", "error");
    }
  };

  const confirmPermanentDelete = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from(itemToDelete.type).delete().eq('id', itemToDelete.id);
      if (error) throw error;
      toast("Élément supprimé définitivement", "success");
      setItemToDelete(null);
      loadArchives();
    } catch (err) {
      toast("Erreur lors de la suppression définitive", "error");
    }
  };

  const totalArchived = archivedCourses.length + archivedDocs.length;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 animate-in fade-in duration-300 text-text max-w-4xl mx-auto w-full">
      <header className="flex flex-col gap-4 border-b border-border/50 pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Archive className="text-warning" size={30} />
            <span>Archives & Corbeille</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Retrouvez ici vos anciens modules et documents masqués. Vous pouvez les restaurer à tout moment ou les effacer définitivement.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-text-muted font-mono animate-pulse">Chargement des archives...</div>
      ) : totalArchived === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-card text-text-muted gap-3 bg-surface/30">
          <Archive size={40} className="opacity-20" />
          <p className="text-sm font-medium text-text">Votre corbeille est vide.</p>
          <p className="text-xs">Aucun élément archivé pour le moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* COURS ARCHIVÉS */}
          {archivedCourses.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Cours archivés ({archivedCourses.length})</h2>
              <div className="grid grid-cols-1 gap-3">
                {archivedCourses.map(course => (
                  <Card key={course.id} className="p-4 flex items-center justify-between bg-surface border-warning/20">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-warning/10 text-warning shrink-0"><BookOpen size={20} /></div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-text truncate">{course.title}</span>
                        <span className="text-[10px] text-text-muted font-mono">{course.ects} ECTS • {course.semester}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleRestore('courses', course.id, course.title)} className="px-3 py-1.5 bg-surface-elevated hover:bg-success/10 hover:text-success border border-border rounded-btn text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer" title="Restaurer">
                        <RotateCcw size={14} /> Restaurer
                      </button>
                      <button onClick={() => setItemToDelete({ id: course.id, type: 'courses', name: course.title })} className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 border border-border rounded-btn transition-colors cursor-pointer" title="Supprimer définitivement">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* DOCUMENTS ARCHIVÉS */}
          {archivedDocs.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Documents archivés ({archivedDocs.length})</h2>
              <div className="grid grid-cols-1 gap-3">
                {archivedDocs.map(doc => (
                  <Card key={doc.id} className="p-4 flex items-center justify-between bg-surface border-warning/20">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-info/10 text-info shrink-0"><FileText size={20} /></div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-text truncate">{doc.original_name}</span>
                        <span className="text-[10px] text-text-muted font-mono">{doc.document_type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleRestore('documents', doc.id, doc.original_name)} className="px-3 py-1.5 bg-surface-elevated hover:bg-success/10 hover:text-success border border-border rounded-btn text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer" title="Restaurer">
                        <RotateCcw size={14} /> Restaurer
                      </button>
                      <button onClick={() => setItemToDelete({ id: doc.id, type: 'documents', name: doc.original_name })} className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 border border-border rounded-btn transition-colors cursor-pointer" title="Supprimer définitivement">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal 
        isOpen={!!itemToDelete}
        title="Supprimer définitivement ?"
        message={`Voulez-vous effacer définitivement "${itemToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer pour toujours"
        cancelText="Conserver dans les archives"
        isDanger={true}
        onConfirm={confirmPermanentDelete}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
}

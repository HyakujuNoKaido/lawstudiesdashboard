import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Trash2, ChevronRight, Scale } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { fetchCourses, deleteCourse } from '../services/supabaseService';

export function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [semesterFilter, setSemesterFilter] = useState('Tous');
  const [loading, setLoading] = useState(true);

  // État pour la modale de confirmation de suppression
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, [semesterFilter]);

  async function loadCourses() {
    setLoading(true);
    try {
      const data = await fetchCourses(semesterFilter);
      setCourses(data);
    } catch (err) {
      console.error("Erreur chargement cours:", err);
    } finally {
      setLoading(false);
    }
  }

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await deleteCourse(courseToDelete);
      setCourseToDelete(null);
      loadCourses();
    } catch (err) {
      console.error("Erreur suppression cours:", err);
      alert("Échec de la suppression du cours.");
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="font-serif text-3xl font-bold">Mes Cours & Fiches</h1>
          <p className="text-text-muted text-xs">Gestion par semestre et suivi de vos crédits ECTS.</p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="bg-surface border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent appearance-none cursor-pointer"
          >
            <option value="Tous">Tous les semestres</option>
            <option value="Automne 2026">Automne 2026</option>
            <option value="Printemps 2027">Printemps 2027</option>
            <option value="Automne 2027">Automne 2027</option>
          </select>

          <button 
            onClick={() => navigate('/add/course')}
            className="bg-accent text-background px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Nouveau cours</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12 text-text-muted text-sm">Chargement des cours...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl text-text-muted text-sm flex flex-col items-center gap-2">
          <Scale size={32} className="text-text-muted opacity-40" />
          <p>Aucun cours trouvé pour ce semestre.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map(course => (
            <Card 
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="bg-surface border-border p-4 flex items-center justify-between cursor-pointer hover:border-accent/40 transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-surface-elevated text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm text-text truncate group-hover:text-accent transition-colors">{course.title}</p>
                    <Badge variant="outline">{course.course_code || 'DROIT'}</Badge>
                  </div>
                  <p className="text-xs text-text-muted">{course.ects} ECTS • {course.semester || 'Automne 2026'} • <span className="text-accent">{course.status}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setCourseToDelete(course.id); }}
                  className="p-2 text-text-muted hover:text-danger transition-colors rounded-lg hover:bg-surface-elevated cursor-pointer"
                  title="Supprimer le cours et ses données"
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={18} className="text-text-muted group-hover:text-accent transition-colors" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      <ConfirmModal 
        isOpen={!!courseToDelete}
        title="Supprimer le cours ?"
        message="Attention : Cette action est irréversible. Toutes les données associées (flashcards, chapitres, documents, notes, événements du planning) seront définitivement supprimées."
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={confirmDelete}
        onClose={() => setCourseToDelete(null)}
      />

    </div>
  );
}

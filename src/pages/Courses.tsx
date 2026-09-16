import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, ChevronRight, Scale, AlertTriangle, GraduationCap, FileText, LayoutGrid, Calendar, ArrowUpDown, User, Star } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ResourceMenu } from '../components/ui/ResourceMenu';
import { fetchCourses, deleteCourse } from '../services/supabaseService';
import { useApp } from '../context/AppContext';
import { toast } from '../lib/toast';

export function Courses() {
  const navigate = useNavigate();
  const { settings, toggleFavorite } = useApp(); // Utilisation des favoris
  
  const [courses, setCourses] = useState<any[]>([]);
  const [semesterFilter, setSemesterFilter] = useState('Tous');
  const [sortBy, setSortBy] = useState<'name' | 'docs' | 'chapters' | 'ects' | 'created'>('name');
  const [loading, setLoading] = useState(true);
  
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  useEffect(() => { loadCourses(); }, [semesterFilter]);

  async function loadCourses() {
    setLoading(true);
    try {
      const data = await fetchCourses(semesterFilter);
      setCourses(data);
    } catch (err) { toast("Erreur de chargement", "error"); } finally { setLoading(false); }
  }

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await deleteCourse(courseToDelete); setCourseToDelete(null); toast("Cours supprimé avec succès", "success"); loadCourses();
    } catch (err) { toast("Échec de la suppression.", "error"); }
  };

  // Les favoris apparaissent toujours en premier, puis on applique le tri
  const sortedCourses = [...courses].sort((a, b) => {
    const isFavA = settings.favorites.includes(a.id);
    const isFavB = settings.favorites.includes(b.id);
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;

    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'docs') return (b.documents?.length || 0) - (a.documents?.length || 0);
    if (sortBy === 'chapters') return (b.chapters?.length || 0) - (a.chapters?.length || 0);
    if (sortBy === 'ects') return (Number(b.ects) || 0) - (Number(a.ects) || 0);
    if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const currentEcts = courses.reduce((sum, c) => sum + (Number(c.ects) || 0), 0);
  const validatedEcts = courses.filter(c => c.status === 'Validé').reduce((sum, c) => sum + (Number(c.ects) || 0), 0);

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Plan d'études & Modules</h1>
          <p className="text-text-muted text-sm max-w-md">Vue d'ensemble de votre cursus, volumes documentaires et répartition de charge semestrielle.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="bg-surface border border-border rounded-btn py-2.5 px-3 text-sm font-medium focus:outline-none focus:border-accent appearance-none cursor-pointer shadow-sm">
            <option value="Tous">Tous les semestres</option>
            <option value="Automne 2026">Automne 2026</option>
            <option value="Printemps 2027">Printemps 2027</option>
          </select>
          <button onClick={() => navigate('/add/course')} className="bg-accent text-background px-4 py-2.5 rounded-btn text-sm font-bold flex items-center gap-2 glow-gold hover:bg-accent-strong transition-all cursor-pointer shadow-apple-subtle active:scale-95">
            <Plus size={18} /> <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="editorial" className="md:col-span-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0"><GraduationCap size={24} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-0.5">{semesterFilter === 'Tous' ? 'Total Cursus' : `Charge ${semesterFilter}`}</p>
              <div className="flex items-baseline gap-2"><span className="font-serif text-3xl font-bold text-text">{currentEcts}</span><span className="font-mono text-sm text-text-muted">ECTS inscrits</span></div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-0.5">Validés</span>
            <span className="font-mono text-xl font-bold text-success">{validatedEcts}</span>
          </div>
        </Card>
        <Card className="flex flex-col justify-center gap-2 bg-surface shadow-sm">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5"><ArrowUpDown size={13} className="text-accent" /> Trier par</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-surface-elevated border border-border/50 rounded-input py-2 px-3 text-xs font-medium focus:outline-none focus:border-accent appearance-none cursor-pointer w-full">
            <option value="name">Nom alphabétique</option>
            <option value="docs">Volume de documents</option>
            <option value="chapters">Nombre de chapitres</option>
            <option value="ects">Crédits ECTS</option>
          </select>
        </Card>
      </div>

      <section>
        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm font-mono animate-pulse">Chargement...</div>
        ) : sortedCourses.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/60 rounded-card text-text-muted text-sm flex flex-col items-center gap-3 bg-surface/30">
            <Scale size={32} className="text-text-muted opacity-30" />
            <p>Votre plan d'études est vide.</p>
            <button onClick={() => navigate('/import')} className="text-accent text-xs font-bold hover:underline cursor-pointer">Importer depuis un PDF</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sortedCourses.map((course) => {
              const isFavorite = settings.favorites.includes(course.id);
              const docCount = course.documents?.length || 0;
              const chapterCount = course.chapters?.length || 0;
              const uniqueDays = Array.from(new Set(course.course_schedules?.map((s: any) => s.day_of_week) || []));

              return (
                <div key={course.id} onClick={() => navigate(`/courses/${course.id}`)} className={`bg-surface border rounded-card p-4 hover:border-accent/40 hover:bg-surface-interactive transition-all cursor-pointer group shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${isFavorite ? 'border-warning/30' : 'border-border/60'}`}>
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-colors mt-0.5 shadow-inner ${isFavorite ? 'bg-warning/10 border-warning/30 text-warning' : 'bg-surface-elevated border-border/50 text-text group-hover:border-accent/50 group-hover:text-accent'}`}>
                      {isFavorite ? <Star size={20} fill="currentColor" /> : <BookOpen size={20} />}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-base text-text truncate group-hover:text-accent transition-colors">{course.title}</h3>
                        {course.status === 'Validé' && <Badge variant="success" className="px-1.5 py-0 text-[9px]">Validé</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted font-mono">
                        <span className="text-secondary font-bold bg-secondary/10 px-2 py-0.5 rounded-md border border-secondary/20">{course.ects} ECTS</span>
                        <span>•</span><span>{course.semester}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface-elevated px-2.5 py-1 rounded-md border border-border/50" title="Nombre de chapitres">
                      <LayoutGrid size={13} className="text-info" /> <span className="font-bold text-text">{chapterCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface-elevated px-2.5 py-1 rounded-md border border-border/50" title="Nombre de documents">
                      <FileText size={13} className="text-warning" /> <span className="font-bold text-text">{docCount}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border/50">
                      <ResourceMenu 
                        isFavorite={isFavorite}
                        onToggleFavorite={() => { toast(isFavorite ? "Retiré des favoris" : "Ajouté aux favoris", "info"); toggleFavorite(course.id); }}
                        onEdit={() => navigate(`/edit/course/${course.id}`)}
                        onArchive={() => toast("Archivage non disponible", "info")}
                        onDelete={() => setCourseToDelete(course.id)}
                      />
                      <div className="w-8 h-8 rounded-btn bg-surface-elevated flex items-center justify-center text-text-muted group-hover:bg-accent group-hover:text-background transition-colors"><ChevronRight size={16} /></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmModal isOpen={!!courseToDelete} title="Supprimer définitivement le cours ?" message="Cette action effacera également de manière irréversible toutes les flashcards, les notes et les documents liés à ce module." confirmText="Supprimer" cancelText="Annuler" isDanger={true} onConfirm={confirmDelete} onClose={() => setCourseToDelete(null)} />
    </div>
  );
}

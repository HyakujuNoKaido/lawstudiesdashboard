import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { fetchCourses, deleteCourse } from '../services/supabaseService';
import { useApp } from '../context/AppContext';
import { LexiIcons } from '../lib/icons';
import { toast } from '../lib/toast';

export function Courses() {
  const navigate = useNavigate();
  const { settings, courses: contextCourses, refreshData } = useApp();
  
  const [courses, setCourses] = useState<any[]>(contextCourses);
  const [semesterFilter, setSemesterFilter] = useState('Tous');
  const [loading, setLoading] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // Le fameux mode résumé demandé dans l'audit
  const isCompact = settings.listDensity === 'compact';

  useEffect(() => {
    loadCourses();
  }, [semesterFilter]);

  async function loadCourses() {
    setLoading(true);
    try {
      const data = await fetchCourses(semesterFilter);
      setCourses(data);
    } catch (err) {
      toast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await deleteCourse(courseToDelete);
      setCourseToDelete(null);
      toast("Cours retiré du plan d'études", "success");
      loadCourses();
      refreshData(); // Met à jour le contexte global
    } catch (err) {
      toast("Échec de la suppression", "error");
    }
  };

  const currentEcts = courses.reduce((sum, c) => sum + (Number(c.ects) || 0), 0);
  const validatedEcts = courses.filter(c => c.status === 'Validé').reduce((sum, c) => sum + (Number(c.ects) || 0), 0);
  
  const isOverloaded = semesterFilter !== 'Tous' && currentEcts > 35;
  const isUnderloaded = semesterFilter !== 'Tous' && currentEcts > 0 && currentEcts < 15;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Plan d'études</h1>
          <p className="text-text-muted text-sm max-w-md">Gérez vos modules et assurez-vous que votre semestre est équilibré.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <select 
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="bg-surface-elevated border border-border rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:border-accent appearance-none cursor-pointer"
          >
            <option value="Tous">Tous les semestres</option>
            <option value="Automne 2026">Automne 2026</option>
            <option value="Printemps 2027">Printemps 2027</option>
            <option value="Automne 2027">Automne 2027</option>
          </select>
          <button 
            onClick={() => navigate('/add/course')}
            className="bg-accent text-background px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
          >
            <LexiIcons.Add size={18} />
            <span className="hidden sm:inline">Nouveau module</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="editorial" className="md:col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <LexiIcons.Course size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-0.5">
                {semesterFilter === 'Tous' ? 'Total Cursus' : `Charge ${semesterFilter}`}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-text">{currentEcts}</span>
                <span className="font-mono text-sm text-text-muted">ECTS inscrits</span>
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-0.5">Validés</span>
            <span className="font-mono text-xl font-bold text-success">{validatedEcts}</span>
          </div>
        </Card>

        {isOverloaded && (
          <Card className="bg-warning/10 border-warning/30 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-warning mb-1"><LexiIcons.Warning size={16} /><span className="text-xs font-bold uppercase">Surcharge</span></div>
            <p className="text-[11px] text-text-muted leading-relaxed">Plus de 35 ECTS. Assurez-vous d'avoir le temps nécessaire pour la jurisprudence.</p>
          </Card>
        )}
        {isUnderloaded && (
          <Card className="bg-info/10 border-info/30 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-info mb-1"><LexiIcons.Warning size={16} /><span className="text-xs font-bold uppercase">Sous-charge</span></div>
            <p className="text-[11px] text-text-muted leading-relaxed">Moins de 15 ECTS. Un semestre cible 30 crédits. Vérifiez votre plan.</p>
          </Card>
        )}
        {!isOverloaded && !isUnderloaded && semesterFilter !== 'Tous' && currentEcts > 0 && (
           <Card className="bg-success/5 border-success/20 flex flex-col justify-center">
           <div className="flex items-center gap-2 text-success mb-1"><LexiIcons.Success size={16} /><span className="text-xs font-bold uppercase">Équilibre</span></div>
           <p className="text-[11px] text-text-muted leading-relaxed">Charge académique optimale pour ce semestre.</p>
         </Card>
        )}
      </div>

      <section>
        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm font-mono animate-pulse">Chargement du plan d'études...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl text-text-muted text-sm flex flex-col items-center gap-3">
            <LexiIcons.Law size={32} className="text-text-muted opacity-30" />
            <p>Votre plan d'études est vide pour cette sélection.</p>
            <button onClick={() => navigate('/import')} className="text-accent text-xs font-bold hover:underline">Importer depuis un PDF</button>
          </div>
        ) : (
          <div className={`flex flex-col ${isCompact ? 'gap-0 border border-border bg-surface rounded-2xl overflow-hidden' : 'gap-3'}`}>
            {courses.map((course, index) => (
              <div 
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`, { state: { from: '/courses' } })}
                className={`flex items-center justify-between cursor-pointer group transition-colors ${
                  isCompact 
                    ? `p-3 hover:bg-surface-elevated ${index !== courses.length - 1 ? 'border-b border-border/50' : ''}` 
                    : 'bg-surface border border-border rounded-xl p-4 hover:border-accent/40'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`rounded-xl bg-surface-elevated border border-border text-text flex items-center justify-center shrink-0 group-hover:border-accent group-hover:text-accent transition-colors ${isCompact ? 'w-8 h-8' : 'w-10 h-10'}`}>
                    <LexiIcons.Course size={isCompact ? 14 : 18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-text truncate group-hover:text-accent transition-colors">{course.title}</p>
                      {course.status === 'Validé' && <Badge variant="success" className="px-1.5 py-0 text-[9px]">Validé</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                      <span className="text-secondary font-bold">{course.ects} ECTS</span>
                      <span>•</span><span>{course.course_code || 'Général'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setCourseToDelete(course.id); }} className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors rounded-lg">
                    <LexiIcons.Delete size={16} />
                  </button>
                  <LexiIcons.Forward size={18} className="text-text-muted group-hover:text-accent transition-colors ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal 
        isOpen={!!courseToDelete}
        title="Retirer du plan d'études ?"
        message="Cette action effacera également toutes les flashcards, notes, et documents liés à ce module."
        confirmText="Supprimer définitivement"
        cancelText="Conserver"
        isDanger={true}
        onConfirm={confirmDelete}
        onClose={() => setCourseToDelete(null)}
      />
    </div>
  );
}

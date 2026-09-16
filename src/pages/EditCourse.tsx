import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, BookOpen, GraduationCap, Target } from 'lucide-react';
import { fetchCourseById, updateCourse } from '../services/supabaseService';
import { toast } from '../lib/toast';

export function EditCourse() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    course_code: '',
    ects: 6,
    status: 'En cours',
    teacher_name: '',
    semester: 'Automne 2026',
    description: '',
    target_grade: 4.5
  });

  useEffect(() => {
    if (courseId) {
      fetchCourseById(courseId)
        .then(data => {
          setForm({
            title: data.title || '',
            course_code: data.course_code || '',
            ects: data.ects || 6,
            status: data.status || 'En cours',
            teacher_name: data.teacher_name || '',
            semester: data.semester || 'Automne 2026',
            description: data.description || '',
            target_grade: data.target_grade || 4.5
          });
        })
        .catch(err => {
          console.error(err);
          toast("Impossible de charger le cours", "error");
          navigate('/courses');
        })
        .finally(() => setLoading(false));
    }
  }, [courseId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !courseId) return;
    
    setSaving(true);
    try {
      await updateCourse(courseId, form as any);
      toast("Cours mis à jour avec succès", "success");
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error("Erreur mise à jour cours:", err);
      toast("Échec de la mise à jour du cours.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-12 text-text-muted font-mono animate-pulse">Chargement du cours...</div>;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 animate-in fade-in duration-300 max-w-xl mx-auto w-full text-text">
      <header className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Modifier le module</h1>
          <p className="text-text-muted text-xs">Personnalisez les paramètres académiques et les objectifs de cette matière.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Intitulé du cours *</label>
          <input 
            type="text" required value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })} 
            className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent" 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Code du cours</label>
            <input 
              type="text" value={form.course_code} 
              onChange={(e) => setForm({ ...form, course_code: e.target.value })} 
              className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent font-mono" 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Crédits ECTS</label>
            <input 
              type="number" min="1" max="30" value={form.ects} 
              onChange={(e) => setForm({ ...form, ects: Number(e.target.value) })} 
              className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent font-mono" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Semestre</label>
            <select 
              value={form.semester} 
              onChange={(e) => setForm({ ...form, semester: e.target.value })} 
              className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent appearance-none cursor-pointer"
            >
              <option value="Automne 2026">Automne 2026</option>
              <option value="Printemps 2027">Printemps 2027</option>
              <option value="Automne 2027">Automne 2027</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Statut</label>
            <select 
              value={form.status} 
              onChange={(e) => setForm({ ...form, status: e.target.value })} 
              className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent appearance-none cursor-pointer"
            >
              <option value="En cours">En cours</option>
              <option value="Validé">Validé</option>
              <option value="À reprendre">À reprendre</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Enseignant / Professeur</label>
            <input 
              type="text" value={form.teacher_name} 
              onChange={(e) => setForm({ ...form, teacher_name: e.target.value })} 
              placeholder="ex: Prof. Alain Papaux" 
              className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent" 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1">
              <Target size={12} /> Objectif de note
            </label>
            <input 
              type="number" step="0.25" min="4.0" max="6.0" value={form.target_grade} 
              onChange={(e) => setForm({ ...form, target_grade: Number(e.target.value) })} 
              className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent font-mono" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Description / Contexte du module</label>
          <textarea 
            rows={3} value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            placeholder="Objectifs d'apprentissage, modalités d'examen..." 
            className="w-full bg-surface border border-border rounded-input p-3.5 text-sm focus:border-accent resize-none font-serif" 
          />
        </div>

        <button 
          type="submit" disabled={saving} 
          className="mt-4 w-full bg-accent text-background rounded-btn py-4 px-4 flex items-center justify-center gap-2 font-bold glow-gold hover:bg-accent-strong transition-all cursor-pointer disabled:opacity-50 shadow-apple"
        >
          <Save size={18} />
          <span>{saving ? 'Enregistrement...' : 'Mettre à jour le module'}</span>
        </button>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { fetchCourseById, updateCourse } from '../services/supabaseService';

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
    semester: 'Automne 2026'
  });

  useEffect(() => {
    if (courseId) {
      fetchCourseById(courseId)
        .then(data => {
          setForm({
            title: data.title,
            course_code: data.course_code || '',
            ects: data.ects || 6,
            status: data.status || 'En cours',
            teacher_name: data.teacher_name || '',
            semester: data.semester || 'Automne 2026'
          });
        })
        .catch(err => {
          console.error(err);
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
      await updateCourse(courseId, form);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error("Erreur mise à jour cours:", err);
      alert("Échec de la mise à jour du cours.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-8 text-text-muted">Chargement du cours...</div>;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 max-w-xl mx-auto w-full text-text">
      <header className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Modifier le cours</h1>
          <p className="text-text-muted text-xs">Mettez à jour les informations du cours.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Intitulé du cours *</label>
          <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Code du cours</label>
            <input type="text" value={form.course_code} onChange={(e) => setForm({ ...form, course_code: e.target.value })} className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Crédits ECTS</label>
            <input type="number" min="1" max="30" value={form.ects} onChange={(e) => setForm({ ...form, ects: Number(e.target.value) })} className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Semestre</label>
            <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none">
              <option value="Automne 2026">Automne 2026</option>
              <option value="Printemps 2027">Printemps 2027</option>
              <option value="Automne 2027">Automne 2027</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Statut</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none">
              <option value="En cours">En cours</option>
              <option value="Validé">Validé</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Enseignant</label>
          <input type="text" value={form.teacher_name} onChange={(e) => setForm({ ...form, teacher_name: e.target.value })} className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent" />
        </div>

        <button type="submit" disabled={saving} className="mt-2 w-full bg-accent text-background rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold glow-gold hover:bg-accent-strong transition-colors cursor-pointer">
          <Save size={18} />
          <span>{saving ? 'Mise à jour...' : 'Mettre à jour le cours'}</span>
        </button>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, BookOpen, GraduationCap, Target, Scale, Shield, FileText, Bookmark } from 'lucide-react';
import { fetchCourseById, updateCourse } from '../services/supabaseService';
import { toast } from '../lib/toast';

const AVAILABLE_COLORS = [
  { id: 'gold', label: 'Or (Défaut)', class: 'bg-[#D4AF37]' },
  { id: 'blue', label: 'Bleu Académique', class: 'bg-[#3B82F6]' },
  { id: 'emerald', label: 'Vert Juge', class: 'bg-[#10B981]' },
  { id: 'ruby', label: 'Rubis', class: 'bg-[#EF4444]' },
  { id: 'purple', label: 'Améthyste', class: 'bg-[#8B5CF6]' },
];

const AVAILABLE_ICONS = [
  { id: 'Scale', label: 'Balance', icon: Scale },
  { id: 'BookOpen', label: 'Livre', icon: BookOpen },
  { id: 'Shield', label: 'Bouclier', icon: Shield },
  { id: 'FileText', label: 'Document', icon: FileText },
  { id: 'Bookmark', label: 'Marque-page', icon: Bookmark },
];

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
    target_grade: 4.5,
    color: 'gold',
    icon: 'Scale'
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
            target_grade: data.target_grade || 4.5,
            color: data.color || 'gold',
            icon: data.icon || 'Scale'
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
          <p className="text-text-muted text-xs">Personnalisez l'apparence visuelle, les paramètres et les objectifs.</p>
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

        {/* PERSONNALISATION VISUELLE (Point 4) */}
        <div className="grid grid-cols-2 gap-4 bg-surface p-4 rounded-card border border-border/60">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Couleur d'accent</label>
            <div className="flex items-center gap-2">
              {AVAILABLE_COLORS.map(c => (
                <button
                  key={c.id} type="button" title={c.label}
                  onClick={() => setForm({ ...form, color: c.id })}
                  className={`w-7 h-7 rounded-full ${c.class} transition-transform cursor-pointer ${form.color === c.id ? 'ring-2 ring-offset-2 ring-accent scale-110' : 'opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Icône du module</label>
            <div className="flex items-center gap-2">
              {AVAILABLE_ICONS.map(i => {
                const IconComp = i.icon;
                const isSelected = form.icon === i.id;
                return (
                  <button
                    key={i.id} type="button" title={i.label}
                    onClick={() => setForm({ ...form, icon: i.id })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${isSelected ? 'bg-accent/20 border-accent text-accent' : 'bg-background border-border/60 text-text-muted hover:text-text'}`}
                  >
                    <IconComp size={16} />
                  </button>
                );
              })}
            </div>
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

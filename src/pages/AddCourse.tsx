import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, BookOpen, GraduationCap, Scale, Shield, FileText, Bookmark } from 'lucide-react';
import { createCourseWithSchedule } from '../services/supabaseService';
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

export function AddCourse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    course_code: '',
    ects: 6,
    status: 'En cours',
    teacher_name: '',
    semester: 'Automne 2026',
    color: 'gold',
    icon: 'Scale'
  });

  const [schedules, setSchedules] = useState<Array<{ day_of_week: string; start_time: string; end_time: string }>>([]);
  const [newSchedule, setNewSchedule] = useState({ day_of_week: 'Lundi', start_time: '08:15', end_time: '12:00' });

  const handleAddSchedule = () => {
    setSchedules([...schedules, newSchedule]);
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast("Le titre du cours est requis.", "warning");
      return;
    }

    setLoading(true);
    try {
      await createCourseWithSchedule(form, schedules);
      toast("Module de droit créé avec succès", "success");
      navigate('/courses');
    } catch (err) {
      console.error(err);
      toast("Échec de la création du cours.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 animate-in fade-in duration-300 max-w-xl mx-auto w-full text-text">
      <header className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Nouveau module</h1>
          <p className="text-text-muted text-xs">Configurez un nouvel enseignement et ses horaires récurrents.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Intitulé du cours *</label>
          <input 
            type="text" required value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })} 
            placeholder="ex: Droit des obligations I" 
            className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent" 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Code du cours</label>
            <input 
              type="text" value={form.course_code} 
              onChange={(e) => setForm({ ...form, course_code: e.target.value })} 
              placeholder="ex: DRO-301" 
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
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Enseignant / Professeur</label>
            <input 
              type="text" value={form.teacher_name} 
              onChange={(e) => setForm({ ...form, teacher_name: e.target.value })} 
              placeholder="ex: Prof. J. Huguenin" 
              className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent" 
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

        {/* HORAIRES RÉCURRENTS */}
        <div className="flex flex-col gap-3 bg-surface p-4 rounded-card border border-border/60">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Horaires de cours (Optionnel)</span>
          {schedules.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between bg-surface-elevated px-3 py-2 rounded-lg text-xs font-mono border border-border/50">
              <span>{s.day_of_week} : {s.start_time} - {s.end_time}</span>
              <button type="button" onClick={() => handleRemoveSchedule(idx)} className="text-danger hover:underline cursor-pointer">Supprimer</button>
            </div>
          ))}
          <div className="flex gap-2 items-center mt-1">
            <select value={newSchedule.day_of_week} onChange={e => setNewSchedule({...newSchedule, day_of_week: e.target.value})} className="bg-background border border-border rounded-input p-2 text-xs cursor-pointer">
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="time" value={newSchedule.start_time} onChange={e => setNewSchedule({...newSchedule, start_time: e.target.value})} className="bg-background border border-border rounded-input p-2 text-xs font-mono" />
            <span className="text-text-muted">à</span>
            <input type="time" value={newSchedule.end_time} onChange={e => setNewSchedule({...newSchedule, end_time: e.target.value})} className="bg-background border border-border rounded-input p-2 text-xs font-mono" />
            <button type="button" onClick={handleAddSchedule} className="p-2 bg-surface-elevated hover:bg-surface-interactive border border-border rounded-input text-text cursor-pointer" title="Ajouter cet horaire">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <button 
          type="submit" disabled={loading} 
          className="mt-2 w-full bg-accent text-background rounded-btn py-4 px-4 flex items-center justify-center gap-2 font-bold glow-gold hover:bg-accent-strong transition-all cursor-pointer disabled:opacity-50 shadow-apple"
        >
          <Plus size={18} />
          <span>{loading ? 'Création...' : 'Enregistrer le module'}</span>
        </button>
      </form>
    </div>
  );
}

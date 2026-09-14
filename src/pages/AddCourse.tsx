// src/pages/AddCourse.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Save, Clock } from 'lucide-react';
import { createCourseWithSchedule } from '../services/supabaseService';

export function AddCourse() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    course_code: '',
    ects: 6,
    status: 'En cours',
    teacher_name: '',
    semester: 'Automne 2026'
  });

  const [schedules, setSchedules] = useState<Array<{ day_of_week: string; start_time: string; end_time: string }>>([
    { day_of_week: 'Lundi', start_time: '10:00', end_time: '12:00' }
  ]);

  const [loading, setLoading] = useState(false);

  const handleAddSchedule = () => {
    setSchedules([...schedules, { day_of_week: 'Mardi', start_time: '14:00', end_time: '16:00' }]);
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    setLoading(true);
    try {
      await createCourseWithSchedule(form, schedules);
      alert("Cours créé et planning généré automatiquement !");
      navigate('/courses');
    } catch (err) {
      console.error("Erreur création cours:", err);
      alert("Échec de l'enregistrement du cours.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 max-w-xl mx-auto w-full text-text">
      
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>

        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Nouveau cours de droit</h1>
          <p className="text-text-muted text-xs">Configurez les informations et les horaires récurrents du cours pour le planning.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Intitulé du cours *</label>
          <input 
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="ex: Droit des obligations I"
            className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Code du cours</label>
            <input 
              type="text"
              value={form.course_code}
              onChange={(e) => setForm({ ...form, course_code: e.target.value })}
              placeholder="ex: DRO-301"
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Crédits ECTS</label>
            <input 
              type="number"
              min="1"
              max="30"
              value={form.ects}
              onChange={(e) => setForm({ ...form, ects: Number(e.target.value) })}
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Semestre</label>
            <select 
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
            >
              <option value="Automne 2026">Automne 2026</option>
              <option value="Printemps 2027">Printemps 2027</option>
              <option value="Automne 2027">Automne 2027</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Statut</label>
            <select 
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
            >
              <option value="En cours">En cours</option>
              <option value="Validé">Validé</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Nom de l'enseignant / Professeur</label>
          <input 
            type="text"
            value={form.teacher_name}
            onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
            placeholder="ex: Prof. Alain Papaux"
            className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-3 bg-surface p-4 rounded-2xl border border-border">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={16} />
              <span>Horaires hebdomadaires récurrents</span>
            </label>
            <button 
              type="button" 
              onClick={handleAddSchedule}
              className="text-xs text-accent font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus size={14} />
              <span>Ajouter un créneau</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {schedules.map((sched, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-surface-elevated p-2.5 rounded-xl border border-border">
                <select 
                  value={sched.day_of_week}
                  onChange={(e) => {
                    const newScheds = [...schedules];
                    newScheds[idx].day_of_week = e.target.value;
                    setSchedules(newScheds);
                  }}
                  className="bg-surface border border-border rounded-lg py-2 px-2 text-xs appearance-none flex-1"
                >
                  <option value="Lundi">Lundi</option>
                  <option value="Mardi">Mardi</option>
                  <option value="Mercredi">Mercredi</option>
                  <option value="Jeudi">Jeudi</option>
                  <option value="Vendredi">Vendredi</option>
                  <option value="Samedi">Samedi</option>
                </select>

                <input 
                  type="time"
                  value={sched.start_time}
                  onChange={(e) => {
                    const newScheds = [...schedules];
                    newScheds[idx].start_time = e.target.value;
                    setSchedules(newScheds);
                  }}
                  className="bg-surface border border-border rounded-lg py-2 px-2 text-xs w-24"
                />

                <span className="text-text-muted text-xs">à</span>

                <input 
                  type="time"
                  value={sched.end_time}
                  onChange={(e) => {
                    const newScheds = [...schedules];
                    newScheds[idx].end_time = e.target.value;
                    setSchedules(newScheds);
                  }}
                  className="bg-surface border border-border rounded-lg py-2 px-2 text-xs w-24"
                />

                {schedules.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => handleRemoveSchedule(idx)}
                    className="p-2 text-text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-accent text-background rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
        >
          <Save size={18} />
          <span>{loading ? 'Création et synchronisation...' : 'Enregistrer le cours et générer le planning'}</span>
        </button>

      </form>
    </div>
  );
}

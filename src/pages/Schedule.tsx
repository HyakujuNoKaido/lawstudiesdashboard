import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Trash2, Edit3, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { fetchEvents, createEvent, fetchCourses } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

export function Schedule() {
  const [events, setEvents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    event_date: '',
    category: 'Cours',
    course_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [eventsData, coursesData] = await Promise.all([
        fetchEvents(),
        fetchCourses()
      ]);
      setEvents(eventsData);
      setCourses(coursesData);
      if (coursesData.length > 0 && !form.course_id) {
        setForm(f => ({ ...f, course_id: coursesData[0].id }));
      }
    } catch (err) {
      console.error("Erreur chargement planning:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from('events')
          .update({
            title: form.title,
            event_date: form.event_date,
            category: form.category,
            course_id: form.course_id || null
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        await createEvent(form);
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ title: '', event_date: '', category: 'Cours', course_id: courses[0]?.id || '' });
      loadData();
    } catch (err) {
      console.error("Erreur enregistrement événement:", err);
      alert("Échec de l'enregistrement de l'événement.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error("Erreur suppression événement:", err);
    }
  };

  const handleEdit = (evt: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(evt.id);
    setForm({
      title: evt.title,
      event_date: evt.event_date ? evt.event_date.substring(0, 16) : '',
      category: evt.category || 'Cours',
      course_id: evt.course_id || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-1">Planning académique</h1>
          <p className="text-text-muted text-sm">Gestion de vos cours, examens et échéances de droit.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sélecteur de vue */}
          <div className="flex bg-surface border border-border rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  viewMode === mode ? 'bg-accent text-background' : 'text-text-muted hover:text-text'
                }`}
              >
                {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>

          <button 
            onClick={() => { setEditingId(null); setForm({ title: '', event_date: '', category: 'Cours', course_id: courses[0]?.id || '' }); setIsModalOpen(true); }}
            className="bg-accent text-background px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 hover:bg-accent-strong transition-colors"
          >
            <Plus size={16} />
            <span>Ajouter</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12 text-text-muted text-sm">Chargement du planning...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-text-muted text-sm">
          Aucun événement dans votre planning. Utilisez le bouton "Ajouter".
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Affichage : {viewMode === 'month' ? 'Vue Mensuelle' : viewMode === 'week' ? 'Vue Hebdomadaire' : 'Vue Journalière'}
          </div>

          {events.map(evt => (
            <Card key={evt.id} className="flex items-center justify-between p-4 hover:border-accent/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-elevated rounded-lg flex items-center justify-center text-accent shrink-0">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm">{evt.title}</p>
                    <Badge variant="outline">{evt.category}</Badge>
                  </div>
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                    <Clock size={12} />
                    <span>{evt.courses?.title ? `${evt.courses.title} • ` : ''}{new Date(evt.event_date).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => handleEdit(evt, e)}
                  className="p-2 text-text-muted hover:text-accent transition-colors"
                  title="Modifier"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={(e) => handleDelete(evt.id, e)}
                  className="p-2 text-text-muted hover:text-danger transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Ajout / Modification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-xl p-6 shadow-2xl">
            <h2 className="font-serif text-2xl mb-4">{editingId ? "Modifier l'événement" : "Nouvel événement"}</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Titre</label>
                <input 
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ex: Examen de droit des obligations"
                  className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted">Date et heure</label>
                  <input 
                    type="datetime-local"
                    required
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted">Catégorie</label>
                  <select 
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
                  >
                    <option value="Cours">Cours</option>
                    <option value="Examen">Examen</option>
                    <option value="Séminaire">Séminaire</option>
                    <option value="Rendu">Rendu</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Cours associé</label>
                <select 
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
                >
                  <option value="">Aucun</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface border border-border text-text py-2.5 rounded-md text-sm font-medium hover:bg-surface/80"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-accent text-background py-2.5 rounded-md text-sm font-medium hover:bg-accent-strong"
                >
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

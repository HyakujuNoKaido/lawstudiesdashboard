import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { fetchEvents, createEvent, fetchCourses } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

export function Schedule() {
  const [events, setEvents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const handlePrev = () => {
    const newDate = new Date(currentDate.getTime());
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate.getTime());
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const adjustedFirstDay = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const filteredEvents = events.filter(evt => {
    const evtDate = new Date(evt.event_date);
    if (viewMode === 'month') {
      return evtDate.getMonth() === month && evtDate.getFullYear() === year;
    } else if (viewMode === 'day') {
      return evtDate.toDateString() === currentDate.toDateString();
    } else {
      const startOfWeek = new Date(currentDate.getTime());
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek.getTime());
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      return evtDate >= startOfWeek && evtDate < endOfWeek;
    }
  });

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="font-serif text-3xl font-bold">Mon planning</h1>
          <p className="text-text-muted text-xs">Calendrier et gestion de vos échéances juridiques.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface border border-border rounded-xl p-1">
            {(['month', 'week', 'day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                  viewMode === mode ? 'bg-accent text-background font-semibold' : 'text-text-muted hover:text-text'
                }`}
              >
                {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>

          <button 
            onClick={() => { setEditingId(null); setForm({ title: '', event_date: '', category: 'Cours', course_id: courses[0]?.id || '' }); setIsModalOpen(true); }}
            className="bg-accent text-background px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Ajouter</span>
          </button>
        </div>
      </header>

      {/* --- WIDGET CALENDRIER VISUEL --- */}
      <Card className="bg-surface border-border p-4 flex flex-col gap-4">
        
        <div className="flex justify-between items-center px-2">
          <h3 className="font-serif text-lg font-bold">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center gap-1">
            <button onClick={handlePrev} className="p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <button onClick={handleNext} className="p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {viewMode === 'month' && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                
                const dayEvents = events.filter(e => e.event_date && e.event_date.startsWith(dateStr));
                const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString();

                return (
                  <div 
                    key={dayNum}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-10 rounded-xl flex flex-col items-center justify-center relative cursor-pointer transition-all ${
                      isToday ? 'bg-accent/20 border border-accent text-accent font-bold' : 'hover:bg-surface-elevated text-text'
                    }`}
                  >
                    <span className="text-xs">{dayNum}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                          <span 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full ${
                              ev.category === 'Examen' ? 'bg-danger' : ev.category === 'Séminaire' ? 'bg-success' : 'bg-info'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="text-xs text-text-muted py-4 text-center">
            Affichage hebdomadaire actif — {events.length} événement(s) pour cette période.
          </div>
        )}

        {viewMode === 'day' && (
          <div className="text-xs text-text-muted py-4 text-center">
            Affichage journalier — Date ciblée : {currentDate.toLocaleDateString()}
          </div>
        )}
      </Card>

      {/* --- LISTE DES ÉVÉNEMENTS --- */}
      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-semibold px-1">
          {viewMode === 'month' ? 'Événements du mois' : 'Événements planifiés'}
        </h2>

        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm">Chargement...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl text-text-muted text-sm">
            Aucun événement pour cette vue. Cliquez sur "Ajouter" pour planifier une échéance.
          </div>
        ) : (
          filteredEvents.map(evt => (
            <Card key={evt.id} className="bg-surface border-border p-4 flex items-center justify-between hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-elevated rounded-xl flex items-center justify-center text-accent shrink-0">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm text-text">{evt.title}</p>
                    <Badge variant={evt.category === 'Examen' ? 'danger' : 'outline'}>{evt.category}</Badge>
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
                  className="p-2 text-text-muted hover:text-accent transition-colors cursor-pointer"
                  title="Modifier"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={(e) => handleDelete(evt.id, e)}
                  className="p-2 text-text-muted hover:text-danger transition-colors cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Ajout / Modification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-2xl p-6 shadow-2xl">
            <h2 className="font-serif text-xl font-bold mb-4">{editingId ? "Modifier l'événement" : "Nouvel événement"}</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Titre</label>
                <input 
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ex: Examen de droit des obligations"
                  className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
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
                    className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted">Catégorie</label>
                  <select 
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
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
                  className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
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
                  className="flex-1 bg-surface border border-border text-text py-3 rounded-xl text-sm font-medium hover:bg-surface/85 cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-accent text-background py-3 rounded-xl text-sm font-semibold glow-gold hover:bg-accent-strong cursor-pointer"
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

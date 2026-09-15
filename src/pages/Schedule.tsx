import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, Clock, Download, Upload, BookOpen, Timer, Scale, FileText, BrainCircuit, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { fetchEvents, createEvent, fetchCourses } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

export function Schedule() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // État pour la modale de suppression
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  
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
      toast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }

  // --- Helpers d'UI pour le code couleur ---
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Examen': return { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30', icon: Timer };
      case 'Séminaire': return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', icon: Scale };
      case 'Rendu': return { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/30', icon: FileText };
      case 'Révision': return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', icon: BrainCircuit };
      default: return { bg: 'bg-info/10', text: 'text-info', border: 'border-info/30', icon: BookOpen };
    }
  };

  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Lexi Suisse//Calendar//FR\n";
    events.forEach(ev => {
      const dtStart = new Date(ev.event_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:${ev.title}\n`;
      icsContent += `DTSTART:${dtStart}\n`;
      icsContent += `DESCRIPTION:Catégorie: ${ev.category}\n`;
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lexi_schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Planning exporté en ICS", "success");
  };

  const handleImportICS = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const summaryMatch = text.match(/SUMMARY:(.*)/g);
      const dtstartMatch = text.match(/DTSTART:(.*)/g);

      if (summaryMatch && dtstartMatch) {
        try {
          for (let i = 0; i < summaryMatch.length; i++) {
            const title = summaryMatch[i].replace('SUMMARY:', '').trim();
            let rawDate = dtstartMatch[i]?.replace('DTSTART:', '').trim();
            if (rawDate && rawDate.length >= 15) {
              const formattedDate = `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}T${rawDate.substring(9,11)}:${rawDate.substring(11,13)}`;
              await createEvent({ title, event_date: formattedDate, category: 'Cours' });
            }
          }
          toast("Calendrier ICS importé avec succès !", "success");
          loadData();
        } catch (err) {
          console.error("Erreur parsing ICS:", err);
          toast("Erreur lors de l'importation du fichier ICS.", "error");
        }
      } else {
        toast("Format ICS non reconnu ou fichier vide.", "warning");
      }
    };
    reader.readAsText(file);
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate.getTime());
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate.getTime());
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
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
        toast("Événement mis à jour", "success");
      } else {
        await createEvent(form);
        toast("Événement ajouté au planning", "success");
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ title: '', event_date: '', category: 'Cours', course_id: courses[0]?.id || '' });
      loadData();
    } catch (err) {
      console.error("Erreur enregistrement événement:", err);
      toast("Échec de l'enregistrement de l'événement.", "error");
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventToDelete);
      if (error) throw error;
      setEventToDelete(null);
      toast("Événement supprimé", "success");
      loadData();
    } catch (err) {
      console.error("Erreur suppression événement:", err);
      toast("Erreur lors de la suppression", "error");
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
  const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const adjustedFirstDay = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getWeekDays = (date: Date) => {
    const d = new Date(date.getTime());
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday.getTime());
      nextDay.setDate(monday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);

  const filteredEvents = events.filter(evt => {
    const evtDate = new Date(evt.event_date);
    if (viewMode === 'month') return evtDate.getMonth() === month && evtDate.getFullYear() === year;
    if (viewMode === 'day') return evtDate.toDateString() === currentDate.toDateString();
    return evtDate >= weekDays[0] && evtDate <= weekDays[6];
  });

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Mon planning</h1>
          <p className="text-text-muted text-sm mt-1">Gérez votre emploi du temps et vos échéances.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleExportICS}
            className="bg-surface border border-border px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:border-accent/50 transition-colors cursor-pointer"
            title="Exporter en fichier .ics"
          >
            <Download size={15} className="text-accent" />
            <span className="hidden sm:inline">Export ICS</span>
          </button>

          <label className="bg-surface border border-border px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:border-accent/50 transition-colors cursor-pointer">
            <Upload size={15} className="text-info" />
            <span className="hidden sm:inline">Import ICS</span>
            <input type="file" accept=".ics" onChange={handleImportICS} className="hidden" />
          </label>

          <div className="flex bg-surface-elevated border border-border rounded-xl p-1">
            {(['month', 'week', 'day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                  viewMode === mode ? 'bg-accent text-background' : 'text-text-muted hover:text-text'
                }`}
              >
                {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>

          <button 
            onClick={() => { setEditingId(null); setForm({ title: '', event_date: '', category: 'Cours', course_id: courses[0]?.id || '' }); setIsModalOpen(true); }}
            className="bg-accent text-background px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
      </header>

      {/* NAVIGATION TEMPORELLE */}
      <div className="flex justify-between items-center bg-surface border border-border rounded-2xl p-2 shadow-sm">
        <button onClick={handlePrev} className="p-2 text-text-muted hover:text-accent transition-colors cursor-pointer"><ChevronLeft size={20} /></button>
        <span className="font-serif text-lg md:text-xl font-bold text-text">
          {viewMode === 'month' && `${monthNames[month]} ${year}`}
          {viewMode === 'week' && `Sem. du ${weekDays[0].toLocaleDateString('fr-CH', {day: 'numeric', month:'short'})}`}
          {viewMode === 'day' && currentDate.toLocaleDateString('fr-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <button onClick={handleNext} className="p-2 text-text-muted hover:text-accent transition-colors cursor-pointer"><ChevronRight size={20} /></button>
      </div>

      {/* Calendrier Visuel Interactif */}
      <Card className="bg-surface border-border p-4 flex flex-col gap-4">

        {/* VUE MOIS : Grille classique */}
        {viewMode === 'month' && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12 md:h-16" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const targetDate = new Date(year, month, dayNum);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                
                const dayEvents = events.filter(e => e.event_date && e.event_date.startsWith(dateStr));
                const isToday = new Date().toDateString() === targetDate.toDateString();

                return (
                  <div 
                    key={dayNum}
                    onClick={() => {
                      setCurrentDate(targetDate);
                      setViewMode('day');
                    }}
                    className={`h-12 md:h-16 rounded-xl flex flex-col items-center justify-center relative cursor-pointer transition-all p-1 border ${
                      isToday ? 'bg-accent/10 border-accent text-accent font-bold' : 'bg-surface-elevated border-border text-text hover:border-accent/40'
                    }`}
                  >
                    <span className="text-xs md:text-sm">{dayNum}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-1 px-1">
                        {dayEvents.slice(0, 4).map((ev, idx) => {
                          const style = getCategoryStyles(ev.category);
                          return (
                            <span 
                              key={idx} 
                              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${style.text.replace('text-', 'bg-')}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VUE SEMAINE : Liste chronologique par jour (Idéal Mobile) */}
        {viewMode === 'week' && (
          <div className="flex flex-col gap-6">
            {weekDays.map((day, idx) => {
              const dateStr = day.toISOString().split('T')[0];
              const dayEvents = events.filter(e => e.event_date?.startsWith(dateStr)).sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
              const isToday = new Date().toDateString() === day.toDateString();
              const loadIndicator = dayEvents.length > 3 ? 'bg-danger' : dayEvents.length > 0 ? 'bg-accent' : 'bg-transparent';

              return (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${isToday ? 'bg-accent text-background border-accent' : 'bg-surface-elevated border-border text-text'}`}>
                      <span className="text-[9px] uppercase font-bold opacity-80">{dayNames[idx].substring(0,3)}</span>
                      <span className="text-sm font-bold">{day.getDate()}</span>
                    </div>
                    <div className="h-px bg-border flex-1"></div>
                    <div className={`w-2 h-2 rounded-full ${loadIndicator}`}></div>
                  </div>

                  <div className="flex flex-col gap-3 pl-4 md:pl-16">
                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-text-muted italic">Aucun événement</p>
                    ) : (
                      dayEvents.map(ev => {
                        const style = getCategoryStyles(ev.category);
                        const Icon = style.icon;
                        return (
                          <div key={ev.id} className={`flex flex-col bg-surface-elevated border-l-[4px] border-y border-r border-y-border border-r-border rounded-r-xl p-4 shadow-sm ${style.border}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${style.bg} ${style.text}`}><Icon size={16} /></div>
                                <span className="text-[11px] font-mono font-bold text-text-muted">
                                  {new Date(ev.event_date).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={(e) => handleEdit(ev, e)} className="p-1.5 text-text-muted hover:text-text cursor-pointer"><Edit3 size={14}/></button>
                                <button onClick={(e) => { e.stopPropagation(); setEventToDelete(ev.id); }} className="p-1.5 text-text-muted hover:text-danger cursor-pointer"><Trash2 size={14}/></button>
                              </div>
                            </div>
                            
                            <h4 className="font-semibold text-sm text-text">{ev.title}</h4>
                            {ev.courses?.title && <p className="text-xs text-text-muted mt-1">{ev.courses.title}</p>}
                            
                            {/* Hub d'action intégré */}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                              {ev.course_id && (
                                <button onClick={() => navigate(`/courses/${ev.course_id}`)} className="text-[10px] uppercase font-bold tracking-wider text-text-muted hover:text-text flex items-center gap-1 cursor-pointer">
                                  Ouvrir le cours <ArrowRight size={12} />
                                </button>
                              )}
                              {ev.category === 'Révision' && (
                                <button onClick={() => navigate('/study')} className="text-[10px] uppercase font-bold tracking-wider text-warning hover:text-warning/80 flex items-center gap-1 ml-auto cursor-pointer">
                                  Lancer la session <ArrowRight size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VUE JOUR : Liste horaire détaillée */}
        {viewMode === 'day' && (
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-2">
            {Array.from({ length: 13 }).map((_, hourIdx) => {
              const hour = hourIdx + 8;
              const hourStr = `${String(hour).padStart(2, '0')}:00`;
              
              const hourEvents = filteredEvents.filter(e => {
                const evDate = new Date(e.event_date);
                return evDate.getHours() === hour;
              });

              return (
                <div key={hour} className="flex gap-4 items-start border-b border-border/60 py-3">
                  <span className="w-12 text-xs font-mono text-text-muted pt-1">{hourStr}</span>
                  
                  <div className="flex-1 flex flex-col gap-2 min-h-[35px]">
                    {hourEvents.length > 0 ? (
                      hourEvents.map(ev => {
                        const style = getCategoryStyles(ev.category);
                        const Icon = style.icon;
                        return (
                          <div 
                            key={ev.id} 
                            onClick={(e) => handleEdit(ev, e)}
                            className={`bg-surface-elevated p-3 rounded-xl border-l-[4px] border-y border-r border-y-border border-r-border flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer shadow-sm hover:border-r-accent ${style.border}`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 w-fit ${style.bg} ${style.text}`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-medium text-sm text-text">{ev.title}</p>
                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>{ev.category}</span>
                              </div>
                              <p className="text-xs text-text-muted mt-0.5">{ev.courses?.title || 'Matière générale'}</p>
                            </div>
                            <div className="flex items-center gap-1 sm:ml-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                              <button onClick={(e) => handleEdit(ev, e)} className="p-2 text-text-muted hover:text-accent cursor-pointer"><Edit3 size={14} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setEventToDelete(ev.id); }} className="p-2 text-text-muted hover:text-danger cursor-pointer"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full border border-dashed border-border/30 rounded-lg flex items-center px-3 text-[11px] text-text-muted/40">
                        Créneau libre
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </Card>

      {/* Modal Ajout / Modification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl">
            <h2 className="font-serif text-xl font-bold mb-4">{editingId ? "Modifier l'événement" : "Nouvel événement"}</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Titre</label>
                <input 
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ex: Séminaire de droit civil"
                  className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted">Date et heure</label>
                  <input 
                    type="datetime-local"
                    required
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-muted">Catégorie</label>
                  <select 
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none cursor-pointer"
                  >
                    <option value="Cours">Cours</option>
                    <option value="Examen">Examen</option>
                    <option value="Séminaire">Séminaire</option>
                    <option value="Révision">Révision (Bloc)</option>
                    <option value="Rendu">Rendu (Deadline)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">Cours associé</label>
                <select 
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none cursor-pointer"
                >
                  <option value="">Aucun</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface-elevated border border-border text-text py-3 rounded-xl text-sm font-medium hover:bg-border cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-accent text-background py-3 rounded-xl text-sm font-semibold glow-gold hover:bg-accent-strong cursor-pointer transition-colors"
                >
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression d'événement */}
      <ConfirmModal 
        isOpen={!!eventToDelete}
        title="Supprimer l'événement ?"
        message="Voulez-vous vraiment supprimer cet événement de votre planning ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={confirmDeleteEvent}
        onClose={() => setEventToDelete(null)}
      />

    </div>
  );
}

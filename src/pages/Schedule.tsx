import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, Clock, Download, Upload, BookOpen, Timer, Scale, FileText, BrainCircuit, ArrowRight, AlertCircle, LayoutList, Sparkles } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  
  // Option spécifique pour l'examen
  const [generatePrepPlan, setGeneratePrepPlan] = useState(false);

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
      const [eventsData, coursesData] = await Promise.all([ fetchEvents(), fetchCourses() ]);
      setEvents(eventsData);
      setCourses(coursesData);
      if (coursesData.length > 0 && !form.course_id) {
        setForm(f => ({ ...f, course_id: coursesData[0].id }));
      }
    } catch (err) {
      toast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }

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
    toast("Planning exporté", "success");
  };

  const handleImportICS = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const eventBlocks = text.split('BEGIN:VEVENT');
      let importedCount = 0;
      try {
        for (const block of eventBlocks) {
          if (!block.includes('END:VEVENT')) continue;
          const summaryMatch = block.match(/SUMMARY(?:;[^:]*)?:([^\r\n]*)/i);
          const dtstartMatch = block.match(/DTSTART(?:;[^:]*)?:([^\r\n]*)/i);
          if (summaryMatch && dtstartMatch) {
            const title = summaryMatch[1].trim();
            const rawDate = dtstartMatch[1].trim();
            if (rawDate.length >= 8) {
              const year = rawDate.substring(0, 4);
              const month = rawDate.substring(4, 6);
              const day = rawDate.substring(6, 8);
              let formattedDate = `${year}-${month}-${day}T08:00`;
              if (rawDate.includes('T') && rawDate.length >= 13) {
                formattedDate = `${year}-${month}-${day}T${rawDate.substring(9, 11)}:${rawDate.substring(11, 13)}`;
              }
              await createEvent({ title, event_date: formattedDate, category: 'Cours' });
              importedCount++;
            }
          }
        }
        if (importedCount > 0) { toast(`${importedCount} événements importés !`, "success"); loadData(); } 
      } catch (err) {
        toast("Erreur lors de l'importation.", "error");
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
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate.getTime());
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const openModalWithCategory = (category: string) => {
    setIsPlusMenuOpen(false);
    setEditingId(null);
    setForm({ title: '', event_date: '', category, course_id: courses[0]?.id || '' });
    setGeneratePrepPlan(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return;
    try {
      if (editingId) {
        await supabase.from('events').update({ title: form.title, event_date: form.event_date, category: form.category, course_id: form.course_id || null }).eq('id', editingId);
        toast("Événement mis à jour", "success");
      } else {
        await createEvent(form);
        
        // --- GÉNÉRATION DU PLAN DE PRÉPARATION (Point 15) ---
        if (form.category === 'Examen' && generatePrepPlan && form.course_id) {
           const examDate = new Date(form.event_date);
           const intervals = [28, 21, 14, 7, 3];
           for(const daysBefore of intervals) {
              const prepDate = new Date(examDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
              if (prepDate > new Date()) {
                await createEvent({
                   title: `Révision ${form.title} (J-${daysBefore})`,
                   event_date: prepDate.toISOString().substring(0, 16),
                   category: 'Révision',
                   course_id: form.course_id
                });
              }
           }
           toast("Plan de révision généré sur plusieurs semaines", "info");
        } else {
          toast("Événement ajouté", "success");
        }
      }
      setIsModalOpen(false); setEditingId(null); loadData();
    } catch (err) {
      toast("Échec de l'enregistrement", "error");
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await supabase.from('events').delete().eq('id', eventToDelete);
      setEventToDelete(null); toast("Événement supprimé", "success"); loadData();
    } catch (err) { toast("Erreur lors de la suppression", "error"); }
  };

  const handleEdit = (evt: any, e: React.MouseEvent) => {
    e.stopPropagation(); setEditingId(evt.id); setGeneratePrepPlan(false);
    setForm({ title: evt.title, event_date: evt.event_date ? evt.event_date.substring(0, 16) : '', category: evt.category || 'Cours', course_id: evt.course_id || '' });
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
    return Array.from({length: 7}).map((_, i) => {
      const nextDay = new Date(monday.getTime());
      nextDay.setDate(monday.getDate() + i);
      return nextDay;
    });
  };
  
  const weekDays = getWeekDays(currentDate);
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDayEvents = events.filter(e => e.event_date?.startsWith(selectedDateStr)).sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const filteredEvents = events.filter(evt => {
    const evtDate = new Date(evt.event_date);
    if (viewMode === 'month') return evtDate.getMonth() === month && evtDate.getFullYear() === year;
    if (viewMode === 'day') return evtDate.toDateString() === currentDate.toDateString();
    return evtDate >= weekDays[0] && evtDate <= weekDays[6];
  });

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      {/* HEADER & MINI-MENU CONTEXTUEL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Mon planning</h1>
          <p className="text-text-muted text-sm mt-1">Gérez votre emploi du temps et vos échéances.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 relative">
          <label className="bg-surface border border-border px-3.5 py-2.5 rounded-btn text-xs font-semibold flex items-center gap-1.5 hover:border-accent/50 transition-colors cursor-pointer shadow-sm">
            <Upload size={15} className="text-info" /> <span className="hidden sm:inline">Import ICS</span>
            <input type="file" accept=".ics" onChange={handleImportICS} className="hidden" />
          </label>
          
          <div className="flex bg-surface-elevated border border-border rounded-btn p-1 shadow-sm">
            {(['month', 'week', 'day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-md text-xs font-bold capitalize transition-colors cursor-pointer ${
                  viewMode === mode ? 'bg-accent text-background shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                {mode === 'month' ? 'Mois' : mode === 'week' ? 'Sem' : 'Jour'}
              </button>
            ))}
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className="bg-accent text-background px-4 py-2.5 rounded-btn text-xs font-bold flex items-center gap-1.5 glow-gold hover:bg-accent-strong transition-transform active:scale-95 cursor-pointer"
            >
              <Plus size={16} className={`transition-transform duration-200 ${isPlusMenuOpen ? 'rotate-45' : ''}`} />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
            
            {isPlusMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-elevated border border-border rounded-modal shadow-apple z-50 py-1.5 animate-in fade-in zoom-in-95">
                <button onClick={() => openModalWithCategory('Cours')} className="w-full px-4 py-2.5 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer">
                  <BookOpen size={16} className="text-accent" /> Ajouter un cours
                </button>
                <button onClick={() => openModalWithCategory('Révision')} className="w-full px-4 py-2.5 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer">
                  <BrainCircuit size={16} className="text-warning" /> Bloquer une révision
                </button>
                <button onClick={() => openModalWithCategory('Examen')} className="w-full px-4 py-2.5 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer">
                  <AlertCircle size={16} className="text-danger" /> Ajouter un examen
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* NAVIGATION TEMPORELLE */}
      <div className="flex justify-between items-center bg-surface border border-border rounded-card p-2 shadow-sm">
        <button onClick={handlePrev} className="p-2 text-text-muted hover:text-accent transition-colors cursor-pointer rounded-lg hover:bg-surface-interactive"><ChevronLeft size={20} /></button>
        <span className="font-serif text-lg md:text-xl font-bold text-text">
          {viewMode === 'month' && `${monthNames[month]} ${year}`}
          {viewMode === 'week' && `Sem. du ${weekDays[0].toLocaleDateString('fr-CH', {day: 'numeric', month:'short'})}`}
          {viewMode === 'day' && currentDate.toLocaleDateString('fr-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <button onClick={handleNext} className="p-2 text-text-muted hover:text-accent transition-colors cursor-pointer rounded-lg hover:bg-surface-interactive"><ChevronRight size={20} /></button>
      </div>

      {/* VUE DU HAUT : CALENDRIER INTERACTIF */}
      <div className="bg-surface border border-border rounded-card p-5 shadow-sm flex flex-col gap-4">
        {/* VUE MOIS */}
        {viewMode === 'month' && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
              <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {Array.from({ length: adjustedFirstDay }).map((_, i) => <div key={`empty-${i}`} className="h-12 md:h-16" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const targetDate = new Date(year, month, dayNum);
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = events.filter(e => e.event_date && e.event_date.startsWith(dateStr));
                const isSelected = selectedDate.toDateString() === targetDate.toDateString();
                return (
                  <div 
                    key={dayNum}
                    onClick={() => setSelectedDate(targetDate)}
                    className={`h-12 md:h-16 rounded-xl flex flex-col items-center justify-center relative cursor-pointer transition-all p-1 border ${
                      isSelected ? 'bg-accent/10 border-accent text-accent font-bold shadow-md' : 'bg-surface-elevated border-border text-text hover:border-accent/40 hover:bg-surface-interactive'
                    }`}
                  >
                    <span className="text-xs md:text-sm">{dayNum}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
                        {dayEvents.slice(0, 4).map((ev, idx) => {
                          const style = getCategoryStyles(ev.category);
                          return <span key={idx} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${style.text.replace('text-', 'bg-')}`} />;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VUE SEMAINE */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {weekDays.map((day, idx) => {
              const isSelected = selectedDate.toDateString() === day.toDateString();
              const dateStr = day.toISOString().split('T')[0];
              const hasEvents = events.some(e => e.event_date?.startsWith(dateStr));
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`h-16 w-full flex flex-col items-center justify-center rounded-xl text-sm font-medium relative transition-all cursor-pointer border ${
                    isSelected ? 'bg-accent text-background border-accent font-bold shadow-md' : 'bg-surface-elevated border-border text-text hover:border-accent/40 hover:bg-surface-interactive'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-80 mb-0.5">{dayNames[idx].substring(0,3)}</span>
                  <span className="text-base">{day.getDate()}</span>
                  {hasEvents && !isSelected && <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-warning"></div>}
                </button>
              );
            })}
          </div>
        )}

        {/* VUE JOUR (Timegrid) */}
        {viewMode === 'day' && (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Array.from({ length: 13 }).map((_, hourIdx) => {
              const hour = hourIdx + 8;
              const hourEvents = filteredEvents.filter(e => new Date(e.event_date).getHours() === hour);
              return (
                <div key={hour} className="flex gap-4 items-start border-b border-border/40 py-3">
                  <span className="w-12 text-xs font-mono text-text-muted pt-1">{String(hour).padStart(2, '0')}:00</span>
                  <div className="flex-1 flex flex-col gap-2 min-h-[35px]">
                    {hourEvents.map(ev => {
                      const style = getCategoryStyles(ev.category);
                      const Icon = style.icon;
                      return (
                        <div key={ev.id} onClick={(e) => handleEdit(ev, e)} className={`bg-surface-elevated p-3.5 rounded-card border-l-[4px] border-y border-r border-y-border border-r-border flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer shadow-sm hover:border-r-accent ${style.border}`}>
                          <div className={`p-2.5 rounded-xl shrink-0 w-fit ${style.bg} ${style.text}`}><Icon size={16} /></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-bold text-sm text-text">{ev.title}</p>
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>{ev.category}</span>
                            </div>
                            <p className="text-xs text-text-muted mt-0.5">{ev.courses?.title || 'Matière générale'}</p>
                          </div>
                          <div className="flex items-center gap-1 sm:ml-auto mt-2 sm:mt-0">
                            <button onClick={(e) => handleEdit(ev, e)} className="p-2 text-text-muted hover:text-accent cursor-pointer rounded-lg bg-surface"><Edit3 size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setEventToDelete(ev.id); }} className="p-2 text-text-muted hover:text-danger cursor-pointer rounded-lg bg-surface"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VUE DU BAS : LISTE DYNAMIQUE DU JOUR SÉLECTIONNÉ */}
      {viewMode !== 'day' && (
        <section className="flex flex-col gap-4 flex-1 animate-in fade-in mt-4">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <LayoutList size={16} /> Programme du {selectedDate.toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <button onClick={handleExportICS} className="text-xs font-bold text-text-muted hover:text-accent flex items-center gap-1 cursor-pointer bg-surface-elevated px-3 py-1.5 rounded-btn border border-border">
              <Download size={14} /> Exporter
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-text-muted font-mono animate-pulse">Chargement...</div>
          ) : selectedDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted bg-surface/30 border border-dashed border-border rounded-card gap-3">
              <CalendarDays size={32} className="opacity-20" />
              <p className="text-sm">Rien de prévu pour ce jour.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedDayEvents.map(evt => {
                const style = getCategoryStyles(evt.category);
                const Icon = style.icon;
                return (
                  <div key={evt.id} className={`bg-surface border-l-[4px] border-y border-r border-y-border border-r-border rounded-card p-4 flex items-center gap-4 hover:border-accent/50 transition-colors group cursor-pointer shadow-sm ${style.border}`}>
                    <div className={`p-3 rounded-xl ${style.bg} ${style.text} shrink-0`}><Icon size={20} /></div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <h3 className="font-bold text-sm md:text-base text-text truncate group-hover:text-accent transition-colors">
                        {evt.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] text-text-muted mt-1.5 font-mono">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(evt.event_date).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}</span>
                        {evt.courses?.title && <span className="truncate max-w-[200px] text-accent/80">{evt.courses.title}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => handleEdit(evt, e)} className="p-2 text-text-muted hover:text-accent bg-surface-elevated rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={16} /></button>
                      {evt.course_id && (
                        <button onClick={() => navigate(`/courses/${evt.course_id}`)} className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center text-text-muted group-hover:bg-accent group-hover:text-background transition-colors shrink-0">
                          <ArrowRight size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Modal Ajout / Modification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-modal p-6 shadow-apple">
            <h2 className="font-serif text-2xl font-bold mb-5">{editingId ? "Modifier l'événement" : "Nouvel événement"}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-text-muted">Titre</label>
                <input 
                  type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ex: Séminaire de droit civil" className="w-full bg-background border border-border rounded-input py-2.5 px-3 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-muted">Date et heure</label>
                  <input 
                    type="datetime-local" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="w-full bg-background border border-border rounded-input py-2.5 px-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-muted">Catégorie</label>
                  <select 
                    value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-background border border-border rounded-input py-2.5 px-3 text-sm focus:outline-none focus:border-accent cursor-pointer"
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
                <label className="text-[10px] uppercase font-bold text-text-muted">Cours associé</label>
                <select 
                  value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full bg-background border border-border rounded-input py-2.5 px-3 text-sm focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">Aucun</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {form.category === 'Examen' && !editingId && (
                <div className="mt-2 p-4 bg-warning/10 border border-warning/30 rounded-card flex items-start gap-3 animate-in slide-in-from-top-2">
                  <input 
                    type="checkbox" 
                    id="genPlan"
                    checked={generatePrepPlan}
                    onChange={(e) => setGeneratePrepPlan(e.target.checked)}
                    className="mt-1 shrink-0 accent-warning w-4 h-4"
                  />
                  <label htmlFor="genPlan" className="text-xs text-text cursor-pointer">
                    <span className="font-bold text-warning block mb-1">Plan de préparation</span>
                    Générer automatiquement des sessions de révision espacées (J-3, J-7, J-14, J-21, J-28) pour cet examen.
                  </label>
                </div>
              )}

              <div className="flex gap-3 mt-4 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-surface border border-border text-text py-3 rounded-btn text-sm font-bold hover:bg-surface-interactive cursor-pointer transition-colors">Annuler</button>
                <button type="submit" className="flex-[2] bg-accent text-background py-3 rounded-btn text-sm font-bold glow-gold hover:bg-accent-strong cursor-pointer transition-colors">{editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de confirmation pour suppression */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-surface-elevated border border-border rounded-modal p-6 shadow-apple flex flex-col gap-4 text-center">
            <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-2"><AlertCircle size={24} /></div>
            <h3 className="font-serif text-xl font-bold">Supprimer l'événement ?</h3>
            <p className="text-sm text-text-muted">Cette action retirera définitivement l'événement de votre planning.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEventToDelete(null)} className="flex-1 bg-surface border border-border py-2.5 rounded-btn text-sm font-medium">Annuler</button>
              <button onClick={confirmDeleteEvent} className="flex-1 bg-danger text-white py-2.5 rounded-btn text-sm font-bold">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

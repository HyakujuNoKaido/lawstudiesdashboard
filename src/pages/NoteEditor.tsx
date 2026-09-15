import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Save, Trash2, Calendar, BookOpen, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SOLO_USER_ID } from '../lib/constants';
import { toast } from '../lib/toast';

export function NoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  
  // États du formulaire
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [courseId, setCourseId] = useState<string>('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Autosave tracker
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    loadContext();
  }, [noteId]);

  // Autosave effect (toutes les 15 secondes si le contenu a changé)
  useEffect(() => {
    if (!noteId || noteId === 'new') return; // On ne fait pas d'autosave sur une note non créée
    if (content === lastSavedContent) return;

    const timer = setTimeout(() => {
      saveNote(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [content, title, courseId]);

  async function loadContext() {
    setIsLoading(true);
    try {
      // Charger les cours et le planning pour la pré-sélection intelligente
      const [coursesRes, eventsRes] = await Promise.all([
        supabase.from('courses').select('id, title, course_code').eq('user_id', SOLO_USER_ID),
        supabase.from('events').select('*').eq('user_id', SOLO_USER_ID)
      ]);

      setCourses(coursesRes.data || []);
      setEvents(eventsRes.data || []);

      // Si c'est une édition
      if (noteId && noteId !== 'new') {
        const { data: note, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .single();
          
        if (error) throw error;
        
        setTitle(note.title || '');
        setContent(note.content || '');
        setCourseId(note.course_id || '');
        setLastSavedContent(note.content || '');
        setLastSavedAt(new Date(note.updated_at));
      } else {
        // Mode Amphi Intelligent (Nouvelle note) : 
        // On vérifie s'il y a un événement en cours actuellement dans le calendrier
        const now = new Date();
        const activeEvent = (eventsRes.data || []).find((e: any) => {
          const eventDate = new Date(e.event_date);
          const eventEnd = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Hypothèse: durée 2h
          return now >= eventDate && now <= eventEnd;
        });

        if (activeEvent && activeEvent.course_id) {
          setCourseId(activeEvent.course_id);
          setTitle(`Notes de cours : ${activeEvent.title}`);
          toast(`Lien automatique avec le cours "${activeEvent.title}" détecté !`, "info");
        }
      }
    } catch (err) {
      toast("Erreur de chargement", "error");
      navigate('/courses');
    } finally {
      setIsLoading(false);
    }
  }

  const saveNote = async (isAutosave = false) => {
    if (!title.trim() && !content.trim()) return;
    if (!isAutosave) setIsSaving(true);
    
    try {
      const payload = {
        user_id: SOLO_USER_ID,
        title: title || 'Nouvelle note',
        content,
        course_id: courseId || null,
        updated_at: new Date().toISOString()
      };

      if (noteId && noteId !== 'new') {
        const { error } = await supabase.from('notes').update(payload).eq('id', noteId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('notes').insert([payload]).select().single();
        if (error) throw error;
        
        // Si c'était une nouvelle note, on met à jour l'URL sans recharger la page
        if (!isAutosave && data) {
          navigate(`/notes/${data.id}`, { replace: true });
        }
      }
      
      setLastSavedContent(content);
      setLastSavedAt(new Date());
      if (!isAutosave) toast("Note sauvegardée", "success");
      
    } catch (err) {
      if (!isAutosave) toast("Erreur lors de la sauvegarde", "error");
    } finally {
      if (!isAutosave) setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!noteId || noteId === 'new') {
      navigate(-1);
      return;
    }
    
    if (window.confirm("Supprimer cette note définitivement ?")) {
      try {
        await supabase.from('notes').delete().eq('id', noteId);
        toast("Note supprimée", "success");
        navigate('/courses');
      } catch (err) {
        toast("Erreur de suppression", "error");
      }
    }
  };

  if (isLoading) return <div className="text-center py-20 animate-pulse text-text-muted">Chargement de l'éditeur...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-w-4xl mx-auto pt-2 animate-in fade-in duration-300">
      
      {/* HEADER FIXE */}
      <header className="flex items-center justify-between gap-4 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => {
              if (content !== lastSavedContent) saveNote(true);
              navigate(-1);
            }} 
            className="p-2 text-text-muted hover:text-text bg-surface rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          
          <select 
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="bg-transparent border-none text-xs md:text-sm font-bold text-accent focus:ring-0 cursor-pointer p-0 appearance-none uppercase tracking-wider w-full truncate max-w-[200px]"
          >
            <option value="">Sélectionner un cours...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.course_code ? `${c.course_code} - ` : ''}{c.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {lastSavedAt && (
            <span className="hidden md:flex items-center gap-1 text-[10px] text-text-muted font-mono">
              <Clock size={12} />
              {lastSavedAt.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          
          <button 
            onClick={() => saveNote(false)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span className="hidden sm:inline">Sauvegarder</span>
          </button>
          
          <button 
            onClick={handleDelete}
            className="p-1.5 text-text-muted hover:text-danger rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* ZONE D'ÉDITION (Notion-like) */}
      <main className="flex-1 overflow-y-auto flex flex-col py-6 custom-scrollbar px-1">
        
        {/* Titre géant */}
        <input 
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la note..."
          className="w-full bg-transparent text-3xl md:text-5xl font-serif font-bold text-text mb-6 focus:outline-none placeholder:text-text-muted/30"
        />

        {/* Éditeur de texte fluide */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Commencez à taper vos notes ici (Markdown supporté)..."
          className="flex-1 w-full bg-transparent text-base md:text-lg text-text leading-relaxed font-sans resize-none focus:outline-none placeholder:text-text-muted/30"
        />

      </main>

    </div>
  );
}

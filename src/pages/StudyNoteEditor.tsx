import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Sparkles, BookOpen, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentUserId, fetchCourses } from '../services/supabaseService';
import { toast } from '../lib/toast';

export function StudyNoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [courseId, setCourseId] = useState<string>('');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function initEditor() {
      try {
        const coursesData = await fetchCourses();
        setCourses(coursesData);
        if (coursesData.length > 0 && !courseId) {
          setCourseId(coursesData[0].id);
        }

        // Si c'est une nouvelle note, on initialise un état vide
        if (!noteId || noteId === 'new') {
          setTitle(`Notes de cours - ${new Date().toLocaleDateString('fr-CH')}`);
          setContent('');
          setLoading(false);
          return;
        }

        // Sinon, on charge la note existante
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .single();

        if (error) throw error;
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          if (data.course_id) setCourseId(data.course_id);
        }

      } catch (err) {
        console.error("Erreur chargement note:", err);
        toast("Impossible de charger la note", "error");
      } finally {
        setLoading(false);
      }
    }
    initEditor();
  }, [noteId]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast("Veuillez donner un titre à votre note", "warning");
      return;
    }

    setSaving(true);
    try {
      const userId = await getCurrentUserId();
      if (!noteId || noteId === 'new') {
        const { error } = await supabase.from('notes').insert([{
          user_id: userId,
          course_id: courseId || null,
          title,
          content
        }]);
        if (error) throw error;
        toast("Note créée avec succès", "success");
      } else {
        const { error } = await supabase
          .from('notes')
          .update({
            title,
            content,
            course_id: courseId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', noteId);
        if (error) throw error;
        toast("Note sauvegardée", "success");
      }
      
      navigate(-1);
    } catch (err) {
      console.error(err);
      toast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center p-12 text-text-muted font-mono animate-pulse">Ouverture de l'éditeur...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto w-full gap-4 pt-2">
      {/* HEADER DE L'ÉDITEUR */}
      <header className="flex items-center justify-between gap-4 bg-surface border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 text-text-muted hover:text-text bg-surface-elevated rounded-xl shrink-0 cursor-pointer border border-border"
          >
            <ChevronLeft size={20} />
          </button>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la note ou du cours..."
            className="w-full bg-transparent font-serif text-lg md:text-xl font-bold text-text focus:outline-none border-b border-transparent focus:border-accent pb-0.5 truncate"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select 
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="hidden sm:block bg-background border border-border rounded-xl text-xs font-bold p-2.5 text-text cursor-pointer focus:outline-none focus:border-accent"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-accent text-background rounded-xl text-xs font-bold glow-gold hover:scale-[1.02] transition-transform cursor-pointer disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </header>

      {/* ZONE DE SAISIE DE LA NOTE */}
      <div className="flex-1 bg-surface border border-border rounded-3xl p-6 flex flex-col shadow-sm relative overflow-hidden">
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tapez vos notes de cours ici en direct (articles de loi, explications du professeur, arrêts mentionnés)..."
          className="w-full flex-1 bg-transparent resize-none text-text focus:outline-none font-serif text-base leading-relaxed custom-scrollbar"
          autoFocus
        />
        <div className="flex justify-between items-center pt-3 border-t border-border/50 text-[11px] text-text-muted font-mono">
          <span>Mode Amphi actif</span>
          <span>{content.length} caractères</span>
        </div>
      </div>
    </div>
  );
}

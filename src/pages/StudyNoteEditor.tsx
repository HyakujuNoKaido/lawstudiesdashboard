import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, FileEdit } from 'lucide-react';
import { fetchCourses, fetchNotes, saveNote } from '../services/supabaseService';

export function StudyNoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    content: '',
    course_id: ''
  });

  useEffect(() => {
    loadData();
  }, [noteId]);

  async function loadData() {
    try {
      setLoading(true);
      const coursesData = await fetchCourses();
      setCourses(coursesData);
      
      let defaultCourseId = coursesData.length > 0 ? coursesData[0].id : '';

      if (noteId) {
        // Mode Édition
        const notesData = await fetchNotes();
        const existingNote = notesData.find(n => n.id === noteId);
        if (existingNote) {
          setForm({
            title: existingNote.title || '',
            content: existingNote.content || '',
            course_id: existingNote.course_id || defaultCourseId
          });
        } else {
          alert("Note introuvable.");
          navigate('/notes');
        }
      } else {
        // Mode Création
        setForm(prev => ({ ...prev, course_id: defaultCourseId }));
      }
    } catch (err) {
      console.error("Erreur lors du chargement de l'éditeur de notes:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.course_id) {
      alert("Veuillez remplir le titre et sélectionner un cours.");
      return;
    }

    setSaving(true);
    try {
      await saveNote({
        id: noteId,
        title: form.title,
        content: form.content,
        course_id: form.course_id
      });
      navigate(-1); // Retour à la page précédente
    } catch (err) {
      console.error("Erreur sauvegarde note:", err);
      alert("Échec de l'enregistrement de la note.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Chargement de l'éditeur...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4 text-text-muted">
        <p>Vous devez d'abord créer un cours avant de pouvoir prendre des notes.</p>
        <button onClick={() => navigate('/add/course')} className="text-accent underline">Créer un cours</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 max-w-3xl mx-auto w-full text-text">
      
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <FileEdit size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">{noteId ? 'Modifier la note' : 'Nouvelle Note'}</h1>
            <p className="text-text-muted text-xs">Synthétisez vos cours et arrêts.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Titre de la note *</label>
            <input 
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ex: Résumé Chapitre 1 - Formation du contrat"
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Cours associé *</label>
            <select 
              required
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-h-[400px]">
          <label className="text-xs font-medium text-text-muted">Contenu (Markdown supporté)</label>
          <textarea 
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Saisissez vos notes ici... Utilisez des tirets pour les listes, etc."
            className="w-full h-full min-h-[400px] bg-surface-elevated border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-accent font-serif leading-relaxed resize-y"
          />
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="w-full bg-accent text-background rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
        >
          <Save size={18} />
          <span>{saving ? 'Enregistrement...' : 'Enregistrer la note'}</span>
        </button>

      </form>
    </div>
  );
}

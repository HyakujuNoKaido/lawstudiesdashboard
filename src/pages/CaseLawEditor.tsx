import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Scale, FileText, CheckCircle2 } from 'lucide-react';
import { fetchCourses, saveCaseLaw } from '../services/supabaseService';

export function CaseLawEditor() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    atf_citation: '',
    facts: '',
    procedure: '',
    consideranda: '',
    holding: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      if (data.length > 0) setForm(f => ({ ...f, course_id: data[0].id }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.atf_citation) return;

    setLoading(true);
    try {
      await saveCaseLaw(form);
      alert("Fiche d'arrêt enregistrée avec succès !");
      navigate('/courses');
    } catch (err) {
      console.error("Erreur sauvegarde fiche d'arrêt:", err);
      alert("Échec de l'enregistrement de la fiche d'arrêt.");
    } finally {
      setLoading(false);
    }
  };

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

        <div>
          <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
            <Scale className="text-accent" size={28} />
            <span>Nouvelle Fiche d'Arrêt (ATF)</span>
          </h1>
          <p className="text-text-muted text-xs">Synthèse structurée de jurisprudence du Tribunal fédéral suisse.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Intitulé de l'arrêt</label>
            <input 
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ex: ATF 143 III 416 - Protection de la personnalité"
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Référence ATF / Citation</label>
            <input 
              type="text"
              required
              value={form.atf_citation}
              onChange={(e) => setForm({ ...form, atf_citation: e.target.value })}
              placeholder="ex: ATF 143 III 416"
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Matière associée</label>
          <select 
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={16} />
            <span>1. Les Faits</span>
          </label>
          <textarea 
            rows={3}
            required
            value={form.facts}
            onChange={(e) => setForm({ ...form, facts: e.target.value })}
            placeholder="Résumé factuel du litige..."
            className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1"
          />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <Scale size={16} />
            <span>2. La Procédure</span>
          </label>
          <textarea 
            rows={3}
            required
            value={form.procedure}
            onChange={(e) => setForm({ ...form, procedure: e.target.value })}
            placeholder="Parcours procédural (instances cantonales et Tribunal fédéral)..."
            className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1"
          />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={16} />
            <span>3. Les Considérants (Erwägungen)</span>
          </label>
          <textarea 
            rows={4}
            required
            value={form.consideranda}
            onChange={(e) => setForm({ ...form, consideranda: e.target.value })}
            placeholder="Raisonnement juridique et attendus clés du Tribunal fédéral..."
            className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1"
          />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={16} />
            <span>4. La Solution / Holding</span>
          </label>
          <textarea 
            rows={3}
            required
            value={form.holding}
            onChange={(e) => setForm({ ...form, holding: e.target.value })}
            placeholder="Dispositif et principe de droit dégagé par l'arrêt..."
            className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-background rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
        >
          <Save size={18} />
          <span>{loading ? 'Enregistrement...' : "Enregistrer la Fiche d'Arrêt"}</span>
        </button>

      </form>
    </div>
  );
}

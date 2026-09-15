import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Scale, FileText, CheckCircle2, Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import { fetchCourses, saveCaseLaw } from '../services/supabaseService';
import { generateCaseLaw } from '../lib/aiService';

export function CaseLawEditor() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // NOUVEAU : Ajout de legal_issues et pedagogical_takeaway dans le state
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    atf_citation: '',
    facts: '',
    procedure: '',
    legal_issues: '',
    consideranda: '',
    holding: '',
    pedagogical_takeaway: ''
  });

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      if (data.length > 0) setForm(f => ({ ...f, course_id: data[0].id }));
    });
  }, []);

  const handleAIGeneration = async () => {
    if (!form.atf_citation) {
      alert("Veuillez d'abord entrer une référence ATF (ex: ATF 143 III 416).");
      return;
    }
    
    setGenerating(true);
    try {
      const generatedData = await generateCaseLaw(form.atf_citation);
      setForm(prev => ({
        ...prev,
        title: prev.title || generatedData.title,
        facts: generatedData.facts,
        procedure: generatedData.procedure,
        legal_issues: generatedData.legal_issues || '',
        consideranda: generatedData.consideranda,
        holding: generatedData.holding,
        pedagogical_takeaway: generatedData.pedagogical_takeaway || ''
      }));
    } catch (err) {
      alert("Erreur lors de la génération par l'IA.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.atf_citation) return;
    
    setLoading(true);
    try {
      await saveCaseLaw(form);
      navigate('/courses');
    } catch (err) {
      alert("Échec de l'enregistrement de la fiche d'arrêt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 max-w-3xl mx-auto w-full text-text">
      <header className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
            <Scale className="text-accent" size={28} />
            <span>Nouvelle Fiche d'Arrêt (ATF)</span>
          </h1>
          <p className="text-text-muted text-xs">Analyse doctrinale et structurelle de jurisprudence du Tribunal fédéral.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* --- CITATION ET IA --- */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Référence ATF / Citation *</label>
          <div className="flex gap-2">
            <input 
              type="text" required value={form.atf_citation} onChange={(e) => setForm({ ...form, atf_citation: e.target.value })}
              placeholder="ex: ATF 143 III 416"
              className="flex-1 bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent font-mono"
            />
            <button 
              type="button" 
              onClick={handleAIGeneration} disabled={generating}
              className="bg-accent/10 text-accent border border-accent/20 px-4 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={18} className={generating ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">{generating ? 'Analyse doctorale...' : 'Remplir avec l\'IA'}</span>
            </button>
          </div>
        </div>

        {/* --- MÉTA-DONNÉES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Intitulé de l'arrêt</label>
            <input 
              type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Titre de l'affaire..." className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Matière associée</label>
            <select 
              value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </div>

        {/* --- STRUCTURE DU SYLLOGISME --- */}
        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5"><FileText size={16} /><span>1. Les Faits</span></label>
          <textarea rows={4} required value={form.facts} onChange={(e) => setForm({ ...form, facts: e.target.value })} className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1 resize-y" />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5"><Scale size={16} /><span>2. La Procédure</span></label>
          <textarea rows={3} required value={form.procedure} onChange={(e) => setForm({ ...form, procedure: e.target.value })} className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1 resize-y" />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-info uppercase tracking-wider flex items-center gap-1.5"><BookOpen size={16} /><span>3. Questions de Droit</span></label>
          <textarea rows={3} value={form.legal_issues} onChange={(e) => setForm({ ...form, legal_issues: e.target.value })} className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1 resize-y" placeholder="Quelles sont les questions juridiques soulevées ?" />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border shadow-sm">
          <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 size={16} /><span>4. Les Considérants (Erwägungen)</span></label>
          <textarea rows={10} required value={form.consideranda} onChange={(e) => setForm({ ...form, consideranda: e.target.value })} className="w-full bg-surface-elevated border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-accent font-serif mt-1 leading-relaxed resize-y" placeholder="Raisonnement juridique complet du Tribunal fédéral..." />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 size={16} /><span>5. Le Dispositif</span></label>
          <textarea rows={2} required value={form.holding} onChange={(e) => setForm({ ...form, holding: e.target.value })} className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1 resize-y" />
        </div>

        {/* --- APPRENTISSAGE --- */}
        <div className="flex flex-col gap-1.5 bg-accent/5 p-4 rounded-2xl border border-accent/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
          <label className="text-xs font-bold text-accent-strong uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={16} /><span>6. Portée Doctrinale & Apprentissage</span></label>
          <textarea rows={4} value={form.pedagogical_takeaway} onChange={(e) => setForm({ ...form, pedagogical_takeaway: e.target.value })} className="w-full bg-surface-elevated border border-accent/20 rounded-xl p-4 text-sm focus:outline-none focus:border-accent font-serif mt-1 leading-relaxed resize-y" placeholder="Ce qu'il faut absolument retenir pour l'examen..." />
        </div>

        <button type="submit" disabled={loading} className="mt-4 w-full bg-accent text-background rounded-xl py-4 px-4 flex items-center justify-center gap-2 font-bold glow-gold hover:bg-accent-strong transition-colors cursor-pointer">
          <Save size={18} />
          <span>{loading ? 'Enregistrement de l\'arrêt...' : "Enregistrer la Fiche d'Arrêt"}</span>
        </button>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Scale, FileText, CheckCircle2, Sparkles, BookOpen, AlertTriangle } from 'lucide-react';
import { fetchCourses, saveCaseLaw, getCurrentUserId } from '../services/supabaseService';
import { generateCaseLaw } from '../lib/aiService';
import { toast } from '../lib/toast';

export function CaseLawEditor() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
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
      toast("Veuillez d'abord entrer une référence ATF (ex: ATF 143 III 416).", "warning");
      return;
    }
    setGenerating(true);
    toast("Analyse doctorale par l'IA en cours...", "info");
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
      toast("Analyse générée avec succès.", "success");
    } catch (err) {
      toast("Erreur lors de la génération par l'IA.", "error");
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
      toast("Fiche d'arrêt enregistrée", "success");
      navigate('/library');
    } catch (err) {
      toast("Échec de l'enregistrement.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 animate-in fade-in duration-300 max-w-3xl mx-auto w-full text-text px-2">
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

      {/* POINT 17 : AVERTISSEMENT JURIDIQUE OFFICIEL */}
      <div className="bg-warning/10 border border-warning/30 rounded-card p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted leading-relaxed">
          <strong className="text-warning font-bold">Rappel méthodologique :</strong> Les synthèses générées par l'IA doivent impérativement être vérifiées au regard du texte officiel de l'arrêt (ATF) et des considérants publiés au recueil officiel.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Référence ATF / Citation *</label>
          <div className="flex gap-2">
            <input 
              type="text" required value={form.atf_citation} onChange={(e) => setForm({ ...form, atf_citation: e.target.value })}
              placeholder="ex: ATF 143 III 416"
              className="flex-1 bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent font-mono"
            />
            <button 
              type="button" onClick={handleAIGeneration} disabled={generating}
              className="bg-accent/15 text-accent border border-accent/30 px-5 rounded-btn flex items-center gap-2 text-sm font-bold hover:bg-accent/25 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={18} className={generating ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">{generating ? 'Analyse...' : 'Remplir avec l\'IA'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Intitulé de l'arrêt</label>
            <input 
              type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Titre de l'affaire..." className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Matière associée</label>
            <select 
              value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent appearance-none cursor-pointer"
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-5 rounded-card border border-border/60">
          <label className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1.5"><FileText size={14} /> 1. Les Faits (Sachverhalt)</label>
          <textarea rows={4} required value={form.facts} onChange={(e) => setForm({ ...form, facts: e.target.value })} className="w-full bg-surface-elevated border border-border/50 rounded-input p-3.5 text-sm focus:border-accent font-serif mt-1 resize-y" />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-5 rounded-card border border-border/60">
          <label className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1.5"><Scale size={14} /> 2. La Procédure</label>
          <textarea rows={3} required value={form.procedure} onChange={(e) => setForm({ ...form, procedure: e.target.value })} className="w-full bg-surface-elevated border border-border/50 rounded-input p-3.5 text-sm focus:border-accent font-serif mt-1 resize-y" />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-5 rounded-card border border-border/60">
          <label className="text-[10px] uppercase font-bold text-info tracking-wider flex items-center gap-1.5"><BookOpen size={14} /> 3. Questions de Droit</label>
          <textarea rows={3} value={form.legal_issues} onChange={(e) => setForm({ ...form, legal_issues: e.target.value })} className="w-full bg-surface-elevated border border-border/50 rounded-input p-3.5 text-sm focus:border-accent font-serif mt-1 resize-y" placeholder="Problématiques juridiques..." />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-5 rounded-card border border-border/60 shadow-sm">
          <label className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1.5"><CheckCircle2 size={14} /> 4. Les Considérants (Erwägungen)</label>
          <textarea rows={8} required value={form.consideranda} onChange={(e) => setForm({ ...form, consideranda: e.target.value })} className="w-full bg-surface-elevated border border-border/50 rounded-input p-4 text-sm focus:border-accent font-serif mt-1 leading-relaxed resize-y" placeholder="Raisonnement juridique complet..." />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-5 rounded-card border border-border/60">
          <label className="text-[10px] uppercase font-bold text-success tracking-wider flex items-center gap-1.5"><CheckCircle2 size={14} /> 5. Le Dispositif</label>
          <textarea rows={2} required value={form.holding} onChange={(e) => setForm({ ...form, holding: e.target.value })} className="w-full bg-surface-elevated border border-border/50 rounded-input p-3.5 text-sm focus:border-accent font-serif mt-1 resize-y" />
        </div>

        <div className="flex flex-col gap-1.5 bg-accent/5 p-5 rounded-card border border-accent/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
          <label className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1.5"><Sparkles size={14} /> 6. Portée Doctrinale & Apprentissage</label>
          <textarea rows={4} value={form.pedagogical_takeaway} onChange={(e) => setForm({ ...form, pedagogical_takeaway: e.target.value })} className="w-full bg-surface-elevated border border-accent/20 rounded-input p-4 text-sm focus:border-accent font-serif mt-1 leading-relaxed resize-y" placeholder="Ce qu'il faut absolument retenir pour l'examen..." />
        </div>

        <button type="submit" disabled={loading} className="mt-4 w-full bg-accent text-background rounded-btn py-4 px-4 flex items-center justify-center gap-2 font-bold glow-gold hover:bg-accent-strong transition-all cursor-pointer shadow-apple">
          <Save size={18} />
          <span>{loading ? "Enregistrement..." : "Enregistrer la Fiche d'Arrêt"}</span>
        </button>
      </form>
    </div>
  );
}

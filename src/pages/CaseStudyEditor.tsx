import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Scale, FileText, CheckCircle2, Sparkles, BookOpen, AlertTriangle } from 'lucide-react';
import { fetchCourses, saveCaseStudy, getCurrentUserId } from '../services/supabaseService';
import { generateSubsumption } from '../lib/aiService';
import { toast } from '../lib/toast';

export function CaseStudyEditor() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    legal_issue: '',
    major_premise: '',
    minor_premise: '',
    conclusion: ''
  });

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      if (data.length > 0) setForm(f => ({ ...f, course_id: data[0].id }));
    });
  }, []);

  const handleAIGeneration = async () => {
    if (!form.title) {
      toast("Veuillez d'abord donner un titre ou un résumé des faits au cas pratique.", "warning");
      return;
    }
    setGenerating(true);
    toast("Subsomption et analyse par l'IA en cours...", "info");
    try {
      const generatedData = await generateSubsumption(form.title);
      setForm(prev => ({
        ...prev,
        legal_issue: generatedData.legal_issue,
        major_premise: generatedData.major_premise,
        minor_premise: generatedData.minor_premise,
        conclusion: generatedData.conclusion
      }));
      toast("Raisonnement syllogistique généré avec succès.", "success");
    } catch (err) {
      toast("Erreur lors de la génération par l'IA.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.legal_issue) return;
    setLoading(true);
    try {
      await saveCaseStudy(form);
      toast("Cas pratique enregistré avec succès", "success");
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
            <BookOpen className="text-accent" size={28} />
            <span>Résolution de Cas Pratique (Subsomption)</span>
          </h1>
          <p className="text-text-muted text-xs">Structure méthodologique du syllogisme juridique pour les examens.</p>
        </div>
      </header>

      {/* AVERTISSEMENT JURIDIQUE OFFICIEL POUR L'IA */}
      <div className="bg-warning/10 border border-warning/30 rounded-card p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted leading-relaxed">
          <strong className="text-warning font-bold">Avertissement méthodologique :</strong> L'application de la règle de droit aux faits (subsomption) générée par l'IA doit être rigoureusement contrôlée au regard des articles de loi et de la doctrine applicables.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Intitulé du cas / Faits résumés *</label>
            <input 
              type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ex: Responsabilité du maître d'ouvrage..." 
              className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Matière / Cours associé</label>
            <select 
              value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="w-full bg-surface border border-border rounded-input py-3 px-3.5 text-sm focus:border-accent appearance-none cursor-pointer"
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="button" onClick={handleAIGeneration} disabled={generating}
            className="bg-accent/15 text-accent border border-accent/30 px-5 py-2.5 rounded-btn flex items-center gap-2 text-sm font-bold hover:bg-accent/25 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={18} className={generating ? "animate-pulse" : ""} />
            <span>{generating ? 'Génération du syllogisme...' : 'Générer le syllogisme avec l\'IA'}</span>
          </button>
        </div>

        {/* 1. QUESTION JURIDIQUE */}
        <div className="flex flex-col gap-1.5 bg-surface p-5 rounded-card border border-border/60">
          <label className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1.5">
            <Scale size={14} /> 1. Problématique / Question juridique (Rechtsfrage)
          </label>
          <textarea 
            rows={3} required value={form.legal_issue} onChange={(e) => setForm({ ...form, legal_issue: e.target.value })} 
            placeholder="De savoir si le recourant peut prétendre à..."
            className="w-full bg-surface-elevated border border-border/50 rounded-input p-3.5 text-sm focus:border-accent font-serif mt-1 resize-y" 
          />
        </div>

        {/* 2. PRÉMISSE MAJEURE */}
        <div className="flex flex-col gap-1.5 bg-surface p-5 rounded-card border border-border/60">
          <label className="text-[10px] uppercase font-bold text-info tracking-wider flex items-center gap-1.5">
            <FileText size={14} /> 2. Prémisse majeure : Base légale & conditions (Obersatz)
          </label>
          <textarea 
            rows={5} required value={form.major_premise} onChange={(e) => setForm({ ...form, major_premise: e.target.value })} 
            placeholder="Selon l'art. 41 al. 1 CO, celui qui cause un dommage de manière illicite..."
            className="w-full bg-surface-elevated border border-border/50 rounded-input p-3.5 text-sm focus:border-accent font-serif mt-1 resize-y" 
          />
        </div>

        {/* 3. PRÉMISSE MINEURE (SUBSOMPTION) */}
        <div className="flex flex-col gap-1.5 bg-surface p-5 rounded-card border border-border/60 shadow-sm">
          <label className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={14} /> 3. Prémisse mineure : Subsomption (Subsumtion)
          </label>
          <textarea 
            rows={6} required value={form.minor_premise} onChange={(e) => setForm({ ...form, minor_premise: e.target.value })} 
            placeholder="Application des conditions légales aux faits précis du cas d'espèce..."
            className="w-full bg-surface-elevated border border-border/50 rounded-input p-4 text-sm focus:border-accent font-serif mt-1 leading-relaxed resize-y" 
          />
        </div>

        {/* 4. CONCLUSION */}
        <div className="flex flex-col gap-1.5 bg-accent/5 p-5 rounded-card border border-accent/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
          <label className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={14} /> 4. Conclusion (Schlussfolgerung)
          </label>
          <textarea 
            rows={3} required value={form.conclusion} onChange={(e) => setForm({ ...form, conclusion: e.target.value })} 
            placeholder="En conclusion, l'action doit être admise / rejetée..."
            className="w-full bg-surface-elevated border border-accent/20 rounded-input p-4 text-sm focus:border-accent font-serif mt-1 leading-relaxed resize-y" 
          />
        </div>

        <button 
          type="submit" disabled={loading} 
          className="mt-4 w-full bg-accent text-background rounded-btn py-4 px-4 flex items-center justify-center gap-2 font-bold glow-gold hover:bg-accent-strong transition-all cursor-pointer shadow-apple"
        >
          <Save size={18} />
          <span>{loading ? "Enregistrement..." : "Enregistrer le cas pratique"}</span>
        </button>
      </form>
    </div>
  );
}

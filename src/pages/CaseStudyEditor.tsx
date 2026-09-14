import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Scale, FileText, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { fetchCourses, saveCaseStudy } from '../services/supabaseService';
import { generateSubsumption } from '../lib/aiService';

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
  
  // Champ séparé pour nourrir l'IA
  const [facts, setFacts] = useState('');

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      if (data.length > 0) setForm(f => ({ ...f, course_id: data[0].id }));
    });
  }, []);

  const handleAIGeneration = async () => {
    if (!facts.trim()) {
      alert("Veuillez décrire les faits de l'espèce avant d'utiliser l'IA.");
      return;
    }
    setGenerating(true);
    try {
      const generatedData = await generateSubsumption(facts);
      setForm(prev => ({
        ...prev,
        legal_issue: generatedData.legal_issue || prev.legal_issue,
        major_premise: generatedData.major_premise,
        minor_premise: generatedData.minor_premise,
        conclusion: generatedData.conclusion
      }));
    } catch (err) {
      alert("Erreur lors de la génération de la subsumption.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.course_id) return;
    setLoading(true);
    try {
      await saveCaseStudy(form);
      navigate('/courses');
    } catch (err) {
      alert("Échec de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 max-w-3xl mx-auto w-full text-text px-2">
      <header className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
            <Scale className="text-accent" size={28} />
            <span>Assistant de Subsumption</span>
          </h1>
          <p className="text-text-muted text-xs">Syllogisme juridique et résolution de cas pratiques.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Titre du cas pratique *</label>
            <input 
              type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ex: Cas de responsabilité civile (Vitrine brisée)" 
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Matière *</label>
            <select 
              value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:border-accent appearance-none"
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </div>

        {/* Section Génération IA */}
        <div className="bg-accent/5 border border-accent/20 p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={16} /> Énoncé / Faits de l'espèce
            </label>
            <button 
              type="button" onClick={handleAIGeneration} disabled={generating}
              className="bg-accent text-background px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold glow-gold hover:bg-accent-strong transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={16} className={generating ? "animate-pulse" : ""} />
              {generating ? 'Analyse...' : 'Résoudre avec l\'IA'}
            </button>
          </div>
          <textarea 
            rows={4} value={facts} onChange={(e) => setFacts(e.target.value)} 
            placeholder="Copiez-collez les faits du cas pratique ici pour que l'IA rédige la subsumption..."
            className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:border-accent font-serif resize-y"
          />
        </div>

        {/* Champs du Syllogisme */}
        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><BookOpen size={16} /> Question de droit</label>
          <input type="text" value={form.legal_issue} onChange={(e) => setForm({ ...form, legal_issue: e.target.value })} placeholder="Quelle est la question juridique à résoudre ?" className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:border-accent font-serif" />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-info uppercase tracking-wider flex items-center gap-1.5"><Scale size={16} /> Majeure (Règle de droit)</label>
          <textarea rows={3} value={form.major_premise} onChange={(e) => setForm({ ...form, major_premise: e.target.value })} placeholder="L'art. X dispose que..." className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:border-accent font-serif" />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-warning uppercase tracking-wider flex items-center gap-1.5"><Scale size={16} /> Mineure (Application aux faits)</label>
          <textarea rows={3} value={form.minor_premise} onChange={(e) => setForm({ ...form, minor_premise: e.target.value })} placeholder="En l'espèce, les faits montrent que..." className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:border-accent font-serif" />
        </div>

        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 size={16} /> Conclusion</label>
          <textarea rows={2} value={form.conclusion} onChange={(e) => setForm({ ...form, conclusion: e.target.value })} placeholder="Par conséquent..." className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:border-accent font-serif" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-surface-elevated border border-border text-text rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold hover:bg-surface transition-colors cursor-pointer">
          <Save size={18} /> {loading ? 'Enregistrement...' : "Sauvegarder la résolution"}
        </button>
      </form>
    </div>
  );
}

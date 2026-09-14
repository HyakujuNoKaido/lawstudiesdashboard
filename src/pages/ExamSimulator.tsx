import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Timer, Sparkles, AlertCircle, FileEdit } from 'lucide-react';
import { fetchCourses, saveExamSimulation } from '../services/supabaseService';
import { generateMockExam } from '../lib/aiService';

export function ExamSimulator() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [isExamStarted, setIsExamStarted] = useState(false);
  
  // Timer
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [form, setForm] = useState({
    course_id: '',
    title: '',
    facts: '',        // L'énoncé (généré par IA)
    legal_issue: '',  // La question (générée par IA)
    major_premise: '', // Saisi par l'étudiant
    minor_premise: '', // Saisi par l'étudiant
    conclusion: ''     // Saisi par l'étudiant
  });

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      if (data.length > 0) setForm(f => ({ ...f, course_id: data[0].id }));
    });
  }, []);

  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleGenerateExam = async () => {
    if (!topic.trim()) {
      alert("Veuillez indiquer un thème de révision.");
      return;
    }
    setGenerating(true);
    try {
      const generated = await generateMockExam(topic);
      setForm(prev => ({
        ...prev,
        title: `Examen blanc : ${topic}`,
        facts: generated.facts,
        legal_issue: generated.legal_issue
      }));
      setIsExamStarted(true);
      setTimerActive(true);
    } catch (err) {
      alert("Erreur de génération.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setTimerActive(false);
    try {
      await saveExamSimulation({
        ...form,
        time_spent_seconds: timeSpent
      });
      alert("Copie rendue et sauvegardée !");
      navigate('/courses');
    } catch (err) {
      alert("Erreur lors de la sauvegarde.");
      setTimerActive(true);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const wordCount = (form.major_premise + form.minor_premise + form.conclusion)
    .trim().split(/\s+/).filter(w => w.length > 0).length;

  if (!isExamStarted) {
    return (
      <div className="flex flex-col items-center justify-center pt-10 pb-16 px-4 animate-in fade-in duration-300 max-w-lg mx-auto w-full text-text text-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-info/10 text-info flex items-center justify-center">
          <Timer size={32} />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold mb-2">Générateur d'Examen Blanc</h1>
          <p className="text-sm text-text-muted">L'IA rédige un cas pratique inédit sur le thème de votre choix. Résolvez-le en conditions réelles.</p>
        </div>
        
        <div className="w-full flex flex-col gap-4 bg-surface border border-border p-6 rounded-3xl text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Matière ciblée</label>
            <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-3 text-sm focus:border-accent appearance-none">
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Thème de révision</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="ex: Les vices du consentement (Erreur, Dol)" className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-3 text-sm focus:border-accent" />
          </div>
          
          <button onClick={handleGenerateExam} disabled={generating} className="mt-2 w-full bg-accent text-background rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-bold glow-gold hover:bg-accent-strong cursor-pointer disabled:opacity-50">
            <Sparkles size={18} className={generating ? "animate-pulse" : ""} />
            {generating ? 'Génération du sujet...' : 'Créer le sujet et démarrer le chrono'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 animate-in fade-in duration-300 max-w-4xl mx-auto w-full text-text">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pb-4 pt-2 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">{form.title}</h1>
          <div className="flex items-center gap-3 text-xs text-text-muted mt-1 font-mono">
            <span className="flex items-center gap-1 text-accent"><Timer size={14}/> {formatTime(timeSpent)}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><FileEdit size={14}/> {wordCount} mots rédigés</span>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="bg-success text-background px-5 py-2.5 rounded-xl font-bold hover:bg-success/90 transition-colors cursor-pointer">
          {loading ? 'Envoi...' : 'Rendre la copie'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Colonne Énoncé */}
        <div className="bg-surface-elevated border border-border p-6 rounded-2xl flex flex-col gap-4 sticky top-28">
          <div className="flex items-center gap-2 text-info">
            <AlertCircle size={18} />
            <h2 className="font-bold uppercase tracking-wider text-xs">Énoncé de l'examen</h2>
          </div>
          <p className="font-serif text-sm leading-relaxed whitespace-pre-wrap">{form.facts}</p>
          <div className="mt-4 pt-4 border-t border-border">
            <span className="text-xs font-bold text-text-muted uppercase">Travail demandé :</span>
            <p className="text-sm font-medium mt-1">{form.legal_issue}</p>
          </div>
        </div>

        {/* Colonne Rédaction */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-muted uppercase">Majeure (Règle de droit)</label>
            <textarea rows={6} value={form.major_premise} onChange={(e) => setForm({ ...form, major_premise: e.target.value })} placeholder="Développez la règle de droit applicable..." className="w-full bg-surface border border-border rounded-xl p-4 text-sm focus:border-accent font-serif resize-y" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-muted uppercase">Mineure (Subsumption)</label>
            <textarea rows={6} value={form.minor_premise} onChange={(e) => setForm({ ...form, minor_premise: e.target.value })} placeholder="Appliquez la règle aux faits de l'énoncé..." className="w-full bg-surface border border-border rounded-xl p-4 text-sm focus:border-accent font-serif resize-y" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-muted uppercase">Conclusion</label>
            <textarea rows={3} value={form.conclusion} onChange={(e) => setForm({ ...form, conclusion: e.target.value })} placeholder="Concluez clairement..." className="w-full bg-surface border border-border rounded-xl p-4 text-sm focus:border-accent font-serif resize-y" />
          </div>
        </div>
      </div>
    </div>
  );
}

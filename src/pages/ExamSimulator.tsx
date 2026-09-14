import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Pause, RotateCcw, Save, Timer, BookOpen } from 'lucide-react';
import { fetchCourses, saveExamSimulation } from '../services/supabaseService';

export function ExamSimulator() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [facts, setFacts] = useState('');
  const [legalIssue, setLegalIssue] = useState('');
  const [majorPremise, setMajorPremise] = useState('');
  const [minorPremise, setMinorPremise] = useState('');
  const [conclusion, setConclusion] = useState('');

  // Chronomètre (défaut : 2 heures = 7200 secondes)
  const [timeLeft, setTimeLeft] = useState(7200);
  const [isRunning, setIsRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      if (data.length > 0) setSelectedCourse(data[0].id);
    });
  }, []);

  useEffect(() => {
    let timer: any;
    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            alert("Temps écoulé pour cet examen blanc !");
            return 0;
          }
          return prev - 1;
        });
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalWords = (facts + legalIssue + majorPremise + minorPremise + conclusion)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const handleSave = async () => {
    if (!title || !selectedCourse) {
      alert("Veuillez renseigner le titre et la matière.");
      return;
    }
    try {
      await saveExamSimulation({
        course_id: selectedCourse,
        title,
        facts,
        legal_issue: legalIssue,
        major_premise: majorPremise,
        minor_premise: minorPremise,
        conclusion,
        time_spent_seconds: timeSpent
      });
      alert("Examen blanc enregistré avec succès !");
      navigate('/courses');
    } catch (err) {
      console.error("Erreur enregistrement examen blanc:", err);
      alert("Échec de l'enregistrement.");
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 max-w-4xl mx-auto w-full text-text">
      
      {/* En-tête avec Timer et Compteur de mots */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-text-muted hover:text-text transition-colors rounded-xl bg-surface-elevated cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-serif text-xl font-bold">Simulateur d'Examen Blanc</h1>
            <p className="text-text-muted text-xs">Conditions réelles de rédaction juridique suisse.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-elevated px-4 py-2 rounded-xl border border-border">
            <Timer size={18} className="text-accent" />
            <span className="font-mono font-bold text-lg text-accent">{formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsRunning(!isRunning)}
              className={`p-2.5 rounded-xl text-background font-semibold flex items-center gap-1.5 cursor-pointer ${
                isRunning ? 'bg-warning hover:opacity-90' : 'bg-accent glow-gold hover:bg-accent-strong'
              }`}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              <span className="text-xs">{isRunning ? 'Pause' : 'Démarrer'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Barre d'infos rapides */}
      <div className="flex justify-between items-center px-1 text-xs text-text-muted">
        <span>Mots rédigés : <strong className="text-text">{totalWords} mots</strong></span>
        <span>Temps écoulé : <strong className="text-text">{formatTime(timeSpent)}</strong></span>
      </div>

      {/* Formulaire de rédaction */}
      <div className="flex flex-col gap-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Intitulé de l'épreuve</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Examen Final Droit des Obligations - Janvier 2026"
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Matière</label>
            <select 
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-text uppercase tracking-wider">1. Faits de l'espèce</label>
          <textarea 
            rows={4}
            value={facts}
            onChange={(e) => setFacts(e.target.value)}
            placeholder="Énoncez les faits pertinents du cas d'examen..."
            className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-accent uppercase tracking-wider">2. Problème juridique</label>
          <textarea 
            rows={3}
            value={legalIssue}
            onChange={(e) => setLegalIssue(e.target.value)}
            placeholder="Quelle est la question de droit soulevée ?"
            className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-accent uppercase tracking-wider">3. Majeure (Base légale)</label>
          <textarea 
            rows={5}
            value={majorPremise}
            onChange={(e) => setMajorPremise(e.target.value)}
            placeholder="Règles de droit applicables et conditions..."
            className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-accent uppercase tracking-wider">4. Mineure (Application)</label>
          <textarea 
            rows={5}
            value={minorPremise}
            onChange={(e) => setMinorPremise(e.target.value)}
            placeholder="Subsumption des faits sous la norme..."
            className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-success uppercase tracking-wider">5. Conclusion</label>
          <textarea 
            rows={3}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            placeholder="Conséquence juridique finale..."
            className="w-full bg-surface border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif"
          />
        </div>

        <button 
          onClick={handleSave}
          className="mt-4 w-full bg-accent text-background rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
        >
          <Save size={18} />
          <span>Soumettre et enregistrer l'examen blanc</span>
        </button>

      </div>
    </div>
  );
}

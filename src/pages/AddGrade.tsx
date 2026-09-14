import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Calculator, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { fetchCourses, createGrade } from '../services/supabaseService';

export function AddGrade() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState('');
  const [grade, setGrade] = useState('');
  const [weight, setWeight] = useState(100);
  const [evalType, setEvalType] = useState('Examen final (1ère tentative)');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      if (data.length > 0) setCourseId(data[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !grade) return;

    setLoading(true);
    try {
      await createGrade({
        course_id: courseId,
        grade: parseFloat(grade),
        weight: Number(weight),
        eval_type: evalType
      });
      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error("Erreur enregistrement note:", error);
      alert("Échec de l'enregistrement de la note.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Annuler</span>
        </button>

        <div>
          <h1 className="font-serif text-3xl mb-1">Saisir une note</h1>
          <p className="text-text-muted text-sm">Ajoutez un résultat d'examen ou un contrôle continu.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">Cours / Matière</label>
          <select 
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.ects} ECTS)</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Note obtenue</label>
            <input 
              type="number" 
              step="0.25"
              min="1.0"
              max="6.0"
              placeholder="ex: 4.5"
              required
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Poids (%)</label>
            <input 
              type="number" 
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              min="0"
              max="100"
              className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">Type d'évaluation</label>
          <select 
            value={evalType}
            onChange={(e) => setEvalType(e.target.value)}
            className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none"
          >
            <option value="Examen final (1ère tentative)">Examen final (1ère tentative)</option>
            <option value="Examen final (Rattrapage)">Examen final (Rattrapage)</option>
            <option value="Contrôle continu">Contrôle continu</option>
            <option value="Travail écrit / Séminaire">Travail écrit / Séminaire</option>
          </select>
        </div>

        <Card className="mt-2 border-info/20 bg-info/5">
          <div className="flex items-center gap-2 text-info mb-3">
            <Calculator size={18} />
            <h3 className="font-medium text-sm">Simulateur d'impact</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-text-muted">Note saisie</span>
              <span className="font-medium">{grade || '--'}</span>
            </div>
            <div className="text-text-muted">→</div>
            <div className="flex flex-col text-right">
              <span className="text-xs text-text-muted">Validation (Seuil : 4.0)</span>
              <span className={`font-medium ${grade && parseFloat(grade) >= 4.0 ? 'text-success' : grade ? 'text-danger' : 'text-text'}`}>
                {grade ? (parseFloat(grade) >= 4.0 ? 'Validé' : 'Non validé') : '--'}
              </span>
            </div>
          </div>
        </Card>

        <button 
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-accent text-background rounded-md py-3.5 px-4 flex items-center justify-center gap-2 font-medium hover:bg-accent-strong transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          <span>{loading ? 'Enregistrement...' : 'Enregistrer la note'}</span>
        </button>

      </form>
    </div>
  );
}

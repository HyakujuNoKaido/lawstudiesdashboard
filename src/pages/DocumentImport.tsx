import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ChevronLeft, CheckCircle2, FileSearch, Trash2 } from 'lucide-react';
import { createMultipleCourses } from '../services/supabaseService';
import { toast } from '../lib/toast';

export function DocumentImport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [extractedCourses, setExtractedCourses] = useState<any[]>([]);
  const [importCompleted, setImportCompleted] = useState(false);
  const [syllabusText, setSyllabusText] = useState('');

  const handleExtractFromText = () => {
    if (!syllabusText.trim()) {
      toast("Veuillez coller le texte de votre plan d'études.", 'error');
      return;
    }
    setLoading(true);
    
    setTimeout(() => {
      const lines = syllabusText.split('\n');
      const foundCourses: any[] = [];
      const ectsRegex = /(\d+(?:\.\d+)?)\s*(?:crédits?\s*)?ects/i;
      
      lines.forEach(line => {
        const ectsMatch = line.match(ectsRegex);
        if (ectsMatch || /(droit|introduction|procédure|histoire|philosophie|économie)/i.test(line)) {
          let title = line.replace(ectsRegex, '').replace(/[\d\.\-\_]+/, '').trim();
          if (title.length > 5 && title.length < 100) {
            const codeMatch = line.match(/[A-Z]{2,4}[- ]?\d{2,4}/);
            const courseCode = codeMatch ? codeMatch[0] : '';
            const ects = ectsMatch ? parseFloat(ectsMatch[1]) : 6;
            foundCourses.push({
              title: title,
              course_code: courseCode,
              ects: Math.round(ects),
              semester: 'Automne 2026'
            });
          }
        }
      });
      
      const uniqueCourses = foundCourses.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);
      setExtractedCourses(uniqueCourses);
      toast(`${uniqueCourses.length} matières détectées.`, 'success');
      setLoading(false);
    }, 1000); 
  };

  const handleUpdateCourse = (index: number, field: string, value: string | number) => {
    const updated = [...extractedCourses];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedCourses(updated);
  };

  const handleRemoveCourse = (index: number) => {
    const updated = extractedCourses.filter((_, i) => i !== index);
    setExtractedCourses(updated);
  };

  const handleConfirmImport = async () => {
    if (extractedCourses.length === 0) return;
    setLoading(true);
    try {
      await createMultipleCourses(extractedCourses);
      toast("Plan d'études importé avec succès !", "success");
      setImportCompleted(true);
    } catch (err) {
      console.error(err);
      toast("Erreur lors de la création des cours.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (importCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center animate-in fade-in duration-300 text-text max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-success/10 border border-success/20 flex items-center justify-center text-success mb-2">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-serif text-2xl font-bold">Importation réussie</h1>
        <p className="text-text-muted text-xs">{extractedCourses.length} cours ont été créés dans votre tableau de bord.</p>
        <button 
          onClick={() => navigate('/courses')}
          className="mt-4 w-full bg-accent text-background py-3.5 rounded-xl font-bold glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
        >
          Voir mon plan d'études
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 max-w-2xl mx-auto w-full text-text px-2">
      <header className="flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
            <Upload size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">Importation de plan d'études</h1>
            <p className="text-text-muted text-xs">Extraction automatique des modules depuis votre PDF.</p>
          </div>
        </div>
      </header>

      {extractedCourses.length === 0 ? (
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-accent mb-2 flex items-center gap-2">
              <FileSearch size={16} /> Copier le texte du PDF
            </h2>
            <p className="text-xs text-text-muted mb-4">
              Ouvrez votre plan d'études, copiez le texte brut contenant les matières et les ECTS, puis collez-le ci-dessous.
            </p>
            <textarea 
              rows={8}
              value={syllabusText}
              onChange={e => setSyllabusText(e.target.value)}
              placeholder="Droit des obligations I 6 ECTS&#10;Introduction au droit 4.5 ECTS..."
              className="w-full bg-surface-elevated border border-border rounded-xl p-4 text-xs focus:border-accent resize-y font-mono mb-4"
            />
            <button 
              onClick={handleExtractFromText}
              disabled={loading}
              className="w-full bg-surface-elevated border border-border text-text font-bold py-3.5 rounded-xl hover:border-accent/50 transition-colors cursor-pointer"
            >
              {loading ? 'Analyse en cours...' : 'Détecter les cours'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4">
          <div>
            <h2 className="font-serif text-xl font-bold">{extractedCourses.length} cours détectés</h2>
            <p className="text-xs text-text-muted">Éditez les titres, ajustez les ECTS ou supprimez les erreurs de lecture.</p>
          </div>
          
          <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2">
            {extractedCourses.map((course, idx) => (
              <div key={idx} className="bg-surface border border-border rounded-xl p-3 flex flex-col md:flex-row gap-3 items-start md:items-center relative group">
                <input 
                  type="text" 
                  value={course.title}
                  onChange={(e) => handleUpdateCourse(idx, 'title', e.target.value)}
                  className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm focus:border-accent min-w-0 w-full"
                />
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input 
                    type="text" 
                    value={course.course_code}
                    placeholder="Code"
                    onChange={(e) => handleUpdateCourse(idx, 'course_code', e.target.value)}
                    className="w-20 bg-surface-elevated border border-border rounded-lg px-2 py-2 text-xs font-mono focus:border-accent"
                  />
                  <div className="flex items-center gap-1 bg-surface-elevated border border-border rounded-lg px-2">
                    <input 
                      type="number" 
                      value={course.ects}
                      onChange={(e) => handleUpdateCourse(idx, 'ects', Number(e.target.value))}
                      className="w-12 bg-transparent py-2 text-xs text-right font-mono focus:outline-none"
                    />
                    <span className="text-[10px] font-bold text-text-muted pr-1">ECTS</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveCourse(idx)}
                    className="p-2 text-text-muted hover:bg-danger/10 hover:text-danger rounded-lg transition-colors ml-auto md:ml-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3 mt-4 pt-4 border-t border-border">
            <button 
              onClick={() => setExtractedCourses([])}
              className="flex-1 bg-surface border border-border py-3.5 rounded-xl text-sm font-medium hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button 
              onClick={handleConfirmImport}
              disabled={loading || extractedCourses.length === 0}
              className="flex-[2] bg-accent text-background py-3.5 rounded-xl text-sm font-bold glow-gold hover:bg-accent-strong transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Valider et créer le plan d\'études'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

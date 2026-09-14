import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ChevronLeft, CheckCircle2, FileSearch } from 'lucide-react';
import { createMultipleCourses } from '../services/supabaseService';

export function DocumentImport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [extractedCourses, setExtractedCourses] = useState<any[]>([]);
  const [importCompleted, setImportCompleted] = useState(false);
  const [syllabusText, setSyllabusText] = useState('');

  // L'algorithme intelligent d'extraction (Remplace l'ancien Mock)
  const handleExtractFromText = () => {
    if (!syllabusText.trim()) {
      alert("Veuillez coller le texte de votre plan d'études.");
      return;
    }
    setLoading(true);

    setTimeout(() => {
      const lines = syllabusText.split('\n');
      const foundCourses: any[] = [];
      
      // Regex pour repérer les lignes contenant un chiffre suivi de ECTS (ex: "6 ECTS", "Crédits: 4.5")
      const ectsRegex = /(\d+(?:\.\d+)?)\s*(?:crédits?\s*)?ects/i;
      
      lines.forEach(line => {
        const ectsMatch = line.match(ectsRegex);
        
        // Si la ligne contient "Droit", "Introduction", "Procédure" ou un ECTS, on tente de l'extraire
        if (ectsMatch || /(droit|introduction|procédure|histoire|philosophie|économie)/i.test(line)) {
          
          let title = line.replace(ectsRegex, '').replace(/[\d\.\-\_]+/, '').trim(); // Nettoie les chiffres et ECTS
          if (title.length > 5 && title.length < 100) {
            
            // Cherche un code de cours genre "DR-301" ou "DROIT 1"
            const codeMatch = line.match(/[A-Z]{2,4}[- ]?\d{2,4}/);
            const courseCode = codeMatch ? codeMatch[0] : '';
            
            // S'il n'y a pas d'ECTS explicite, on met 6 par défaut
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

      // Déduplication par titre
      const uniqueCourses = foundCourses.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);
      
      setExtractedCourses(uniqueCourses);
      setLoading(false);
    }, 1000); // Faux délai pour l'UX
  };

  const handleConfirmImport = async () => {
    if (extractedCourses.length === 0) return;
    setLoading(true);
    try {
      await createMultipleCourses(extractedCourses);
      setImportCompleted(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création des cours dans la base.");
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
          Voir mes cours
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
          <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
            <Upload size={20} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">Importation Intelligente</h1>
            <p className="text-text-muted text-xs">Extraction automatique des cours depuis votre plan d'études.</p>
          </div>
        </div>
      </header>

      {extractedCourses.length === 0 ? (
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-accent mb-2 flex items-center gap-2">
              <FileSearch size={16} /> Scanner le plan d'études
            </h2>
            <p className="text-xs text-text-muted mb-4">
              Ouvrez le PDF de votre plan d'études universitaire (UNIL, UNIGE, etc.), copiez tout le texte et collez-le ici. Lexi détectera automatiquement vos matières et crédits ECTS.
            </p>
            
            <textarea 
              rows={8}
              value={syllabusText}
              onChange={e => setSyllabusText(e.target.value)}
              placeholder="Collez le texte du PDF de votre plan d'études ici..."
              className="w-full bg-surface-elevated border border-border rounded-xl p-4 text-xs focus:border-accent resize-y font-mono mb-4"
            />

            <button 
              onClick={handleExtractFromText}
              disabled={loading}
              className="w-full bg-surface-elevated border border-border text-text font-bold py-3.5 rounded-xl hover:border-accent/50 transition-colors cursor-pointer"
            >
              {loading ? 'Analyse en cours...' : 'Extraire les cours'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4">
          <h2 className="font-serif text-xl font-bold">{extractedCourses.length} cours détectés</h2>
          <p className="text-xs text-text-muted">Vérifiez les cours extraits. Vous pourrez toujours les modifier plus tard.</p>
          
          <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col divide-y divide-border/50 max-h-[400px] overflow-y-auto shadow-sm">
            {extractedCourses.map((course, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-surface-elevated transition-colors">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{course.title}</span>
                  <span className="text-xs text-text-muted font-mono">{course.course_code || 'Code inconnu'}</span>
                </div>
                <span className="text-xs font-bold bg-background px-2 py-1 rounded-md">{course.ects} ECTS</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              onClick={() => setExtractedCourses([])}
              className="flex-1 bg-surface border border-border py-3.5 rounded-xl text-sm font-medium hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Recommencer
            </button>
            <button 
              onClick={handleConfirmImport}
              disabled={loading}
              className="flex-[2] bg-accent text-background py-3.5 rounded-xl text-sm font-bold glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
            >
              {loading ? 'Création...' : 'Confirmer et Créer les cours'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

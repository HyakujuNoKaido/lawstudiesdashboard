import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Scale, FileText, CheckCircle2 } from 'lucide-react';
import { fetchCourses, saveCaseStudy } from '../services/supabaseService';

export function CaseStudyEditor() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    course_id: '',
    legal_issue: '',
    major_premise: '',
    minor_premise: '',
    conclusion: ''
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
    setLoading(true);
    try {
      await saveCaseStudy(form);
      alert("Cas pratique et subsumption enregistrés avec succès !");
      navigate('/courses');
    } catch (err) {
      console.error("Erreur sauvegarde cas pratique:", err);
      alert("Échec de l'enregistrement.");
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
            <span>Assistant de Subsumption (Cas Pratique)</span>
          </h1>
          <p className="text-text-muted text-xs">Méthode syllogistique suisse obligatoire pour la résolution des cas d'examen.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-muted">Intitulé du cas</label>
            <input 
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ex: Cas pratique - Vente mobilière et demeure du débiteur"
              className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
            />
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
        </div>

        {/* 1. Question juridique */}
        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={16} />
            <span>1. Question juridique</span>
          </label>
          <p className="text-xs text-text-muted">Formulez la question de droit précise posée par les faits de l'espèce.</p>
          <textarea 
            rows={3}
            required
            value={form.legal_issue}
            onChange={(e) => setForm({ ...form, legal_issue: e.target.value })}
            placeholder="ex: L'acheteur A peut-il exiger des dommages-intérêts positifs en raison du retard de livraison du vendeur B (art. 107 CO) ?"
            className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1"
          />
        </div>

        {/* 2. Majeure */}
        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <Scale size={16} />
            <span>2. Majeure (Norme légale et conditions)</span>
          </label>
          <p className="text-xs text-text-muted">Citez les articles de loi applicables et énumérez les conditions cumulatives ou alternatives requises.</p>
          <textarea 
            rows={4}
            required
            value={form.major_premise}
            onChange={(e) => setForm({ ...form, major_premise: e.target.value })}
            placeholder="ex: Selon l'art. 107 al. 1 CO, en cas de demeure du débiteur dans un contrat synallagmatique, le créancier peut fixer un délai convenable pour l'exécution..."
            className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1"
          />
        </div>

        {/* 3. Mineure */}
        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={16} />
            <span>3. Mineure (Subsumption / Application aux faits)</span>
          </label>
          <p className="text-xs text-text-muted">Appliquez rigoureusement chaque condition de la règle de droit aux faits concrets du cas.</p>
          <textarea 
            rows={4}
            required
            value={form.minor_premise}
            onChange={(e) => setForm({ ...form, minor_premise: e.target.value })}
            placeholder="ex: En l'espèce, le créancier A a imparti un délai convenable de 10 jours par courrier recommandé du 5 mars. Le débiteur B n'a pas exécuté..."
            className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1"
          />
        </div>

        {/* 4. Conclusion */}
        <div className="flex flex-col gap-1.5 bg-surface p-4 rounded-2xl border border-border">
          <label className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={16} />
            <span>4. Conclusion (Conséquence juridique)</span>
          </label>
          <p className="text-xs text-text-muted">Déduisez la conséquence juridique finale (qui peut réclamer quoi à qui).</p>
          <textarea 
            rows={3}
            required
            value={form.conclusion}
            onChange={(e) => setForm({ ...form, conclusion: e.target.value })}
            placeholder="ex: Par conséquent, A est en droit de résilier le contrat et de demander des dommages-intérêts pour inexécution (art. 107 al. 2 CO)."
            className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent font-serif mt-1"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-background rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
        >
          <Save size={18} />
          <span>{loading ? 'Enregistrement...' : 'Enregistrer la Résolution'}</span>
        </button>

      </form>
    </div>
  );
}

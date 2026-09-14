import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Scale } from 'lucide-react';
import { saveCaseLaw } from '../services/supabaseService';

export function CaseLawEditor() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    atf_citation: '',
    facts: '',
    procedure: '',
    consideranda: '',
    holding: '',
    course_id: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveCaseLaw(form as any);
      navigate(-1);
    } catch (err) {
      console.error("Erreur enregistrement fiche d'arrêt:", err);
      alert("Échec de l'enregistrement de la fiche d'arrêt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300 max-w-3xl mx-auto w-full">
      
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>

        <div>
          <h1 className="font-serif text-3xl mb-1 flex items-center gap-2">
            <Scale className="text-warning" size={28} />
            <span>Nouvelle Fiche d'Arrêt (ATF)</span>
          </h1>
          <p className="text-text-muted text-sm">Structurez l'analyse d'un arrêt du Tribunal fédéral selon la méthode académique.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium text-text-muted">Intitulé de l'affaire</label>
            <input 
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ex: Responsabilité du maître d'ouvrage c. Entreprise générale"
              className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Référence ATF</label>
            <input 
              type="text"
              required
              value={form.atf_citation}
              onChange={(e) => setForm({ ...form, atf_citation: e.target.value })}
              placeholder="ex: ATF 143 III 1"
              className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">1. Les Faits (Antécédents et litige)</label>
          <textarea 
            rows={4}
            required
            value={form.facts}
            onChange={(e) => setForm({ ...form, facts: e.target.value })}
            placeholder="Résumez les faits pertinents à l'origine du litige..."
            className="w-full bg-surface border border-border rounded-md p-3 text-sm focus:outline-none focus:border-accent font-serif"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">2. La Procédure (Parcours judiciaire)</label>
          <textarea 
            rows={3}
            required
            value={form.procedure}
            onChange={(e) => setForm({ ...form, procedure: e.target.value })}
            placeholder="Décisions des instances cantonales et conclusions des parties..."
            className="w-full bg-surface border border-border rounded-md p-3 text-sm focus:outline-none focus:border-accent font-serif"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">3. En Droit / Considérants clés (Ratio decidendi)</label>
          <textarea 
            rows={5}
            required
            value={form.consideranda}
            onChange={(e) => setForm({ ...form, consideranda: e.target.value })}
            placeholder="Analysez les considérants juridiques essentiels du Tribunal fédéral..."
            className="w-full bg-surface border border-border rounded-md p-3 text-sm focus:outline-none focus:border-accent font-serif"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">4. La Solution / Dispositif</label>
          <textarea 
            rows={3}
            required
            value={form.holding}
            onChange={(e) => setForm({ ...form, holding: e.target.value })}
            placeholder="Le Tribunal fédéral admet ou rejette le recours pour les motifs suivants..."
            className="w-full bg-surface border border-border rounded-md p-3 text-sm focus:outline-none focus:border-accent font-serif"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-accent text-background rounded-md py-3.5 px-4 flex items-center justify-center gap-2 font-medium hover:bg-accent-strong transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          <span>{loading ? 'Enregistrement...' : 'Enregistrer la Fiche d\'Arrêt'}</span>
        </button>

      </form>
    </div>
  );
}

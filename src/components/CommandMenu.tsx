import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, FileText, Scale, Layers } from 'lucide-react';
import { searchGlobal } from '../../services/supabaseService';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ courses: any[]; notes: any[]; caseLaws: any[]; caseStudies: any[] }>({
    courses: [],
    notes: [],
    caseLaws: [],
    caseStudies: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle ouvert/fermé géré par le parent ou état local
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ courses: [], notes: [], caseLaws: [], caseStudies: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchGlobal(query);
        setResults(res);
      } catch (err) {
        console.error("Erreur recherche globale:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.courses.length + results.notes.length + results.caseLaws.length + results.caseStudies.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/85 backdrop-blur-md pt-20 px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-surface-elevated border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-top-5 duration-300 text-text">
        
        {/* Barre de recherche */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-surface">
          <Search size={20} className="text-accent shrink-0" />
          <input 
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un cours, une note, un arrêt ATF, un cas pratique..."
            className="w-full bg-transparent text-sm focus:outline-none text-text placeholder:text-text-muted font-medium"
          />
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Liste des résultats */}
        <div className="max-h-[380px] overflow-y-auto p-3 flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-8 text-text-muted text-xs">Recherche en cours...</div>
          ) : query.trim() && totalResults === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs">Aucun résultat trouvé pour "{query}".</div>
          ) : !query.trim() ? (
            <div className="text-center py-8 text-text-muted text-xs">Tapez un mot-clé pour explorer votre base de connaissances juridiques.</div>
          ) : (
            <>
              {/* Cours */}
              {results.courses.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2">Cours</span>
                  {results.courses.map(c => (
                    <div 
                      key={c.id}
                      onClick={() => { onClose(); navigate(`/courses/${c.id}`); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface cursor-pointer transition-colors"
                    >
                      <BookOpen size={16} className="text-accent" />
                      <span className="text-xs font-medium text-text">{c.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Fiches d'Arrêt */}
              {results.caseLaws.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2">Fiches d'Arrêt (ATF)</span>
                  {results.caseLaws.map(cl => (
                    <div 
                      key={cl.id}
                      onClick={() => { onClose(); navigate('/courses'); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface cursor-pointer transition-colors"
                    >
                      <FileText size={16} className="text-warning" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-text">{cl.title}</span>
                        <span className="text-[10px] text-text-muted font-mono">{cl.atf_citation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cas Pratiques / Subsumptions */}
              {results.caseStudies.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2">Cas Pratiques</span>
                  {results.caseStudies.map(cs => (
                    <div 
                      key={cs.id}
                      onClick={() => { onClose(); navigate('/courses'); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface cursor-pointer transition-colors"
                    >
                      <Scale size={16} className="text-info" />
                      <span className="text-xs font-medium text-text">{cs.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pied de menu */}
        <div className="bg-surface px-4 py-2.5 border-t border-border flex justify-between items-center text-[11px] text-text-muted">
          <span>Navigation rapide Lexi</span>
          <span className="font-mono">Échap pour fermer</span>
        </div>

      </div>
    </div>
  );
}

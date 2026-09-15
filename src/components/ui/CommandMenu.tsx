import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, FileText, Scale, Clock, BrainCircuit, Calendar } from 'lucide-react';
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
        // Si l'application appelait une fonction open(), elle serait ici. 
        // Actuellement géré par le state de AppLayout
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm pt-16 md:pt-24 px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-surface-elevated border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300 text-text">
        
        {/* Barre de recherche */}
        <div className="flex items-center px-4 py-4 border-b border-border gap-3 bg-surface">
          <Search size={20} className="text-accent shrink-0" />
          <input 
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une notion, un arrêt, un document..."
            className="w-full bg-transparent text-sm md:text-base focus:outline-none text-text placeholder:text-text-muted font-medium"
          />
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Résultats ou Suggestions */}
        <div className="max-h-[60vh] overflow-y-auto p-2 md:p-3 flex flex-col gap-1">
          
          {loading ? (
            <div className="text-center py-10 text-text-muted text-xs">Recherche dans votre cerveau Lexi...</div>
          ) : query.trim() && totalResults === 0 ? (
            <div className="text-center py-10 text-text-muted text-xs">Aucune ressource trouvée pour "{query}".</div>
          ) : !query.trim() ? (
            
            /* Suggestions intelligentes par défaut */
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3 py-2">Suggestions intelligentes</span>
              
              <button onClick={() => { onClose(); navigate('/study'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface cursor-pointer transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center text-info shrink-0"><BrainCircuit size={16} /></div>
                <div>
                  <span className="text-sm font-medium text-text block">Lancer ma session du jour</span>
                  <span className="text-[11px] text-text-muted">Réviser les flashcards en retard</span>
                </div>
              </button>

              <button onClick={() => { onClose(); navigate('/schedule'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface cursor-pointer transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0"><Calendar size={16} /></div>
                <div>
                  <span className="text-sm font-medium text-text block">Voir les prochaines échéances</span>
                  <span className="text-[11px] text-text-muted">Rendus, séminaires et examens</span>
                </div>
              </button>

              <button onClick={() => { onClose(); navigate('/courses'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface cursor-pointer transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-text shrink-0"><Clock size={16} /></div>
                <div>
                  <span className="text-sm font-medium text-text block">Ouvrir le dernier document consulté</span>
                  <span className="text-[11px] text-text-muted">Reprendre la lecture en cours</span>
                </div>
              </button>
            </div>

          ) : (
            
            /* Résultats de recherche classés */
            <>
              {results.courses.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3 py-1">Matières</span>
                  {results.courses.map(c => (
                    <div key={c.id} onClick={() => { onClose(); navigate(`/courses/${c.id}`); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface cursor-pointer transition-colors">
                      <BookOpen size={16} className="text-text-muted" />
                      <span className="text-sm font-medium text-text">{c.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.caseLaws.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3 py-1">Jurisprudence (ATF)</span>
                  {results.caseLaws.map(cl => (
                    <div key={cl.id} onClick={() => { onClose(); navigate('/courses'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface cursor-pointer transition-colors">
                      <FileText size={16} className="text-warning" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text">{cl.title}</span>
                        <span className="text-[11px] text-text-muted font-mono">{cl.atf_citation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.caseStudies.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3 py-1">Cas Pratiques</span>
                  {results.caseStudies.map(cs => (
                    <div key={cs.id} onClick={() => { onClose(); navigate('/courses'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface cursor-pointer transition-colors">
                      <Scale size={16} className="text-info" />
                      <span className="text-sm font-medium text-text">{cs.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer info */}
        <div className="bg-surface px-4 py-3 border-t border-border flex justify-between items-center text-[10px] text-text-muted uppercase tracking-wider font-semibold">
          <span>Recherche Lexi</span>
          <span className="font-mono bg-surface-elevated px-2 py-1 rounded">Échap pour fermer</span>
        </div>
      </div>
    </div>
  );
}

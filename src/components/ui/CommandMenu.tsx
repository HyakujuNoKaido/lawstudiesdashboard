import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, FileText, Scale, BrainCircuit, Download, Edit3, Play, ArrowRight } from 'lucide-react';
import { searchGlobal, getCurrentUserId } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';
import { toast } from '../../lib/toast';

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
  const [contextLoading, setContextLoading] = useState(true);
  
  // --- ÉTATS INTELLIGENTS (Contextuels) ---
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [dueCardsCount, setDueCardsCount] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // L'ouverture est gérée via le state global dans AppLayout
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Chargement des données contextuelles à chaque ouverture du menu
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      loadSmartContext();
    }
  }, [isOpen]);

  const loadSmartContext = async () => {
    setContextLoading(true);
    try {
      const userId = await getCurrentUserId();
      
      // 1. Récupérer le dernier document importé/modifié
      const { data: docData } = await supabase
        .from('documents')
        .select('id, original_name, bucket_path, document_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (docData) setLastDoc(docData);

      // 2. Vérifier les révisions en attente
      const { count } = await supabase
        .from('flashcards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('due_at', new Date().toISOString());
      
      setDueCardsCount(count || 0);
    } catch (err) {
      console.error("Erreur contexte intelligent:", err);
    } finally {
      setContextLoading(false);
    }
  };

  // Moteur de recherche global
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

  // Action Rapide : Téléchargement du dernier document
  const handleDownloadLastDoc = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lastDoc) return;
    
    toast("Préparation du téléchargement...", "info");
    try {
      const { data, error } = await supabase.storage
        .from('user-documents')
        .createSignedUrl(lastDoc.bucket_path, 60);
      
      if (error) throw error;
      
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = lastDoc.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast("Téléchargement lancé", "success");
      onClose();
    } catch (err) {
      toast("Erreur de téléchargement", "error");
    }
  };

  if (!isOpen) return null;

  const totalResults = results.courses.length + results.notes.length + results.caseLaws.length + results.caseStudies.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm pt-16 md:pt-24 px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300 text-text">
        {/* BARRE DE RECHERCHE */}
        <div className="flex items-center px-4 py-4 border-b border-border gap-3 bg-surface-elevated">
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
            className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENU : SUGGESTIONS OU RÉSULTATS */}
        <div className="max-h-[60vh] overflow-y-auto p-2 md:p-3 flex flex-col gap-1">
          {loading ? (
            <div className="text-center py-10 text-text-muted text-sm font-mono animate-pulse">Recherche dans Lexi...</div>
          ) : query.trim() && totalResults === 0 ? (
            <div className="text-center py-10 text-text-muted text-sm">Aucune ressource trouvée pour "{query}".</div>
          ) : !query.trim() ? (
            /* SUGGESTIONS INTELLIGENTES & ACTIONS RAPIDES */
            <div className="flex flex-col gap-1">
              {!contextLoading && (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3 py-2 mt-1">Actions immédiates</span>
                  
                  {/* Action : Lancer la révision s'il y a des cartes */}
                  {dueCardsCount > 0 ? (
                    <button onClick={() => { onClose(); navigate('/session/all'); }} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-elevated cursor-pointer transition-colors text-left group border border-transparent hover:border-warning/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning shrink-0 group-hover:scale-110 transition-transform"><BrainCircuit size={16} /></div>
                        <div>
                          <span className="text-sm font-medium text-text block">Session de révision en attente</span>
                          <span className="text-[11px] text-text-muted">{dueCardsCount} flashcards requièrent votre attention</span>
                        </div>
                      </div>
                      <Play size={16} className="text-text-muted group-hover:text-warning transition-colors mr-2" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 p-3 opacity-60">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success shrink-0"><BrainCircuit size={16} /></div>
                      <div>
                        <span className="text-sm font-medium text-text block">Mémoire à jour</span>
                        <span className="text-[11px] text-text-muted">Aucune flashcard à réviser pour le moment</span>
                      </div>
                    </div>
                  )}

                  {/* Actions liées au dernier document manipulé */}
                  {lastDoc && (
                    <>
                      <button onClick={() => { onClose(); navigate(`/viewer/${lastDoc.id}`); }} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-elevated cursor-pointer transition-colors text-left group border border-transparent hover:border-accent/30 mt-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform"><Edit3 size={16} /></div>
                          <div className="min-w-0 pr-4">
                            <span className="text-sm font-medium text-text block truncate">Ouvrir ou Renommer le dernier fichier</span>
                            <span className="text-[11px] text-text-muted truncate block">{lastDoc.original_name}</span>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-text-muted group-hover:text-accent transition-colors shrink-0 mr-2" />
                      </button>
                      
                      <button onClick={handleDownloadLastDoc} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-elevated cursor-pointer transition-colors text-left group border border-transparent hover:border-info/30">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center text-info shrink-0 group-hover:scale-110 transition-transform"><Download size={16} /></div>
                          <div className="min-w-0 pr-4">
                            <span className="text-sm font-medium text-text block truncate">Télécharger rapidement</span>
                            <span className="text-[11px] text-text-muted truncate block">{lastDoc.document_type} • {lastDoc.original_name}</span>
                          </div>
                        </div>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            /* RÉSULTATS DE RECHERCHE */
            <>
              {results.courses.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3 py-1">Matières</span>
                  {results.courses.map(c => (
                    <div key={c.id} onClick={() => { onClose(); navigate(`/courses/${c.id}`); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated cursor-pointer transition-colors">
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
                    <div key={cl.id} onClick={() => { onClose(); navigate('/library'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated cursor-pointer transition-colors">
                      <FileText size={16} className="text-warning" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text">{cl.title}</span>
                        <span className="text-[10px] text-text-muted font-mono">{cl.atf_citation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.caseStudies.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3 py-1">Cas Pratiques</span>
                  {results.caseStudies.map(cs => (
                    <div key={cs.id} onClick={() => { onClose(); navigate('/library'); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated cursor-pointer transition-colors">
                      <Scale size={16} className="text-info" />
                      <span className="text-sm font-medium text-text">{cs.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.notes.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-3 py-1">Notes de cours</span>
                  {results.notes.map(n => (
                    <div key={n.id} onClick={() => { onClose(); navigate(`/editor/${n.id}`); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated cursor-pointer transition-colors">
                      <Edit3 size={16} className="text-accent" />
                      <span className="text-sm font-medium text-text">{n.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* PIED DE PAGE */}
        <div className="bg-surface px-4 py-3 border-t border-border flex justify-between items-center text-[10px] text-text-muted uppercase tracking-wider font-semibold">
          <span>Recherche Globale & Commandes</span>
          <span className="font-mono bg-surface-elevated px-2 py-1 rounded border border-border">Échap pour fermer</span>
        </div>
      </div>
    </div>
  );
}

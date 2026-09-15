import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sun, GraduationCap, Library, BrainCircuit, Plus, X, Scale, FileText, Timer, Upload, FileEdit, Search, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { CommandMenu } from '../ui/CommandMenu';
import { ToastEventDetail } from '../../lib/toast';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // État pour le système de Toast global
  const [toast, setToast] = useState<{ message: string; type: string; id: number } | null>(null);

  const isActive = (paths: string[]) => paths.includes(location.pathname);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastEventDetail>;
      const newToast = { ...customEvent.detail, id: Date.now() };
      setToast(newToast);
      
      // Auto-hide après 3 secondes
      setTimeout(() => {
        setToast(current => current?.id === newToast.id ? null : current);
      }, 3000);
    };

    window.addEventListener('lexi-toast', handleToast);
    return () => window.removeEventListener('lexi-toast', handleToast);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text flex flex-col antialiased selection:bg-accent/30 selection:text-accent relative overflow-x-hidden">
      {/* Barre d'en-tête globale avec bouton de recherche */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
              <Scale size={18} strokeWidth={2.5} />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">Lexi</span>
          </div>
          
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 bg-surface-elevated border border-border px-3.5 py-2 rounded-xl text-xs text-text-muted hover:border-accent/50 hover:text-text transition-colors cursor-pointer"
          >
            <Search size={15} className="text-accent" />
            <span className="hidden sm:inline">Rechercher ou commander...</span>
            <kbd className="hidden sm:inline bg-surface px-1.5 py-0.5 rounded text-[10px] font-mono border border-border text-text-muted">Cmd+K</kbd>
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-28 relative">
        <Outlet />
      </main>

      {/* Menu de recherche globale (CommandMenu) */}
      <CommandMenu isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Global Toast System */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md text-sm font-medium
            ${toast.type === 'success' ? 'bg-success/10 border-success/30 text-success' : ''}
            ${toast.type === 'error' ? 'bg-danger/10 border-danger/30 text-danger' : ''}
            ${toast.type === 'info' ? 'bg-info/10 border-info/30 text-info' : ''}
            ${toast.type === 'warning' ? 'bg-warning/10 border-warning/30 text-warning' : ''}
          `}>
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            {toast.type === 'warning' && <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Menu d'actions rapides */}
      {isActionMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <div>
                <h3 className="font-serif text-xl font-bold">Que faisons-nous ?</h3>
                <p className="text-xs text-text-muted">L'IA de Lexi vous assiste dans votre travail.</p>
              </div>
              <button 
                onClick={() => setIsActionMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/cases/law'); }} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-elevated border border-border hover:border-warning/50 transition-all text-left group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center group-hover:scale-105 transition-transform"><FileText size={20} /></div>
                <div>
                  <p className="font-medium text-sm text-text">Je fiche un arrêt (ATF)</p>
                  <p className="text-xs text-text-muted">Synthèse structurée de jurisprudence</p>
                </div>
              </button>

              <button onClick={() => { setIsActionMenuOpen(false); navigate('/cases/study'); }} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-elevated border border-border hover:border-info/50 transition-all text-left group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center group-hover:scale-105 transition-transform"><Scale size={20} /></div>
                <div>
                  <p className="font-medium text-sm text-text">Je résous un cas pratique</p>
                  <p className="text-xs text-text-muted">Assistant de subsumption guidé</p>
                </div>
              </button>

              <button onClick={() => { setIsActionMenuOpen(false); navigate('/exams/simulator'); }} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-elevated border border-border hover:border-danger/50 transition-all text-left group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center group-hover:scale-105 transition-transform"><Timer size={20} /></div>
                <div>
                  <p className="font-medium text-sm text-text">Je m'entraîne pour l'examen</p>
                  <p className="text-xs text-text-muted">Simulation chronométrée inédite</p>
                </div>
              </button>

              <button onClick={() => { setIsActionMenuOpen(false); navigate('/add/course'); }} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-elevated border border-border hover:border-success/50 transition-all text-left group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center group-hover:scale-105 transition-transform"><GraduationCap size={20} /></div>
                <div>
                  <p className="font-medium text-sm text-text">J'ajoute une matière</p>
                  <p className="text-xs text-text-muted">Mise à jour du plan d'études</p>
                </div>
              </button>

              <button onClick={() => { setIsActionMenuOpen(false); navigate('/notes'); }} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-elevated border border-border hover:border-accent/50 transition-all text-left group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform"><FileEdit size={20} /></div>
                <div>
                  <p className="font-medium text-sm text-text">Je prends des notes</p>
                  <p className="text-xs text-text-muted">Éditeur avec extraction automatique</p>
                </div>
              </button>

              <button onClick={() => { setIsActionMenuOpen(false); navigate('/import'); }} className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-elevated border border-border hover:border-secondary/50 transition-all text-left group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform"><Upload size={20} /></div>
                <div>
                  <p className="font-medium text-sm text-text">J'importe un plan d'études</p>
                  <p className="text-xs text-text-muted">À partir d'un document PDF</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre de navigation inférieure */}
      <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border px-2 py-2">
        <div className="max-w-md mx-auto flex items-center justify-between relative px-2">
          
          <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors cursor-pointer w-16 ${isActive(['/']) ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'}`}>
            <Sun size={22} className={isActive(['/']) ? 'drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]' : ''} />
            <span className="text-[10px] tracking-wide">Aujourd'hui</span>
          </button>

          <button onClick={() => navigate('/courses')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors cursor-pointer w-16 ${isActive(['/courses', '/schedule']) ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'}`}>
            <GraduationCap size={22} />
            <span className="text-[10px] tracking-wide">Diplôme</span>
          </button>

          <div className="relative -top-6 mx-2">
            <button onClick={() => setIsActionMenuOpen(true)} className="w-14 h-14 rounded-2xl bg-accent text-background flex items-center justify-center glow-gold hover:bg-accent-strong transition-transform active:scale-95 shadow-xl cursor-pointer" title="Actions rapides">
              <Plus size={28} strokeWidth={2.5} />
            </button>
          </div>

          <button onClick={() => navigate('/library')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors cursor-pointer w-16 ${isActive(['/library']) ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'}`}>
            <Library size={22} />
            <span className="text-[10px] tracking-wide">Biblio</span>
          </button>

          <button onClick={() => navigate('/study')} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors cursor-pointer w-16 ${isActive(['/study']) ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'}`}>
            <BrainCircuit size={22} />
            <span className="text-[10px] tracking-wide">Mémoire</span>
          </button>

        </div>
      </nav>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Sun, Book, CalendarDays, BrainCircuit, Plus, X, Search, WifiOff, Settings, HelpCircle, LogOut, GraduationCap, FileText, FileEdit, BookOpen, AlertTriangle, Scale, Zap } from 'lucide-react';
import { CommandMenu } from '../ui/CommandMenu';
import { ToastEventDetail } from '../../lib/toast';
import { useApp } from '../../context/AppContext';
import { LexiIcons } from '../../lib/icons';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOffline, settings, setSettings } = useApp();
  
  // États
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string; id: number } | null>(null);

  const isActive = (paths: string[]) => paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

  // Sécurité : masquer les barres de navigation quand on lit un PDF plein écran
  const isViewer = location.pathname.includes('/viewer');

  // Transitions intelligentes selon la route
  const getTransitionClass = () => {
    const path = location.pathname;
    const baseSpeed = settings.animationSpeed === 'fast' ? 'duration-150' : settings.animationSpeed === 'none' ? 'duration-0' : 'duration-400';
    
    if (path.includes('/cases/') || path.includes('/editor') || path.includes('/viewer')) {
      return `animate-in fade-in zoom-in-[0.98] ${baseSpeed} ease-out`;
    }
    if (path.includes('/session') || path.includes('/add') || path.includes('/import') || path.includes('/exams')) {
      return `animate-in slide-in-from-right-8 fade-in ${baseSpeed} ease-out`;
    }
    return `animate-in fade-in ${baseSpeed} ease-in-out`;
  };

  // Gestionnaire de Toasts
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastEventDetail>;
      const newToast = { ...customEvent.detail, id: Date.now() };
      setToast(newToast);
      setTimeout(() => {
        setToast(current => current?.id === newToast.id ? null : current);
      }, 3000);
    };
    window.addEventListener('lexi-toast', handleToast);
    return () => window.removeEventListener('lexi-toast', handleToast);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      navigate('/onboarding');
    }
  };

  return (
    <div className={`min-h-screen bg-background text-text flex flex-col antialiased selection:bg-accent/30 selection:text-accent relative overflow-x-hidden ${settings.focusMode ? 'grayscale-[0.2] contrast-125' : ''}`}>
      
      {/* HEADER GLOBAL */}
      {!isViewer && (
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 shrink-0">
          <div className="max-w-5xl mx-auto flex justify-between items-center relative">
            
            {/* Logo & Mode Offline */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
                  <LexiIcons.Law size={18} strokeWidth={2.5} />
                </div>
                <span className="font-serif font-bold text-xl tracking-tight hidden sm:block text-accent">Lexi</span>
              </div>
              
              {isOffline && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-warning/10 border border-warning/30 text-warning text-[10px] font-bold rounded uppercase tracking-wider">
                  <WifiOff size={12} /> Mode Hors-ligne
                </div>
              )}
            </div>
            
            {/* NAVIGATION DESKTOP */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 absolute left-1/2 -translate-x-1/2">
              <NavLink to="/" className={({ isActive }) => `text-sm font-bold transition-colors ${isActive ? 'text-accent' : 'text-text-muted hover:text-text'}`}>Aujourd'hui</NavLink>
              <NavLink to="/courses" className={({ isActive }) => `text-sm font-bold transition-colors ${isActive ? 'text-accent' : 'text-text-muted hover:text-text'}`}>Cours</NavLink>
              <NavLink to="/documents" className={({ isActive }) => `text-sm font-bold transition-colors ${isActive ? 'text-accent' : 'text-text-muted hover:text-text'}`}>Bibliothèque</NavLink>
              <NavLink to="/schedule" className={({ isActive }) => `text-sm font-bold transition-colors ${isActive ? 'text-accent' : 'text-text-muted hover:text-text'}`}>Planning</NavLink>
              <NavLink to="/study" className={({ isActive }) => `text-sm font-bold transition-colors ${isActive ? 'text-accent' : 'text-text-muted hover:text-text'}`}>Révisions</NavLink>
            </nav>

            {/* Outils & Avatar */}
            <div className="flex items-center gap-3 md:gap-4">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:bg-surface-elevated md:border border-border md:px-3.5 md:py-2 rounded-xl text-xs text-text-muted hover:border-accent/50 hover:text-accent transition-colors cursor-pointer"
                title="Rechercher (Cmd+K)"
              >
                <Search size={18} className="md:w-[15px] md:h-[15px] md:text-accent" />
                <span className="hidden md:inline ml-2">Rechercher...</span>
                <kbd className="hidden md:inline ml-2 bg-surface px-1.5 py-0.5 rounded text-[10px] font-mono border border-border text-text-muted">Cmd+K</kbd>
              </button>

              {/* MENU AVATAR */}
              <div className="relative">
                <button 
                  onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                  className="w-8 h-8 rounded-full bg-accent/20 text-accent border border-accent flex items-center justify-center font-bold text-xs uppercase cursor-pointer"
                >
                  AB
                </button>
                
                {isAvatarMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsAvatarMenuOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-3 w-64 bg-surface-elevated border border-border rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-border/50 mb-2">
                        <p className="font-bold text-sm text-text">Aniss Bahaji</p>
                        <p className="text-xs text-text-muted">Étudiant · Droit</p>
                      </div>
                      <button onClick={() => { setIsAvatarMenuOpen(false); navigate('/profile'); }} className="w-full px-4 py-2 text-sm text-text hover:bg-surface flex items-center gap-3 cursor-pointer"><GraduationCap size={16} className="text-accent" /> Profil & Diplôme</button>
                      <button onClick={() => { setIsAvatarMenuOpen(false); setIsSettingsModalOpen(true); }} className="w-full px-4 py-2 text-sm text-text hover:bg-surface flex items-center gap-3 cursor-pointer"><Settings size={16} className="text-text-muted" /> Paramètres</button>
                      <div className="h-px bg-border/50 my-1"></div>
                      <button onClick={() => { setIsAvatarMenuOpen(false); setIsHelpModalOpen(true); }} className="w-full px-4 py-2 text-sm text-text hover:bg-surface flex items-center gap-3 cursor-pointer"><HelpCircle size={16} className="text-text-muted" /> Aide et raccourcis</button>
                      <div className="h-px bg-border/50 my-1"></div>
                      <button onClick={() => { setIsAvatarMenuOpen(false); handleLogout(); }} className="w-full px-4 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-3 cursor-pointer"><LogOut size={16} /> Se déconnecter</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* CONTENU PRINCIPAL */}
      <main key={location.pathname} className={`flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 relative ${isViewer ? '' : 'pb-28'} ${getTransitionClass()}`}>
        <Outlet />
      </main>

      {/* Command Menu */}
      <CommandMenu isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* MODALE PARAMÈTRES */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-text">
            <div className="flex justify-between items-center border-b border-border/50 pb-3">
              <h3 className="font-serif font-bold text-lg flex items-center gap-2"><Settings size={18} className="text-accent"/> Paramètres rapides</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-1 text-text-muted hover:text-text rounded-full bg-surface-elevated cursor-pointer"><X size={16}/></button>
            </div>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span>Mode Focus juriste</span>
                <button 
                  onClick={() => setSettings({ ...settings, focusMode: !settings.focusMode })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${settings.focusMode ? 'bg-accent text-background border-accent' : 'bg-surface-elevated text-text-muted border-border'}`}
                >
                  {settings.focusMode ? 'Activé' : 'Désactivé'}
                </button>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Stockage cloud (Supabase)</span>
                <span className="text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-lg">Connecté</span>
              </div>
            </div>
            <button onClick={() => setIsSettingsModalOpen(false)} className="mt-2 w-full py-2.5 bg-accent text-background rounded-xl font-bold text-xs cursor-pointer">Fermer</button>
          </div>
        </div>
      )}

      {/* MODALE AIDE & RACCOURCIS */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-text">
            <div className="flex justify-between items-center border-b border-border/50 pb-3">
              <h3 className="font-serif font-bold text-lg flex items-center gap-2"><HelpCircle size={18} className="text-accent"/> Aide & Raccourcis</h3>
              <button onClick={() => setIsHelpModalOpen(false)} className="p-1 text-text-muted hover:text-text rounded-full bg-surface-elevated cursor-pointer"><X size={16}/></button>
            </div>
            <div className="flex flex-col gap-3 text-xs leading-relaxed text-text-muted">
              <p><strong className="text-text">Recherche globale :</strong> Appuyez sur <kbd className="bg-surface-elevated px-1.5 py-0.5 rounded border border-border font-mono text-text">Cmd+K</kbd> (ou Ctrl+K) n'importe où pour ouvrir la palette de commandes.</p>
              <p><strong className="text-text">Mode Amphi :</strong> Le bouton "Je suis en cours" permet de consigner vos notes en direct avec sauvegarde instantanée.</p>
              <p><strong className="text-text">Révisions SM-2 :</strong> L'algorithme ajuste automatiquement vos flashcards selon votre niveau de maîtrise.</p>
            </div>
            <button onClick={() => setIsHelpModalOpen(false)} className="mt-2 w-full py-2.5 bg-accent text-background rounded-xl font-bold text-xs cursor-pointer">Compris</button>
          </div>
        </div>
      )}

      {/* SYSTÈME DE TOASTS */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md text-sm font-medium
            ${toast.type === 'success' ? 'bg-success/10 border-success/30 text-success' : ''}
            ${toast.type === 'error' ? 'bg-danger/10 border-danger/30 text-danger' : ''}
            ${toast.type === 'info' ? 'bg-info/10 border-info/30 text-info' : ''}
            ${toast.type === 'warning' ? 'bg-warning/10 border-warning/30 text-warning' : ''}
          `}>
            {toast.type === 'success' && <LexiIcons.Success size={18} />}
            {toast.type === 'error' && <LexiIcons.Error size={18} />}
            {toast.type === 'info' && <LexiIcons.Info size={18} />}
            {toast.type === 'warning' && <LexiIcons.Warning size={18} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* MENU D'ACTIONS RAPIDES (FAB) */}
      {!isViewer && isActionMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsActionMenuOpen(false)}></div>
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[320px] bg-surface-elevated border border-border rounded-3xl shadow-2xl p-2 animate-in slide-in-from-bottom-4 fade-in">
            
            <div className="flex justify-between items-center px-4 pt-3 pb-2 border-b border-border/50 mb-2">
              <h3 className="font-serif font-bold text-lg">Action rapide</h3>
              <button onClick={() => setIsActionMenuOpen(false)} className="p-1 text-text-muted hover:text-text cursor-pointer rounded-full bg-surface">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <span className="text-[10px] uppercase font-bold text-text-muted px-4 py-1.5 tracking-wider mt-1">Créer</span>
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/add/course'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-surface rounded-xl cursor-pointer"><BookOpen size={16} className="text-accent" /> Nouveau cours</button>
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/editor/new'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-surface rounded-xl cursor-pointer"><FileEdit size={16} className="text-success" /> Nouvelle note</button>
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/add/document'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-surface rounded-xl cursor-pointer"><FileText size={16} className="text-info" /> Ajouter un document</button>
              
              <div className="h-px bg-border/50 my-1 mx-2"></div>
              
              <span className="text-[10px] uppercase font-bold text-text-muted px-4 py-1.5 tracking-wider">Étudier</span>
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/session/all', { state: { from: location.pathname } }); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-surface rounded-xl cursor-pointer"><BrainCircuit size={16} className="text-warning" /> Lancer une révision</button>
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/add/flashcards/batch'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-surface rounded-xl cursor-pointer"><Zap size={16} className="text-warning" /> Créer des flashcards (IA)</button>
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/exams/simulator'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-surface rounded-xl cursor-pointer"><AlertTriangle size={16} className="text-danger" /> Examen blanc</button>
              
              <div className="h-px bg-border/50 my-1 mx-2"></div>
              
              <span className="text-[10px] uppercase font-bold text-text-muted px-4 py-1.5 tracking-wider">Droit</span>
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/cases/law'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-surface rounded-xl cursor-pointer"><Scale size={16} className="text-secondary" /> Fiche d'arrêt</button>
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/cases/study'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-surface rounded-xl cursor-pointer"><LexiIcons.Law size={16} className="text-info" /> Cas pratique</button>
            </div>
          </div>
        </>
      )}

      {/* BOTTOM NAV MOBILE */}
      {!isViewer && (
        <nav aria-label="Navigation principale" className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-xl border-t border-border px-2 py-2 pb-safe">
          <div className="max-w-md mx-auto flex items-center justify-between relative px-2">
            
            <button onClick={() => navigate('/')} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors cursor-pointer w-[60px] ${isActive(['/']) && location.pathname === '/' ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'}`}>
              <Sun size={22} className={isActive(['/']) && location.pathname === '/' && !settings.focusMode ? 'drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]' : ''} />
              <span className="text-[10px] tracking-wide">Accueil</span>
            </button>

            <button onClick={() => navigate('/courses')} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors cursor-pointer w-[60px] ${isActive(['/courses']) ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'}`}>
              <Book size={22} />
              <span className="text-[10px] tracking-wide">Cours</span>
            </button>

            {/* LE FAB CENTRAL */}
            <div className="relative -top-6 px-1">
              <button 
                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                className={`w-14 h-14 rounded-2xl bg-accent text-background flex items-center justify-center hover:bg-accent-strong transition-transform duration-300 shadow-xl cursor-pointer ${isActionMenuOpen ? 'rotate-45 scale-105' : 'hover:scale-105 active:scale-95'} ${settings.focusMode ? '' : 'glow-gold'}`}
              >
                <Plus size={28} strokeWidth={2.5} />
              </button>
            </div>

            <button onClick={() => navigate('/schedule')} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors cursor-pointer w-[60px] ${isActive(['/schedule']) ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'}`}>
              <CalendarDays size={22} />
              <span className="text-[10px] tracking-wide">Planning</span>
            </button>

            <button onClick={() => navigate('/study')} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors cursor-pointer w-[60px] ${isActive(['/study', '/session']) ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'}`}>
              <BrainCircuit size={22} />
              <span className="text-[10px] tracking-wide">Révisions</span>
            </button>

          </div>
        </nav>
      )}
    </div>
  );
}

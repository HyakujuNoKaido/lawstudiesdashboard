import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Sun, Book, CalendarDays, BrainCircuit, Plus, X, Search, WifiOff, Settings, HelpCircle, LogOut, GraduationCap, FileEdit, Folder, Brain } from 'lucide-react';
import { CommandMenu } from '../ui/CommandMenu';
import { ToastEventDetail } from '../../lib/toast';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LexiIcons } from '../../lib/icons';
import { supabase } from '../../lib/supabase';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOffline, settings } = useApp();
  const { user } = useAuth();
  
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [localFocus, setLocalFocus] = useState(settings.focusMode);
  const [toast, setToast] = useState<{ message: string; type: string; id: number } | null>(null);

  const isActive = (paths: string[]) => paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
  const isViewer = location.pathname.includes('/viewer');

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

  const handleLogout = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      await supabase.auth.signOut();
      navigate('/onboarding');
    }
  };

  return (
    <div className={`min-h-screen bg-background text-text flex flex-col antialiased selection:bg-accent/30 selection:text-accent relative overflow-x-hidden ${localFocus ? 'grayscale-[0.2] contrast-125' : ''}`}>
      
      {/* HEADER GLOBAL */}
      {!isViewer && (
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 shrink-0">
          <div className="max-w-5xl mx-auto flex justify-between items-center relative">
            
            {/* Logo & Mode Offline */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text shrink-0">
                  <LexiIcons.Law size={18} strokeWidth={2} />
                </div>
                <span className="font-serif font-bold text-xl tracking-tight hidden sm:block text-text">Lexi</span>
              </div>
              {isOffline && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-warning/10 border border-warning/30 text-warning text-[10px] font-bold rounded-md uppercase tracking-wider">
                  <WifiOff size={12} /> Hors-ligne
                </div>
              )}
            </div>

            {/* NAVIGATION DESKTOP */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 absolute left-1/2 -translate-x-1/2">
              <NavLink to="/" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-accent font-bold' : 'text-text-muted hover:text-text'}`}>Aujourd'hui</NavLink>
              <NavLink to="/courses" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-accent font-bold' : 'text-text-muted hover:text-text'}`}>Cours</NavLink>
              <NavLink to="/documents" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-accent font-bold' : 'text-text-muted hover:text-text'}`}>Ressources</NavLink>
              <NavLink to="/study" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-accent font-bold' : 'text-text-muted hover:text-text'}`}>Révisions</NavLink>
              <NavLink to="/schedule" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-accent font-bold' : 'text-text-muted hover:text-text'}`}>Planning</NavLink>
            </nav>

            {/* Outils & Avatar */}
            <div className="flex items-center gap-3 md:gap-4">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:bg-surface-elevated md:border border-border md:px-3.5 md:py-2 rounded-btn text-xs text-text-muted hover:bg-surface-interactive hover:text-text transition-colors cursor-pointer"
                title="Rechercher (Cmd+K)"
              >
                <Search size={16} className="md:w-[15px] md:h-[15px]" />
                <span className="hidden md:inline ml-2 font-medium">Rechercher...</span>
                <kbd className="hidden md:inline ml-2 bg-surface px-1.5 py-0.5 rounded text-[10px] font-mono border border-border/50 opacity-70">Cmd+K</kbd>
              </button>

              {/* MENU AVATAR */}
              <div className="relative">
                <button 
                  onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                  className="w-8 h-8 rounded-full bg-surface-interactive border border-border flex items-center justify-center font-bold text-xs text-text hover:border-accent transition-colors cursor-pointer"
                >
                  <User size={16} />
                </button>

                {isAvatarMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsAvatarMenuOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-3 w-64 bg-surface-elevated border border-border rounded-modal shadow-apple z-50 py-2 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-border/50 mb-2">
                        <p className="font-bold text-sm text-text truncate">{user?.email || 'Étudiant'}</p>
                        <p className="text-xs text-text-muted">Cockpit Académique</p>
                      </div>
                      <button onClick={() => { setIsAvatarMenuOpen(false); navigate('/profile'); }} className="w-full px-4 py-2.5 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer transition-colors"><GraduationCap size={16} className="text-text-muted" /> Profil & Diplôme</button>
                      <button onClick={() => { setIsAvatarMenuOpen(false); setIsSettingsModalOpen(true); }} className="w-full px-4 py-2.5 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer transition-colors"><Settings size={16} className="text-text-muted" /> Paramètres</button>
                      <div className="h-px bg-border/50 my-1"></div>
                      <button onClick={() => { setIsAvatarMenuOpen(false); setIsHelpModalOpen(true); }} className="w-full px-4 py-2.5 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer transition-colors"><HelpCircle size={16} className="text-text-muted" /> Aide & Raccourcis</button>
                      <div className="h-px bg-border/50 my-1"></div>
                      <button onClick={() => { setIsAvatarMenuOpen(false); handleLogout(); }} className="w-full px-4 py-2.5 text-sm text-danger hover:bg-danger/10 flex items-center gap-3 cursor-pointer transition-colors"><LogOut size={16} /> Se déconnecter</button>
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

      <CommandMenu isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* MODALE PARAMÈTRES */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-modal p-6 shadow-apple flex flex-col gap-4 text-text">
            <div className="flex justify-between items-center border-b border-border/50 pb-3">
              <h3 className="font-serif font-bold text-lg flex items-center gap-2"><Settings size={18} className="text-text-muted"/> Paramètres rapides</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-1 text-text-muted hover:text-text rounded-full bg-surface cursor-pointer"><X size={16}/></button>
            </div>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="font-medium">Mode Focus juriste</span>
                <button 
                  onClick={() => setLocalFocus(!localFocus)}
                  className={`px-3 py-1.5 rounded-btn text-xs font-bold border transition-colors cursor-pointer ${localFocus ? 'bg-accent text-background border-accent' : 'bg-surface text-text-muted border-border'}`}
                >
                  {localFocus ? 'Activé' : 'Désactivé'}
                </button>
              </div>
            </div>
            <button onClick={() => setIsSettingsModalOpen(false)} className="mt-2 w-full py-2.5 bg-surface border border-border text-text hover:bg-surface-interactive rounded-btn font-bold text-sm transition-colors cursor-pointer">Fermer</button>
          </div>
        </div>
      )}

      {/* MODALE AIDE & RACCOURCIS */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-modal p-6 shadow-apple flex flex-col gap-4 text-text">
            <div className="flex justify-between items-center border-b border-border/50 pb-3">
              <h3 className="font-serif font-bold text-lg flex items-center gap-2"><HelpCircle size={18} className="text-text-muted"/> Aide & Raccourcis</h3>
              <button onClick={() => setIsHelpModalOpen(false)} className="p-1 text-text-muted hover:text-text rounded-full bg-surface cursor-pointer"><X size={16}/></button>
            </div>
            <div className="flex flex-col gap-3 text-sm leading-relaxed text-text-muted">
              <p><strong className="text-text">Recherche globale :</strong> Appuyez sur <kbd className="bg-surface px-1.5 py-0.5 rounded-md border border-border font-mono text-text">Cmd+K</kbd> n'importe où.</p>
              <p><strong className="text-text">Mode Amphi :</strong> Utilisez "Note rapide" pour consigner des cours en direct.</p>
              <p><strong className="text-text">Révisions SM-2 :</strong> L'algorithme espace vos flashcards selon votre rétention.</p>
            </div>
            <button onClick={() => setIsHelpModalOpen(false)} className="mt-2 w-full py-2.5 bg-surface border border-border text-text hover:bg-surface-interactive rounded-btn font-bold text-sm transition-colors cursor-pointer">Compris</button>
          </div>
        </div>
      )}

      {/* SYSTÈME DE TOASTS */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-card shadow-apple-subtle border backdrop-blur-xl text-sm font-medium
            ${toast.type === 'success' ? 'bg-success/15 border-success/30 text-success' : ''}
            ${toast.type === 'error' ? 'bg-danger/15 border-danger/30 text-danger' : ''}
            ${toast.type === 'info' ? 'bg-info/15 border-info/30 text-info' : ''}
            ${toast.type === 'warning' ? 'bg-warning/15 border-warning/30 text-warning' : ''}
          `}>
            {toast.type === 'success' && <LexiIcons.Success size={18} />}
            {toast.type === 'error' && <LexiIcons.Error size={18} />}
            {toast.type === 'info' && <LexiIcons.Info size={18} />}
            {toast.type === 'warning' && <LexiIcons.Warning size={18} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* MENU D'ACTIONS RAPIDES (FAB SIMPLIFIÉ) */}
      {!isViewer && isActionMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsActionMenuOpen(false)}></div>
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[280px] bg-surface-elevated border border-border rounded-modal shadow-apple p-2 animate-in slide-in-from-bottom-4 fade-in">
            <div className="flex flex-col gap-1">
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/editor/new'); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-text hover:bg-surface-interactive rounded-xl cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0"><FileEdit size={16} className="text-text" /></div>
                Nouvelle note
              </button>
              <div className="h-px bg-border/50 mx-4"></div>
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/add/document'); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-text hover:bg-surface-interactive rounded-xl cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0"><Folder size={16} className="text-text" /></div>
                Importer un document
              </button>
              <div className="h-px bg-border/50 mx-4"></div>
              <button onClick={() => { setIsActionMenuOpen(false); navigate('/session/all', { state: { from: location.pathname } }); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-text hover:bg-surface-interactive rounded-xl cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0"><BrainCircuit size={16} className="text-accent" /></div>
                Lancer une révision
              </button>
            </div>
          </div>
        </>
      )}

      {/* BOTTOM NAV MOBILE (Nouvel Ordre) */}
      {!isViewer && (
        <nav aria-label="Navigation principale" className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-elevated/90 backdrop-blur-xl border-t border-border px-2 py-2 pb-safe">
          <div className="max-w-md mx-auto flex items-center justify-between relative px-2">
            
            <button onClick={() => navigate('/')} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors cursor-pointer w-[60px] ${isActive(['/']) && location.pathname === '/' ? 'text-text font-bold' : 'text-text-muted hover:text-text'}`}>
              <Sun size={22} className={isActive(['/']) && location.pathname === '/' ? 'text-accent' : ''} />
              <span className="text-[10px] tracking-wide">Accueil</span>
            </button>
            
            <button onClick={() => navigate('/courses')} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors cursor-pointer w-[60px] ${isActive(['/courses']) ? 'text-text font-bold' : 'text-text-muted hover:text-text'}`}>
              <Book size={22} className={isActive(['/courses']) ? 'text-accent' : ''} />
              <span className="text-[10px] tracking-wide">Cours</span>
            </button>

            {/* LE FAB CENTRAL */}
            <div className="relative -top-6 px-1">
              <button 
                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                className={`w-14 h-14 rounded-full bg-accent text-background flex items-center justify-center hover:bg-accent-strong transition-transform duration-300 shadow-apple cursor-pointer ${isActionMenuOpen ? 'rotate-45 scale-105' : 'hover:scale-105 active:scale-95'}`}
              >
                <Plus size={28} strokeWidth={2.5} />
              </button>
            </div>

            <button onClick={() => navigate('/study')} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors cursor-pointer w-[60px] ${isActive(['/study', '/session']) ? 'text-text font-bold' : 'text-text-muted hover:text-text'}`}>
              <Brain size={22} className={isActive(['/study', '/session']) ? 'text-accent' : ''} />
              <span className="text-[10px] tracking-wide">Révisions</span>
            </button>

            <button onClick={() => navigate('/documents')} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors cursor-pointer w-[60px] ${isActive(['/documents']) ? 'text-text font-bold' : 'text-text-muted hover:text-text'}`}>
              <Folder size={22} className={isActive(['/documents']) ? 'text-accent' : ''} />
              <span className="text-[10px] tracking-wide">Ressources</span>
            </button>

          </div>
        </nav>
      )}
    </div>
  );
}

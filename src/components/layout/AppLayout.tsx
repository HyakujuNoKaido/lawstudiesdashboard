import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, BrainCircuit, CalendarDays, UserRound, Plus, X, FileText, Upload, CalendarPlus } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Accueil', path: '/' },
  { icon: BookOpen, label: 'Cours', path: '/courses' },
  { icon: BrainCircuit, label: 'Réviser', path: '/study' },
  { icon: CalendarDays, label: 'Planning', path: '/schedule' },
  { icon: UserRound, label: 'Profil', path: '/profile' },
];

export function AppLayout() {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    setIsActionMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      
      {/* Navigation Desktop (Sidebar) */}
      <aside className="hidden md:flex w-64 flex-col bg-surface-elevated border-r border-border p-4 z-10">
        <div className="mb-8 px-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-surface rounded-md flex items-center justify-center border border-border overflow-hidden p-1">
            <img src="/pwa-192x192.png" alt="Lexi Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-serif text-xl tracking-wide">Lexi</span>
        </div>
        
        <button 
          onClick={() => setIsActionMenuOpen(true)}
          className="mb-8 w-full bg-accent text-background rounded-md py-2.5 px-4 flex items-center justify-center gap-2 font-medium hover:bg-accent-strong transition-colors"
        >
          <Plus size={20} />
          <span>Ajouter</span>
        </button>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    isActive ? 'bg-surface text-accent' : 'text-text-muted hover:text-text hover:bg-surface/50'
                  }`
                }
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Zone de contenu principale */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto z-0">
        <div className="w-full max-w-[430px] md:max-w-3xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Navigation Mobile (Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface-elevated border-t border-border pb-safe flex justify-around items-center h-16 px-2 z-40">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          
          if (index === 2) {
            return (
              <React.Fragment key="fab">
                <button 
                  onClick={() => setIsActionMenuOpen(true)}
                  className="w-12 h-12 bg-accent text-background rounded-full flex justify-center items-center -mt-6 shadow-lg active:scale-95 transition-transform"
                  aria-label="Ajouter"
                >
                  <Plus size={24} strokeWidth={2.5} />
                </button>
                <NavLink to={item.path} className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-accent' : 'text-text-muted'}`}>
                  <Icon size={22} strokeWidth={2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
              </React.Fragment>
            );
          }
          
          return (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-accent' : 'text-text-muted'}`}
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Menu d'actions (Bottom Sheet sur Mobile / Modal sur Desktop) */}
      {isActionMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-[430px] bg-surface-elevated border border-border rounded-t-2xl md:rounded-2xl p-6 pb-12 md:pb-6 animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-4 duration-300 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl">Créer</h2>
              <button 
                onClick={() => setIsActionMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface text-text-muted hover:text-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => handleAction('/add/course')} className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-text-muted/50 transition-colors text-left group">
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="font-medium">Nouveau cours</p>
                  <p className="text-xs text-text-muted">Ajouter une matière manuellement</p>
                </div>
              </button>

              <button onClick={() => handleAction('/import')} className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-text-muted/50 transition-colors text-left group">
                <div className="w-10 h-10 bg-info/10 text-info rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="font-medium">Importer un document</p>
                  <p className="text-xs text-text-muted">Plan d'études, horaire, relevé de notes</p>
                </div>
              </button>

              <button onClick={() => setIsActionMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-text-muted/50 transition-colors text-left group opacity-70">
                <div className="w-10 h-10 bg-warning/10 text-warning rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <p className="font-medium">Événement ou échéance</p>
                  <p className="text-xs text-text-muted">Ajouter un examen ou une tâche</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

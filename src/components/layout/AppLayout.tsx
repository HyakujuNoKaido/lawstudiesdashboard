import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { House, BookOpen, BrainCircuit, CalendarDays, UserRound, Plus } from 'lucide-react';

const navItems = [
  { icon: House, label: 'Accueil', path: '/' },
  { icon: BookOpen, label: 'Cours', path: '/courses' },
  { icon: BrainCircuit, label: 'Réviser', path: '/study' },
  { icon: CalendarDays, label: 'Planning', path: '/schedule' },
  { icon: UserRound, label: 'Profil', path: '/profile' },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Navigation Desktop (Sidebar) */}
      <aside className="hidden md:flex w-64 flex-col bg-surface-elevated border-r border-border p-4">
        <div className="mb-8 px-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-surface rounded-md flex items-center justify-center border border-border">
            <BookOpen className="text-accent" size={18} />
          </div>
          <span className="font-serif text-xl tracking-wide">Lexi</span>
        </div>
        
        <button className="mb-8 w-full bg-accent text-background rounded-md py-2.5 px-4 flex items-center justify-center gap-2 font-medium hover:bg-accent-strong transition-colors">
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
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <div className="w-full max-w-[430px] md:max-w-3xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Navigation Mobile (Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface-elevated border-t border-border pb-safe flex justify-around items-center h-16 px-2 z-50">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          
          if (index === 2) {
            return (
              <React.Fragment key="fab">
                {/* Bouton d'action flottant central */}
                <button 
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
    </div>
  );
}

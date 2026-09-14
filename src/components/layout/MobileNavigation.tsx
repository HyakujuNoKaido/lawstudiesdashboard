import React from 'react';
import { House, BookOpen, BrainCircuit, CalendarDays, UserRound, Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom'; // ou équivalent selon le routeur

const navItems = [
  { icon: House, label: 'Accueil', path: '/' },
  { icon: BookOpen, label: 'Cours', path: '/courses' },
  { icon: BrainCircuit, label: 'Réviser', path: '/study' },
  { icon: CalendarDays, label: 'Planning', path: '/schedule' },
  { icon: UserRound, label: 'Profil', path: '/profile' },
];

export function MobileNavigation() {
  return (
    <nav className="fixed bottom-0 w-full bg-surface-elevated border-t border-border pb-safe flex justify-around items-center h-16 md:hidden px-2">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        // Le bouton central "Plus"
        if (index === 2) {
          return (
            <React.Fragment key="fab">
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
  );
}

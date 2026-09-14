import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, BrainCircuit, Calendar, User } from 'lucide-react';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Accueil', path: '/', icon: Home },
    { label: 'Cours', path: '/courses', icon: BookOpen },
    { label: 'Révisions', path: '/study', icon: BrainCircuit },
    { label: 'Calendrier', path: '/schedule', icon: Calendar },
    { label: 'Profil', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-40 py-2 px-4">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-accent font-semibold scale-105' 
                  : 'text-text-muted hover:text-text font-normal'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]' : ''} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

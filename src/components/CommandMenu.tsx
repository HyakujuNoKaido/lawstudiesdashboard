import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, FileText, BrainCircuit, CalendarDays, X } from 'lucide-react';
import { fetchCourses } from '../services/supabaseService';

export function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCourses().then(setCourses);
    }
  }, [isOpen]);

  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-elevated border border-border rounded-xl shadow-2xl overflow-hidden">
        
        <div className="flex items-center px-4 border-b border-border">
          <Search size={18} className="text-text-muted mr-3" />
          <input 
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un cours, un arrêt ATF, une matière..."
            className="w-full bg-transparent py-4 text-sm text-text focus:outline-none"
          />
          <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto flex flex-col gap-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Navigation rapide</div>
          
          <button 
            onClick={() => { navigate('/courses'); setIsOpen(false); }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text hover:bg-surface transition-colors text-left"
          >
            <BookOpen size={16} className="text-accent" />
            <span>Tous les cours</span>
          </button>

          <button 
            onClick={() => { navigate('/study'); setIsOpen(false); }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text hover:bg-surface transition-colors text-left"
          >
            <BrainCircuit size={16} className="text-info" />
            <span>Sessions de révision (Flashcards)</span>
          </button>

          <button 
            onClick={() => { navigate('/schedule'); setIsOpen(false); }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text hover:bg-surface transition-colors text-left"
          >
            <CalendarDays size={16} className="text-warning" />
            <span>Planning académique</span>
          </button>

          {filteredCourses.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider mt-2">Cours enregistrés</div>
              {filteredCourses.map(c => (
                <button 
                  key={c.id}
                  onClick={() => { navigate(`/courses/${c.id}`); setIsOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text hover:bg-surface transition-colors text-left"
                >
                  <FileText size={16} className="text-text-muted" />
                  <span className="truncate">{c.title}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="px-4 py-2 bg-surface border-t border-border flex justify-between items-center text-[11px] text-text-muted">
          <span>Navigation par clavier supportée</span>
          <span>Échap pour fermer</span>
        </div>

      </div>
    </div>
  );
}

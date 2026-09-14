import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Calendar, BrainCircuit, User, Plus, X, Scale, FileText, Timer, Upload, FileEdit } from 'lucide-react';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background text-text flex flex-col antialiased selection:bg-accent/30 selection:text-accent">
      
      {/* Contenu principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-28">
        <Outlet />
      </main>

      {/* Menu d'actions rapides (Modal / Action Sheet) */}
      {isActionMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-300">
            
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <div>
                <h3 className="font-serif text-lg font-bold">Actions rapides</h3>
                <p className="text-xs text-text-muted">Créez vos livrables juridiques en un clic</p>
              </div>
              <button 
                onClick={() => setIsActionMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button 
                onClick={() => { setIsActionMenuOpen(false); navigate('/cases/law'); }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border border-border hover:border-accent/50 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-text">Nouvelle Fiche d'Arrêt (ATF)</p>
                  <p className="text-xs text-text-muted">Synthèse structurée de jurisprudence</p>
                </div>
              </button>

              <button 
                onClick={() => { setIsActionMenuOpen(false); navigate('/cases/study'); }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border border-border hover:border-accent/50 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Scale size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-text">Assistant de Subsumption</p>
                  <p className="text-xs text-text-muted">Résolution guidée de cas pratique</p>
                </div>
              </button>

              <button 
                onClick={() => { setIsActionMenuOpen(false); navigate('/exams/simulator'); }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border border-border hover:border-accent/50 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Timer size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-text">Examen Blanc Chronométré</p>
                  <p className="text-xs text-text-muted">Simulation d'épreuve avec compteur de mots</p>
                </div>
              </button>

              <button 
                onClick={() => { setIsActionMenuOpen(false); navigate('/add/course'); }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border border-border hover:border-accent/50 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-text">Nouveau Cours</p>
                  <p className="text-xs text-text-muted">Ajout de matière et horaires récurrents</p>
                </div>
              </button>

              <button 
                onClick={() => { setIsActionMenuOpen(false); navigate('/notes'); }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border border-border hover:border-accent/50 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-elevated text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileEdit size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-text">Nouvelle Note de Cours</p>
                  <p className="text-xs text-text-muted">Prise de notes synthétique</p>
                </div>
              </button>

              <button 
                onClick={() => { setIsActionMenuOpen(false); navigate('/import'); }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border border-border hover:border-accent/50 transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-elevated text-text-muted flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm text-text">Importation Document / Plan</p>
                  <p className="text-xs text-text-muted">Génération automatique des cours</p>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Barre de navigation inférieure (Bottom Nav) */}
      <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border px-4 py-2">
        <div className="max-w-md mx-auto flex items-center justify-around relative">
          
          <button 
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
              isActive('/') ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'
            }`}
          >
            <Home size={20} />
            <span className="text-[10px]">Accueil</span>
          </button>

          <button 
            onClick={() => navigate('/courses')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
              isActive('/courses') ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'
            }`}
          >
            <BookOpen size={20} />
            <span className="text-[10px]">Cours</span>
          </button>

          {/* Bouton FAB Central "+" */}
          <div className="relative -top-5">
            <button 
              onClick={() => setIsActionMenuOpen(true)}
              className="w-13 h-13 rounded-2xl bg-accent text-background flex items-center justify-center glow-gold hover:bg-accent-strong transition-transform active:scale-95 shadow-xl cursor-pointer"
              title="Actions rapides"
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
          </div>

          <button 
            onClick={() => navigate('/schedule')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
              isActive('/schedule') ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'
            }`}
          >
            <Calendar size={20} />
            <span className="text-[10px]">Planning</span>
          </button>

          <button 
            onClick={() => navigate('/study')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
              isActive('/study') ? 'text-accent font-semibold' : 'text-text-muted hover:text-text'
            }`}
          >
            <BrainCircuit size={20} />
            <span className="text-[10px]">Révisions</span>
          </button>

        </div>
      </nav>

    </div>
  );
}

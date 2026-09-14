import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Download, BrainCircuit, Search, MoreVertical } from 'lucide-react';

export function DocumentViewer() {
  const navigate = useNavigate();
  const { docId } = useParams();
  
  // État simulé de chargement
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-in slide-in-from-bottom-2 duration-300">
      
      {/* Barre d'outils supérieure */}
      <header className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-muted hover:text-text transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-text-muted font-medium truncate mb-0.5">Droit des obligations (CO)</p>
            <h1 className="text-sm font-semibold text-text truncate">Plan du cours 2026.pdf</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="hidden md:flex p-2 text-text-muted hover:text-text transition-colors" title="Rechercher">
            <Search size={18} />
          </button>
          <button className="p-2 text-text-muted hover:text-text transition-colors" title="Générer des flashcards">
            <BrainCircuit size={18} />
          </button>
          <button className="p-2 text-text-muted hover:text-text transition-colors" title="Télécharger">
            <Download size={18} />
          </button>
          <button className="p-2 text-text-muted hover:text-text transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Zone de lecture du document */}
      <main className="flex-1 bg-surface-elevated flex justify-center overflow-auto p-4 md:p-8">
        
        {/* Simulation du canvas de rendu PDF/DOCX */}
        <div className="w-full max-w-[800px] h-[1200px] bg-[#f8f7f2] rounded shadow-lg flex flex-col items-center justify-center p-12 text-[#090a0e]">
          {isLoading ? (
            <div className="animate-pulse flex flex-col items-center gap-4 text-[#9398a7]">
              <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />
              <p className="font-medium">Chargement du document...</p>
            </div>
          ) : (
            <div className="w-full h-full border-2 border-dashed border-[#2e3241]/20 flex flex-col items-center justify-center gap-4 opacity-50">
              <p className="font-serif text-2xl">Page 1</p>
              <p className="text-sm">Le moteur de rendu natif (ex: react-pdf) sera injecté ici.</p>
            </div>
          )}
        </div>

      </main>

      {/* Pagination / Contrôles inférieurs flottants */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border shadow-lg rounded-full px-4 py-2 flex items-center gap-4 text-sm font-medium">
        <button className="text-text-muted hover:text-text transition-colors">&lt;</button>
        <span>1 / 42</span>
        <button className="text-text-muted hover:text-text transition-colors">&gt;</button>
      </div>

    </div>
  );
}

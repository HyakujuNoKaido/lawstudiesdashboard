import React from 'react';
import { X, FolderInput, Archive, Trash2 } from 'lucide-react';

interface BulkSelectionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onMove?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function BulkSelectionToolbar({ selectedCount, onClear, onMove, onArchive, onDelete }: BulkSelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 fade-in">
      <div className="bg-surface-elevated border border-border/80 rounded-full px-5 py-3 shadow-apple flex items-center gap-4 text-text">
        <div className="flex items-center gap-3 pr-5 border-r border-border/50">
          <button 
            onClick={onClear} 
            className="p-1.5 bg-surface text-text-muted hover:text-text hover:bg-surface-interactive rounded-full transition-colors cursor-pointer"
            title="Annuler la sélection"
          >
            <X size={14} />
          </button>
          <span className="text-sm font-bold">{selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {onMove && (
            <button onClick={onMove} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-info hover:bg-info/10 rounded-full transition-colors cursor-pointer">
              <FolderInput size={16} /> <span className="hidden sm:inline">Déplacer</span>
            </button>
          )}
          {onArchive && (
            <button onClick={onArchive} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-warning hover:bg-warning/10 rounded-full transition-colors cursor-pointer">
              <Archive size={16} /> <span className="hidden sm:inline">Archiver</span>
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10 rounded-full transition-colors cursor-pointer">
              <Trash2 size={16} /> <span className="hidden sm:inline">Supprimer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit3, Copy, Archive, Trash2, FolderInput, Star, StarOff } from 'lucide-react';

interface ResourceMenuProps {
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onMove?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function ResourceMenu({ isFavorite, onToggleFavorite, onEdit, onDuplicate, onMove, onArchive, onDelete }: ResourceMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!onEdit && !onDuplicate && !onMove && !onArchive && !onDelete && !onToggleFavorite) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`w-8 h-8 rounded-btn flex items-center justify-center transition-colors cursor-pointer ${isOpen ? 'bg-surface-interactive text-text' : 'text-text-muted hover:bg-surface-interactive hover:text-text'}`}
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated border border-border/60 rounded-modal shadow-apple z-50 py-1.5 animate-in fade-in zoom-in-95">
          
          {onToggleFavorite && (
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onToggleFavorite(); }} className="w-full px-4 py-2 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer transition-colors">
              {isFavorite ? <StarOff size={15} className="text-warning" /> : <Star size={15} className="text-warning" />}
              {isFavorite ? 'Désépingler' : 'Épingler'}
            </button>
          )}
          
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit(); }} className="w-full px-4 py-2 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer transition-colors">
              <Edit3 size={15} className="text-text-muted" /> Modifier
            </button>
          )}
          {onDuplicate && (
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDuplicate(); }} className="w-full px-4 py-2 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer transition-colors">
              <Copy size={15} className="text-text-muted" /> Dupliquer
            </button>
          )}
          {onMove && (
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onMove(); }} className="w-full px-4 py-2 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer transition-colors">
              <FolderInput size={15} className="text-info" /> Déplacer vers...
            </button>
          )}
          {onArchive && (
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onArchive(); }} className="w-full px-4 py-2 text-sm text-text hover:bg-surface-interactive flex items-center gap-3 cursor-pointer transition-colors">
              <Archive size={15} className="text-warning" /> Archiver
            </button>
          )}
          
          {onDelete && (
            <>
              {(onEdit || onDuplicate || onMove || onArchive || onToggleFavorite) && <div className="h-px bg-border/50 my-1 mx-2"></div>}
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete(); }} className="w-full px-4 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-3 cursor-pointer transition-colors">
                <Trash2 size={15} /> Supprimer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

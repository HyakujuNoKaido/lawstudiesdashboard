import React, { useState } from 'react';
import { AlertTriangle, Archive, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: { chaptersCount?: number; cardsCount?: number; docsCount?: number; notesCount?: number };
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  allowCascadeOption?: boolean;
  onConfirm: (cascade: boolean, archiveOnly: boolean) => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  details,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isDanger = false,
  allowCascadeOption = false,
  onConfirm,
  onClose
}: ConfirmModalProps) {
  const [actionType, setActionType] = useState<'delete_all' | 'archive' | 'keep_content'>('delete_all');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface-elevated border border-border rounded-modal p-6 shadow-apple flex flex-col gap-5 animate-zoom-in text-text">
        
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDanger ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-text">{title}</h3>
          </div>
        </div>
        
        <p className="text-sm text-text-muted leading-relaxed">
          {message}
        </p>

        {/* Détails en cascade si fournis */}
        {details && (
          <div className="bg-surface border border-border/60 rounded-card p-3.5 flex flex-col gap-1.5 text-xs text-text-muted font-mono">
            <span className="font-bold text-text uppercase tracking-wider text-[10px]">Contenu détecté :</span>
            {details.chaptersCount !== undefined && <span>• {details.chaptersCount} chapitres</span>}
            {details.cardsCount !== undefined && <span>• {details.cardsCount} flashcards</span>}
            {details.docsCount !== undefined && <span>• {details.docsCount} documents</span>}
            {details.notesCount !== undefined && <span>• {details.notesCount} notes</span>}
          </div>
        )}

        {/* Options de cascade (Point 8) */}
        {allowCascadeOption && (
          <div className="flex flex-col gap-2.5 bg-surface p-3.5 rounded-card border border-border/50">
            <label className="flex items-center gap-2.5 text-xs font-medium text-text cursor-pointer">
              <input 
                type="radio" name="cascadeOpt" checked={actionType === 'delete_all'} 
                onChange={() => setActionType('delete_all')} className="accent-danger" 
              />
              <span>Supprimer le cours et tout son contenu</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs font-medium text-text cursor-pointer">
              <input 
                type="radio" name="cascadeOpt" checked={actionType === 'archive'} 
                onChange={() => setActionType('archive')} className="accent-warning" 
              />
              <span className="flex items-center gap-1.5"><Archive size={14} className="text-warning"/> Archiver le cours (Récupérable)</span>
            </label>
          </div>
        )}
        
        <div className="flex gap-2.5 mt-2">
          <button 
            type="button" onClick={onClose}
            className="flex-1 bg-surface border border-border text-text py-3 rounded-btn text-sm font-medium hover:bg-surface-interactive transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button 
            type="button"
            onClick={() => { 
              onConfirm(actionType === 'delete_all', actionType === 'archive'); 
              onClose(); 
            }}
            className={`flex-1 py-3 rounded-btn text-sm font-bold transition-all cursor-pointer shadow-sm ${
              actionType === 'archive' 
                ? 'bg-warning text-background hover:bg-warning/90' 
                : isDanger ? 'bg-danger text-white hover:bg-danger/90' : 'bg-accent text-background glow-gold'
            }`}
          >
            {actionType === 'archive' ? 'Archiver' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

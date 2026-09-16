import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isDanger = false,
  onConfirm,
  onClose
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface-elevated border border-border rounded-modal p-6 shadow-apple flex flex-col gap-4 animate-zoom-in text-text">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDanger ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-text">{title}</h3>
          </div>
        </div>
        
        <p className="text-sm text-text-muted leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-2 mt-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 bg-surface border border-border text-text py-2.5 rounded-btn text-sm font-medium hover:bg-surface-interactive transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button 
            type="button"
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-2.5 rounded-btn text-sm font-bold transition-all cursor-pointer ${
              isDanger 
                ? 'bg-danger text-white hover:bg-danger/90' 
                : 'bg-accent text-background hover:bg-accent-strong glow-gold'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

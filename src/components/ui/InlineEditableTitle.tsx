import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Check, Loader2, X } from 'lucide-react';
import { toast } from '../../lib/toast';

interface InlineEditableTitleProps {
  initialTitle: string;
  onSave: (newTitle: string) => Promise<void>;
  textClass?: string;
  placeholder?: string;
}

export function InlineEditableTitle({ initialTitle, onSave, textClass = 'text-3xl font-bold font-serif', placeholder = 'Titre...' }: InlineEditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle === initialTitle) {
      setIsEditing(false);
      setTitle(initialTitle);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedTitle);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setTitle(initialTitle); // Rollback en cas d'erreur
      toast("Impossible d'enregistrer la modification.", "error");
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setTitle(initialTitle);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full animate-in fade-in duration-200">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving}
          className={`flex-1 bg-surface-elevated border border-accent rounded-input px-3 py-1 text-text focus:outline-none focus:ring-2 focus:ring-accent/30 ${textClass}`}
        />
        <div className="flex items-center gap-1 shrink-0">
          {isSaving ? (
            <div className="p-2 text-accent"><Loader2 size={20} className="animate-spin" /></div>
          ) : (
            <>
              <button onClick={handleSave} className="p-2 bg-success/10 text-success hover:bg-success/20 rounded-btn transition-colors cursor-pointer">
                <Check size={20} />
              </button>
              <button onClick={() => { setTitle(initialTitle); setIsEditing(false); }} className="p-2 bg-surface text-text-muted hover:bg-surface-interactive rounded-btn transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 group relative w-fit max-w-full">
      <h1 className={`${textClass} text-text truncate`} title={title}>
        {title}
      </h1>
      <div className="flex items-center gap-2 shrink-0">
        {showSuccess && <Check size={18} className="text-success animate-in zoom-in fade-in" />}
        <button 
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-text-muted opacity-0 group-hover:opacity-100 hover:text-accent hover:bg-surface-interactive rounded-md transition-all cursor-pointer"
          title="Modifier le titre"
        >
          <Edit3 size={18} />
        </button>
      </div>
    </div>
  );
}

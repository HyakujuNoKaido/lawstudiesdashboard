import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CloudFog, Scale, AlertTriangle, Book, Check, MoreVertical } from 'lucide-react';

type BlockType = 'text' | 'rule' | 'jurisprudence' | 'exception';

interface EditorBlock {
  id: string;
  type: BlockType;
  content: string;
}

const INITIAL_BLOCKS: EditorBlock[] = [
  { id: '1', type: 'rule', content: 'Art. 41 al. 1 CO\nCelui qui cause, d\'une manière illicite, un dommage à autrui, soit de dessein, soit par négligence, est tenu de le réparer.' },
  { id: '2', type: 'text', content: 'Les quatre conditions cumulatives sont donc le préjudice, l\'acte illicite, le lien de causalité et la faute.' },
  { id: '3', type: 'jurisprudence', content: 'ATF 132 III 122 (Arrêt de principe)\nLe Tribunal fédéral précise que la causalité adéquate sert de limite à l\'imputation du dommage.' }
];

export function StudyNoteEditor() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Responsabilité civile extracontractuelle');
  const [blocks, setBlocks] = useState<EditorBlock[]>(INITIAL_BLOCKS);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Simulation d'une sauvegarde automatique
  const handleBlockChange = (id: string, newContent: string) => {
    setSaveStatus('saving');
    setBlocks(blocks.map(b => b.id === id ? { ...b, content: newContent } : b));
    setTimeout(() => setSaveStatus('saved'), 1000);
  };

  const addBlock = (type: BlockType) => {
    setBlocks([...blocks, { id: Math.random().toString(36).substr(2, 9), type, content: '' }]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col animate-in fade-in duration-300">
      
      {/* Barre d'outils supérieure */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-text-muted hover:text-text transition-colors rounded-md"
            aria-label="Retour"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
            {saveStatus === 'saving' ? (
              <><CloudFog size={14} className="animate-pulse" /> Enregistrement...</>
            ) : (
              <><Check size={14} className="text-success" /> Enregistré</>
            )}
          </div>
        </div>

        <button className="p-2 text-text-muted hover:text-text transition-colors">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Zone d'édition */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 md:pt-12 pb-32">
        <input 
          type="text" 
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSaveStatus('saving'); setTimeout(() => setSaveStatus('saved'), 1000); }}
          className="w-full bg-transparent text-3xl md:text-4xl font-serif text-text placeholder:text-text-muted/50 border-none outline-none mb-8 resize-none"
          placeholder="Titre de la fiche..."
        />

        <div className="flex flex-col gap-4">
          {blocks.map((block) => (
            <div key={block.id} className="relative group">
              {block.type === 'rule' && (
                <div className="flex gap-3 bg-surface border border-border p-4 rounded-md">
                  <Book size={18} className="text-accent shrink-0 mt-0.5" />
                  <textarea
                    value={block.content}
                    onChange={(e) => handleBlockChange(block.id, e.target.value)}
                    className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none min-h-[60px]"
                    placeholder="Saisissez la règle de droit..."
                  />
                </div>
              )}

              {block.type === 'jurisprudence' && (
                <div className="flex gap-3 bg-info/5 border border-info/20 p-4 rounded-md">
                  <Scale size={18} className="text-info shrink-0 mt-0.5" />
                  <textarea
                    value={block.content}
                    onChange={(e) => handleBlockChange(block.id, e.target.value)}
                    className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none min-h-[60px]"
                    placeholder="Saisissez la jurisprudence (ex: ATF 123 III 456)..."
                  />
                </div>
              )}

              {block.type === 'exception' && (
                <div className="flex gap-3 bg-warning/5 border border-warning/20 p-4 rounded-md">
                  <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                  <textarea
                    value={block.content}
                    onChange={(e) => handleBlockChange(block.id, e.target.value)}
                    className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none min-h-[60px]"
                    placeholder="Saisissez l'exception à la règle..."
                  />
                </div>
              )}

              {block.type === 'text' && (
                <textarea
                  value={block.content}
                  onChange={(e) => handleBlockChange(block.id, e.target.value)}
                  className="w-full bg-transparent text-text text-base leading-relaxed outline-none resize-none min-h-[40px] px-1"
                  placeholder="Appuyez pour écrire..."
                />
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Barre d'ajout de blocs (Fixe en bas) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-surface-elevated border-t border-border p-3 pb-safe z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide px-2">
          <button onClick={() => addBlock('text')} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface text-sm font-medium text-text-muted hover:text-text transition-colors whitespace-nowrap">
            <span className="text-lg leading-none font-serif">T</span> Texte
          </button>
          <div className="w-px h-6 bg-border mx-1 shrink-0" />
          <button onClick={() => addBlock('rule')} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface text-sm font-medium text-text-muted hover:text-accent transition-colors whitespace-nowrap">
            <Book size={16} /> Règle
          </button>
          <button onClick={() => addBlock('jurisprudence')} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface text-sm font-medium text-text-muted hover:text-info transition-colors whitespace-nowrap">
            <Scale size={16} /> Jurisprudence
          </button>
          <button onClick={() => addBlock('exception')} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface text-sm font-medium text-text-muted hover:text-warning transition-colors whitespace-nowrap">
            <AlertTriangle size={16} /> Exception
          </button>
        </div>
      </footer>

    </div>
  );
}

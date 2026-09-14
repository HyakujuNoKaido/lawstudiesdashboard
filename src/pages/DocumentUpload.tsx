import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UploadCloud, FileType2, Save } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function DocumentUpload() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation : Retourne au cours après l'upload
    navigate('/courses/1'); 
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Annuler</span>
        </button>

        <div>
          <h1 className="font-serif text-3xl mb-1">Ajouter un document</h1>
          <p className="text-text-muted text-sm">Importez un support de cours (PDF, Word, PowerPoint).</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Zone de Drag & Drop */}
        <div 
          className={`relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors ${
            dragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-text-muted/50 hover:bg-surface'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mb-1">
                <FileType2 size={24} />
              </div>
              <p className="font-medium text-sm text-text">{selectedFile.name}</p>
              <p className="text-xs text-text-muted">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-surface-elevated text-text-muted rounded-full flex items-center justify-center mb-1">
                <UploadCloud size={24} />
              </div>
              <p className="font-medium text-sm text-text">Appuyez pour choisir un fichier</p>
              <p className="text-xs text-text-muted">ou glissez-déposez le document ici</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">Titre du document</label>
          <input 
            type="text" 
            required
            defaultValue={selectedFile ? selectedFile.name.split('.')[0] : ''}
            placeholder="ex: Support Séminaire 01"
            className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Cours associé</label>
            <select className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors appearance-none">
              <option value="1">Droit des obligations (CO)</option>
              <option value="2">Droit pénal général</option>
              <option value="3">Introduction à l'économie</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Type de document</label>
            <select className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors appearance-none">
              <option value="support">Support de cours / Slides</option>
              <option value="consignes">Consignes / Cas pratique</option>
              <option value="resume">Résumé personnel</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>

        <button 
          type="submit"
          disabled={!selectedFile}
          className="mt-4 w-full bg-accent text-background rounded-md py-3.5 px-4 flex items-center justify-center gap-2 font-medium hover:bg-accent-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          <span>Enregistrer le document</span>
        </button>

      </form>
    </div>
  );
}

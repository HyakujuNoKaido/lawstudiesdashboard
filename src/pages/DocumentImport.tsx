import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UploadCloud, FileType2, Save, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SOLO_USER_ID = '00000000-0000-0000-0000-000000000000';

export function DocumentImport() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState("Plan d'études");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `import_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${SOLO_USER_ID}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            user_id: SOLO_USER_ID,
            course_id: null,
            bucket_path: filePath,
            original_name: selectedFile.name,
            mime_type: selectedFile.type,
            size_bytes: selectedFile.size,
            document_type: importType,
            processing_status: 'completed'
          }
        ]);

      if (dbError) throw dbError;

      alert("Document global importé avec succès !");
      navigate('/');
    } catch (error: any) {
      console.error("Erreur import global:", error);
      alert("Échec de l'importation du fichier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>

        <div>
          <h1 className="font-serif text-3xl mb-1">Importation globale</h1>
          <p className="text-text-muted text-sm">Importez votre plan d'études, relevé de notes officiel ou règlement.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">Type d'importation académique</label>
          <select 
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
            className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors appearance-none"
          >
            <option value="Plan d'études">Plan d'études officiel</option>
            <option value="Relevé de notes">Relevé de notes officiel</option>
            <option value="Règlement d'études">Règlement / Directives d'examen</option>
            <option value="Autre">Autre document institutionnel</option>
          </select>
        </div>

        <div className="relative border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-accent/50 hover:bg-surface transition-colors">
          <input 
            type="file" 
            required
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
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
                <FileSpreadsheet size={24} />
              </div>
              <p className="font-medium text-sm text-text">Sélectionnez le document à importer</p>
              <p className="text-xs text-text-muted">PDF, Word ou Tableur (Excel/CSV)</p>
            </div>
          )}
        </div>

        <button 
          type="submit"
          disabled={!selectedFile || loading}
          className="mt-4 w-full bg-accent text-background rounded-md py-3.5 px-4 flex items-center justify-center gap-2 font-medium hover:bg-accent-strong transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          <span>{loading ? 'Traitement en cours...' : 'Importer et enregistrer'}</span>
        </button>

      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UploadCloud, FileType2, Save, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createMultipleCourses } from '../services/supabaseService';

const SOLO_USER_ID = '00000000-0000-0000-0000-000000000000';

export function DocumentImport() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState("Plan d'études");
  const [loading, setLoading] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<any[] | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Simulation d'extraction intelligente de plan d'études en droit suisse (ex: UNIL/UNIGE)
      // Si c'est un plan d'études, on génère un aperçu des matières types détectées
      if (importType === "Plan d'études") {
        setExtractedPreview([
          { title: "Droit des obligations I (Contrats)", course_code: "DRO-301", ects: 6, status: "En cours" },
          { title: "Droit administratif général", course_code: "DRA-302", ects: 6, status: "En cours" },
          { title: "Droit pénal général", course_code: "DRP-303", ects: 5, status: "En cours" },
          { title: "Procédure civile suisse", course_code: "PRC-304", ects: 6, status: "À venir" },
          { title: "Droit international public", course_code: "DIP-305", ects: 4, status: "À venir" }
        ]);
      }
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

      // 1. Upload du fichier dans le storage
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Enregistrement du document global
      await supabase.from('documents').insert([{
        user_id: SOLO_USER_ID,
        bucket_path: filePath,
        original_name: selectedFile.name,
        mime_type: selectedFile.type,
        size_bytes: selectedFile.size,
        document_type: importType,
        processing_status: 'completed'
      }]);

      // 3. Si c'est un plan d'études, on crée automatiquement les cours dans la base
      if (importType === "Plan d'études" && extractedPreview) {
        await createMultipleCourses(extractedPreview);
      }

      alert("Plan d'études importé et matières synchronisées avec succès !");
      navigate('/courses');
    } catch (error: any) {
      console.error("Erreur import global:", error);
      alert("Échec de l'importation du fichier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 text-text max-w-xl mx-auto w-full">
      
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>

        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Importation académique</h1>
          <p className="text-text-muted text-xs">Importez votre plan d'études officiel pour générer automatiquement vos cours et crédits ECTS.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-muted">Type d'importation</label>
          <select 
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none"
          >
            <option value="Plan d'études">Plan d'études officiel (Génération auto des cours)</option>
            <option value="Relevé de notes">Relevé de notes officiel</option>
            <option value="Règlement d'études">Règlement / Directives d'examen</option>
          </select>
        </div>

        <div className="relative border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-accent/50 hover:bg-surface-elevated transition-colors">
          <input 
            type="file" 
            required
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-success/10 text-success rounded-2xl flex items-center justify-center mb-1">
                <FileType2 size={24} />
              </div>
              <p className="font-medium text-sm text-text">{selectedFile.name}</p>
              <p className="text-xs text-text-muted">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-surface-elevated text-text-muted rounded-2xl flex items-center justify-center mb-1">
                <FileSpreadsheet size={24} />
              </div>
              <p className="font-medium text-sm text-text">Sélectionnez le document à importer</p>
              <p className="text-xs text-text-muted">PDF, Word ou Tableur (Excel/CSV)</p>
            </div>
          )}
        </div>

        {/* Aperçu des cours extraits automatiquement */}
        {extractedPreview && importType === "Plan d'études" && (
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Matières détectées et prêtes à être créées</h3>
            </div>
            <div className="flex flex-col gap-2">
              {extractedPreview.map((c, idx) => (
                <div key={idx} className="flex justify-between items-center bg-surface-elevated p-3 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-success" />
                    <span className="font-medium text-text">{c.title}</span>
                  </div>
                  <span className="text-text-muted">{c.ects} ECTS</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          type="submit"
          disabled={!selectedFile || loading}
          className="mt-2 w-full bg-accent text-background rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold glow-gold hover:bg-accent-strong transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save size={18} />
          <span>{loading ? 'Traitement et synchronisation...' : "Importer et générer les cours"}</span>
        </button>

      </form>
    </div>
  );
}

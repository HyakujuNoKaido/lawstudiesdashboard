import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Download, FileText, AlertCircle, Trash2, Edit3, RefreshCcw, FileEdit, BrainCircuit, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { deleteDocument, updateDocumentMetadata, replaceDocumentFile } from '../services/supabaseService';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { toast } from '../lib/toast';

export function DocumentViewer() {
  const navigate = useNavigate();
  const { docId } = useParams();
  
  const [document, setDocument] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les actions
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (docId) {
      loadDocument();
    }
  }, [docId]);

  async function loadDocument() {
    setLoading(true);
    try {
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();
        
      if (docError) throw docError;
      setDocument(docData);
      setNewName(docData.original_name);
      
      const { data: urlData, error: urlError } = await supabase.storage
        .from('user-documents')
        .createSignedUrl(docData.bucket_path, 3600);
        
      if (urlError) throw urlError;
      setFileUrl(urlData.signedUrl);
    } catch (err: any) {
      console.error("Erreur de chargement du document:", err);
      setError("Impossible de charger le document.");
    } finally {
      setLoading(false);
    }
  }

  // Action : Renommer
  const handleRename = async () => {
    if (!newName.trim() || newName === document.original_name) {
      setIsRenaming(false);
      return;
    }
    try {
      await updateDocumentMetadata(document.id, { 
        original_name: newName, 
        document_type: document.document_type 
      });
      setDocument({ ...document, original_name: newName });
      setIsRenaming(false);
      toast("Document renommé", "success");
    } catch (err) {
      toast("Erreur lors du renommage", "error");
    }
  };

  // Action : Remplacer (déclenché par le input caché)
  const handleFileReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !document) return;
    
    setIsReplacing(true);
    toast("Remplacement du fichier en cours...", "info");
    try {
      await replaceDocumentFile(document.id, file, document.bucket_path);
      toast("Fichier mis à jour avec succès", "success");
      loadDocument(); // Recharge l'URL signée
    } catch (err) {
      console.error(err);
      toast("Échec du remplacement", "error");
    } finally {
      setIsReplacing(false);
    }
  };

  // Action : Supprimer
  const confirmDelete = async () => {
    if (!document) return;
    try {
      await deleteDocument(document.id, document.bucket_path);
      toast("Document supprimé", "success");
      navigate(-1);
    } catch (err) {
      toast("Erreur lors de la suppression", "error");
    }
  };

  const isPdf = document?.mime_type === 'application/pdf' || document?.original_name?.toLowerCase().endsWith('.pdf');
  const isOffice = document?.original_name?.match(/\.(docx?|pptx?)$/i);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-in slide-in-from-bottom-2 duration-300">
      
      {/* HEADER & TOOLBAR */}
      <header className="flex flex-col border-b border-border bg-surface shrink-0">
        <div className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-elevated border border-border text-text-muted hover:text-text transition-colors shrink-0 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-surface-elevated px-2 py-0.5 rounded-md">
                  {document?.document_type || 'Document'}
                </span>
                {isPdf && <span className="text-[9px] font-mono text-danger border border-danger/30 bg-danger/10 px-1.5 rounded">PDF</span>}
                {isOffice && <span className="text-[9px] font-mono text-info border border-info/30 bg-info/10 px-1.5 rounded">OFFICE</span>}
              </div>
              
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    className="bg-background border border-border rounded px-2 py-1 text-sm font-semibold focus:border-accent w-full max-w-[200px]"
                  />
                  <button onClick={handleRename} className="p-1 text-success hover:bg-success/10 rounded"><Check size={16}/></button>
                  <button onClick={() => setIsRenaming(false)} className="p-1 text-text-muted hover:bg-surface-elevated rounded"><X size={16}/></button>
                </div>
              ) : (
                <h1 
                  onDoubleClick={() => setIsRenaming(true)}
                  className="text-sm md:text-base font-semibold text-text truncate cursor-text"
                  title="Double-cliquez pour renommer"
                >
                  {document ? document.original_name : 'Chargement...'}
                </h1>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {fileUrl && (
              <a 
                href={fileUrl} 
                download={document?.original_name}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:bg-surface-elevated hover:text-text transition-colors"
                title="Télécharger"
              >
                <Download size={18} />
              </a>
            )}
          </div>
        </div>

        {/* BARRE D'OUTILS HORIZONTALE */}
        <div className="flex items-center gap-2 px-3 md:px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => navigate('/notes')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileEdit size={14} /> Créer une note
          </button>
          
          <button 
            onClick={() => navigate('/add/flashcards/batch')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-info/10 border border-info/20 text-info rounded-lg text-xs font-medium hover:bg-info/20 transition-colors whitespace-nowrap cursor-pointer"
          >
            <BrainCircuit size={14} /> Créer Flashcards
          </button>
          
          <div className="w-px h-4 bg-border mx-1"></div>

          <button 
            onClick={() => setIsRenaming(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-border text-text-muted rounded-lg text-xs hover:text-text transition-colors whitespace-nowrap cursor-pointer"
          >
            <Edit3 size={14} /> Renommer
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isReplacing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-border text-text-muted rounded-lg text-xs hover:text-text transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <RefreshCcw size={14} className={isReplacing ? "animate-spin" : ""} /> Remplacer
          </button>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileReplace} accept=".pdf,.doc,.docx,.ppt,.pptx" />

          <button 
            onClick={() => setIsDeleting(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/5 border border-danger/20 text-danger rounded-lg text-xs hover:bg-danger/10 transition-colors whitespace-nowrap cursor-pointer ml-auto"
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </header>

      {/* VIEWER CONTENU */}
      <main className="flex-1 bg-background flex flex-col items-center justify-center overflow-auto p-4 md:p-8">
        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4 text-text-muted">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium font-mono">Déchiffrement du document...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-danger max-w-sm text-center bg-danger/10 border border-danger/20 p-6 rounded-2xl">
            <AlertCircle size={32} />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => navigate(-1)} className="mt-2 px-4 py-2 bg-background border border-danger/30 text-danger text-xs font-bold rounded-lg hover:bg-danger/20">
              Fermer
            </button>
          </div>
        ) : isPdf && fileUrl ? (
          <iframe 
            src={`${fileUrl}#toolbar=0`} 
            title={document.original_name}
            className="w-full h-full max-w-5xl bg-surface rounded-xl border border-border shadow-2xl"
          />
        ) : isOffice && fileUrl ? (
          <div className="w-full max-w-md bg-surface border-y border-r border-l-[4px] border-l-info border-y-border border-r-border rounded-r-xl p-8 flex flex-col items-center text-center gap-4 shadow-xl">
            <div className="w-16 h-16 bg-info/10 text-info rounded-xl flex items-center justify-center">
              <FileText size={32} />
            </div>
            <div>
              <h2 className="font-serif text-xl mb-1">{document.original_name}</h2>
              <p className="text-xs text-text-muted leading-relaxed">
                Les documents Office (.docx, .pptx) nécessitent l'application native pour être affichés correctement.
              </p>
            </div>
            <a 
              href={fileUrl}
              download={document.original_name}
              className="w-full bg-info text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold hover:bg-info/90 transition-colors shadow-lg shadow-info/20 mt-2"
            >
              <Download size={18} />
              <span>Télécharger le fichier</span>
            </a>
          </div>
        ) : (
          <div className="text-center text-text-muted text-sm border border-dashed border-border p-8 rounded-xl">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            Format de fichier non pris en charge pour l'aperçu direct. <br/> Veuillez le télécharger.
          </div>
        )}
      </main>

      {/* Modal de suppression */}
      <ConfirmModal 
        isOpen={isDeleting}
        title="Supprimer ce document ?"
        message="Le fichier sera définitivement supprimé de la base. Les notes et flashcards qui lui sont potentiellement liées devront être supprimées manuellement si nécessaire."
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDanger={true}
        onConfirm={confirmDelete}
        onClose={() => setIsDeleting(false)}
      />
    </div>
  );
}

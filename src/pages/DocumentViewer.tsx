import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Download, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function DocumentViewer() {
  const navigate = useNavigate();
  const { docId } = useParams();
  const [document, setDocument] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) return;

    async function loadDocument() {
      try {
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', docId)
          .single();

        if (docError) throw docError;
        setDocument(docData);

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

    loadDocument();
  }, [docId]);

  const isPdf = document?.mime_type === 'application/pdf' || document?.original_name?.toLowerCase().endsWith('.pdf');
  const isOffice = document?.original_name?.match(/\.(docx?|pptx?)$/i);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-in slide-in-from-bottom-2 duration-300">
      
      <header className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-text-muted hover:text-text transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-text-muted font-medium truncate mb-0.5">Support de cours</p>
            <h1 className="text-sm font-semibold text-text truncate">
              {document ? document.original_name : 'Chargement...'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {fileUrl && (
            <a 
              href={fileUrl} 
              download={document?.original_name}
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-text-muted hover:text-text transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Télécharger"
            >
              <Download size={18} />
              <span className="hidden md:inline">Télécharger</span>
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 bg-surface-elevated flex flex-col items-center justify-center overflow-auto p-4 md:p-8">
        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4 text-text-muted">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Récupération sécurisée du fichier...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-danger max-w-sm text-center">
            <AlertCircle size={32} />
            <p className="text-sm">{error}</p>
            <button onClick={() => navigate(-1)} className="mt-2 px-4 py-2 bg-surface border border-border text-text text-xs rounded">
              Retour
            </button>
          </div>
        ) : isPdf && fileUrl ? (
          <iframe 
            src={`${fileUrl}#toolbar=0`} 
            title={document.original_name}
            className="w-full h-full max-w-[900px] bg-background rounded border border-border shadow-md"
          />
        ) : isOffice && fileUrl ? (
          <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 flex flex-col items-center text-center gap-4 shadow-lg">
            <div className="w-16 h-16 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
              <FileText size={32} />
            </div>
            <div>
              <h2 className="font-serif text-xl mb-1">{document.original_name}</h2>
              <p className="text-xs text-text-muted">
                Les documents Word (.docx) et PowerPoint (.pptx) s'ouvrent de manière optimale via le téléchargement ou l'application dédiée sur votre appareil.
              </p>
            </div>
            <a 
              href={fileUrl}
              download={document.original_name}
              className="w-full bg-accent text-background rounded-md py-3 px-4 flex items-center justify-center gap-2 font-medium hover:bg-accent-strong transition-colors text-sm"
            >
              <Download size={18} />
              <span>Télécharger le fichier</span>
            </a>
          </div>
        ) : (
          <div className="text-center text-text-muted text-sm">
            Format de fichier non pris en charge pour l'aperçu direct.
          </div>
        )}
      </main>

    </div>
  );
}

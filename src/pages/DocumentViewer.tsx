import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Download, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export function DocumentViewer() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  
  const [documentMeta, setDocumentMeta] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // États de virtualisation / pagination PDF (Point 19)
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageRendering, setPageRendering] = useState(false);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (docId) loadDocument();
  }, [docId]);

  async function loadDocument() {
    setLoading(true);
    try {
      const { data: doc, error } = await supabase
        .from('documents')
        .select('*, courses(title)')
        .eq('id', docId)
        .single();
      
      if (error || !doc) throw new Error("Document introuvable");
      setDocumentMeta(doc);

      const { data: urlData } = await supabase.storage
        .from('user-documents')
        .createSignedUrl(doc.bucket_path, 3600);

      if (urlData?.signedUrl) {
        setPdfUrl(urlData.signedUrl);
        initPdfViewer(urlData.signedUrl);
      }
    } catch (err) {
      toast("Impossible de charger le fichier", "error");
    } finally {
      setLoading(false);
    }
  }

  async function initPdfViewer(url: string) {
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      renderPage(1, pdf);
    } catch (err) {
      console.error("Erreur chargement PDF.js", err);
    }
  }

  async function renderPage(num: number, pdf = pdfDoc) {
    if (!pdf) return;
    setPageRendering(true);
    try {
      const page = await pdf.getPage(num);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      setPageNum(num);
    } catch (err) {
      console.error("Erreur rendu page", err);
    } finally {
      setPageRendering(false);
    }
  }

  const handlePrevPage = () => {
    if (pageNum <= 1 || pageRendering) return;
    renderPage(pageNum - 1);
  };

  const handleNextPage = () => {
    if (pageNum >= numPages || pageRendering) return;
    renderPage(pageNum + 1);
  };

  if (loading) {
    return <div className="text-center py-24 text-text-muted font-mono animate-pulse">Chargement sécurisé du document...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-text overflow-hidden">
      {/* HEADER DU VIEWER */}
      <header className="flex items-center justify-between px-6 py-3 bg-surface border-b border-border shrink-0 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate(-1)} className="p-2 bg-surface-elevated hover:bg-surface-interactive border border-border rounded-lg text-text-muted hover:text-text transition-colors cursor-pointer">
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="font-serif font-bold text-base truncate text-text">{documentMeta?.original_name}</h1>
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-mono">{documentMeta?.courses?.title || 'Général'}</p>
          </div>
        </div>

        {/* CONTRÔLES DE PAGINATION DU PDF (Point 19) */}
        {numPages > 0 && (
          <div className="flex items-center gap-3 bg-surface-elevated border border-border px-3 py-1.5 rounded-full shadow-inner">
            <button disabled={pageNum <= 1 || pageRendering} onClick={handlePrevPage} className="p-1 hover:text-accent disabled:opacity-30 cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-mono font-bold">Page {pageNum} / {numPages}</span>
            <button disabled={pageNum >= numPages || pageRendering} onClick={handleNextPage} className="p-1 hover:text-accent disabled:opacity-30 cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-elevated hover:bg-surface-interactive border border-border rounded-lg text-text-muted hover:text-text transition-colors cursor-pointer" title="Ouvrir dans un nouvel onglet">
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </header>

      {/* CONTENEUR DE RENDU PDF UNIQUE (Évite de saturer la mémoire vive) */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-6 bg-background/50 relative">
        {pageRendering && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xs flex items-center justify-center z-10">
            <Loader2 size={32} className="animate-spin text-accent" />
          </div>
        )}
        <div className="bg-surface border border-border/80 rounded-card shadow-apple p-4 max-w-full overflow-auto flex justify-center">
          <canvas id="pdf-canvas" className="max-w-full h-auto rounded shadow-sm" />
        </div>
      </main>
    </div>
  );
}

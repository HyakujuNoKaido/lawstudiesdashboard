import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Maximize, Minimize, PanelRightOpen, PanelRightClose, Sparkles, FileText, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

export function DocumentViewer() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  
  const [document, setDoc] = useState<any>(null);
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // États pour la lecture
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // État de l'IA
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    async function loadDoc() {
      if (!docId) return;
      try {
        const { data: docData, error } = await supabase
          .from('documents')
          .select('*, courses(title)')
          .eq('id', docId)
          .single();
          
        if (error) throw error;
        setDoc(docData);

        // Récupérer l'URL sécurisée du PDF
        const { data: urlData } = await supabase.storage
          .from('user-documents')
          .createSignedUrl(docData.bucket_path, 3600); // Valide 1 heure
          
        if (urlData?.signedUrl) {
          setPublicUrl(urlData.signedUrl);
        }

        // Tenter de charger une note associée (basée sur le titre du document)
        const { data: existingNote } = await supabase
          .from('notes')
          .select('*')
          .ilike('title', `%${docData.original_name}%`)
          .limit(1);
        
        if (existingNote && existingNote.length > 0) {
          setNoteContent(existingNote[0].content);
        }

      } catch (err) {
        console.error(err);
        toast("Impossible de charger le document", "error");
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [docId]);

  const handleSaveNote = async () => {
    if (!document) return;
    setIsSavingNote(true);
    try {
      // Sauvegarde simple de la note (on vérifie s'il faut insert ou update)
      const { data: existingNote } = await supabase.from('notes').select('id').ilike('title', `%${document.original_name}%`).limit(1);
      
      if (existingNote && existingNote.length > 0) {
        await supabase.from('notes').update({ content: noteContent, updated_at: new Date().toISOString() }).eq('id', existingNote[0].id);
      } else {
        await supabase.from('notes').insert([{
          user_id: document.user_id,
          course_id: document.course_id,
          title: `Notes sur : ${document.original_name}`,
          content: noteContent
        }]);
      }
      toast("Notes sauvegardées", "success");
    } catch (err) {
      toast("Erreur lors de la sauvegarde", "error");
    } finally {
      setIsSavingNote(false);
    }
  };

  const isPdf = document?.mime_type === 'application/pdf' || document?.original_name?.toLowerCase().endsWith('.pdf');

  if (loading) return <div className="text-center p-12 text-text-muted font-mono animate-pulse">Chargement du document...</div>;
  if (!document) return <div className="text-center p-12 text-text-muted">Document introuvable</div>;

  return (
    <div className={`flex flex-col bg-background transition-all duration-300 ${isFocusMode ? 'fixed inset-0 z-50 p-2 md:p-4' : 'h-[calc(100vh-8rem)] pt-2'}`}>
      
      {/* HEADER DU LECTEUR */}
      <header className={`flex items-center justify-between gap-4 mb-4 ${isFocusMode ? 'bg-surface border border-border p-3 rounded-2xl shadow-sm' : ''}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {!isFocusMode && (
            <button onClick={() => navigate(-1)} className="p-2 text-text-muted hover:text-text bg-surface rounded-lg shrink-0 cursor-pointer">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="min-w-0 flex flex-col">
            <h1 className="font-bold text-sm md:text-base text-text truncate" title={document.original_name}>
              {document.original_name}
            </h1>
            <span className="text-[10px] font-mono text-text-muted uppercase">
              {document.courses?.title || 'Fichier global'} • {document.document_type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsAIModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Sparkles size={14} /> Analyser (IA)
          </button>
          <button 
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border cursor-pointer ${isNotesOpen ? 'bg-accent text-background border-accent' : 'bg-surface text-text-muted hover:text-text border-border'}`}
            title="Ouvrir le panneau de notes"
          >
            {isNotesOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            <span className="hidden sm:inline">{isNotesOpen ? 'Fermer les notes' : 'Prendre des notes'}</span>
          </button>
          <button 
            onClick={() => setIsFocusMode(!isFocusMode)}
            className="p-1.5 bg-surface border border-border text-text-muted hover:text-text rounded-lg transition-colors cursor-pointer"
            title={isFocusMode ? "Quitter le plein écran" : "Mode Focus (Plein écran)"}
          >
            {isFocusMode ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </header>

      {/* ZONE DE CONTENU SCINDÉE (PDF | NOTES) */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        
        {/* LECTEUR PDF */}
        <div className={`h-full bg-surface border border-border rounded-2xl overflow-hidden shadow-inner transition-all duration-300 flex-1 relative ${isNotesOpen ? 'hidden lg:flex' : 'flex'}`}>
          {publicUrl && isPdf ? (
            <iframe 
              src={`${publicUrl}#toolbar=0&navpanes=0`} 
              className="w-full h-full border-0"
              title={document.original_name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-text-muted p-8 text-center gap-4">
              <FileText size={48} className="opacity-20" />
              <p>Ce format ({document.mime_type}) ne peut pas être affiché directement.</p>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-accent text-background rounded-xl font-bold text-sm">
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>

        {/* PANNEAU LATÉRAL DE PRISE DE NOTES */}
        {isNotesOpen && (
          <div className="h-full w-full lg:w-[400px] xl:w-[500px] bg-surface border border-border rounded-2xl flex flex-col shadow-sm overflow-hidden shrink-0 animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between p-3 border-b border-border bg-surface-elevated">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileEdit size={16} className="text-accent" /> Notes d'extraction
              </h3>
              <button 
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent hover:bg-accent/20 rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save size={14} /> {isSavingNote ? '...' : 'Sauvegarder'}
              </button>
            </div>
            <textarea 
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Copiez-collez ici les considérants importants, résumez l'arrêt, ou tapez vos réflexions..."
              className="flex-1 w-full p-4 bg-transparent resize-none text-sm text-text focus:outline-none font-serif leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* MODALE IA DU LECTEUR */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-surface-elevated border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-text">
            <h3 className="font-serif text-xl font-bold flex items-center gap-2 text-warning">
              <Sparkles size={20} /> Analyse IA du document
            </h3>
            <p className="text-xs text-text-muted">
              Que souhaitez-vous extraire de <span className="font-bold text-text">{document.original_name}</span> ?
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <button onClick={() => { setIsAIModalOpen(false); toast("Génération du résumé en cours...", "info"); }} className="w-full py-3 bg-surface border border-border rounded-xl text-sm font-bold hover:border-warning/50 hover:text-warning transition-colors cursor-pointer text-left px-4 flex justify-between items-center">
                Résumé complet <ChevronRight size={16} className="opacity-50"/>
              </button>
              <button onClick={() => { setIsAIModalOpen(false); toast("Création des flashcards en cours...", "info"); }} className="w-full py-3 bg-surface border border-border rounded-xl text-sm font-bold hover:border-warning/50 hover:text-warning transition-colors cursor-pointer text-left px-4 flex justify-between items-center">
                Générer des Flashcards <ChevronRight size={16} className="opacity-50"/>
              </button>
              <button onClick={() => { setIsAIModalOpen(false); toast("Extraction des articles en cours...", "info"); }} className="w-full py-3 bg-surface border border-border rounded-xl text-sm font-bold hover:border-warning/50 hover:text-warning transition-colors cursor-pointer text-left px-4 flex justify-between items-center">
                Lister les articles de loi cités <ChevronRight size={16} className="opacity-50"/>
              </button>
            </div>
            <button onClick={() => setIsAIModalOpen(false)} className="mt-2 text-xs text-text-muted hover:text-text font-bold text-center cursor-pointer">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

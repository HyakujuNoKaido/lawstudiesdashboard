import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, UploadCloud, FileType2, Save, Scale, FileEdit } from 'lucide-react';
import { uploadCourseDocument, fetchCourses, fetchCourseChapters } from '../services/supabaseService';
import { toast } from '../lib/toast';

export function DocumentUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { courseId?: string; chapterId?: string } | null;

  const [courses, setCourses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [internalName, setInternalName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [docCategory, setDocCategory] = useState('Support de cours');
  const [atfRef, setAtfRef] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses().then(data => {
      setCourses(data);
      const initialCourseId = routeState?.courseId || (data.length > 0 ? data[0].id : '');
      if (initialCourseId) setCourseId(initialCourseId);
    });
  }, []);

  useEffect(() => {
    if (courseId) {
      fetchCourseChapters(courseId).then(data => {
        setChapters(data);
        if (routeState?.chapterId) {
          setChapterId(routeState.chapterId);
        } else if (data.length > 0) {
          setChapterId(data[0].id);
        } else {
          setChapterId('');
        }
      });
    }
  }, [courseId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!internalName) {
        setInternalName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    try {
      await uploadCourseDocument(
        selectedFile, 
        courseId, 
        docCategory, 
        chapterId || undefined, 
        atfRef || undefined,
        internalName || selectedFile.name
      );
      toast("Document importé avec succès", "success");
      navigate(courseId ? `/courses/${courseId}` : '/library');
    } catch (error) {
      console.error("Erreur upload document:", error);
      toast("Échec de l'envoi du fichier", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300 max-w-2xl mx-auto w-full text-text">
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Annuler</span>
        </button>
        <div>
          <h1 className="font-serif text-3xl mb-1">Ajouter un document</h1>
          <p className="text-text-muted text-sm">Importez un support et associez-le directement à votre structure.</p>
        </div>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="relative border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-accent/50 hover:bg-surface-elevated transition-colors group">
          <input 
            type="file" 
            required
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-success/10 text-success rounded-xl flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <FileType2 size={28} />
              </div>
              <p className="font-medium text-sm text-text">{selectedFile.name}</p>
              <p className="text-xs text-text-muted font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-surface text-text-muted rounded-xl flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <UploadCloud size={28} />
              </div>
              <p className="font-medium text-sm text-text">Appuyez pour choisir un fichier</p>
              <p className="text-xs text-text-muted">PDF, PPTX, DOCX pris en charge</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
            <FileEdit size={16} /> Nom affiché dans Lexi
          </label>
          <input 
            type="text" 
            value={internalName}
            onChange={(e) => setInternalName(e.target.value)}
            placeholder="ex: Slides Chapitre 1 - Formation du contrat"
            className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted">Cours associé</label>
            <select 
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none cursor-pointer"
            >
              <option value="">-- Aucun cours --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted">Chapitre cible</label>
            <select 
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              disabled={!courseId}
              className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">-- Aucun chapitre --</option>
              {chapters.map(chap => (
                <option key={chap.id} value={chap.id}>{chap.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted">Type de document</label>
            <select 
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none cursor-pointer"
            >
              <option value="Support de cours">Support de cours / Slides</option>
              <option value="Cas pratique">Cas pratique / Exercice</option>
              <option value="Arrêt ATF">Arrêt du Tribunal fédéral (ATF)</option>
              <option value="Résumé personnel">Résumé / Fiche de révision</option>
              <option value="Loi / Code">Loi / Code annoté</option>
              <option value="Autre">Autre document</option>
            </select>
          </div>
          {docCategory === 'Arrêt ATF' && (
            <div className="flex flex-col gap-2 animate-in fade-in duration-200">
              <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                <Scale size={14} className="text-warning" />
                <span>Référence ATF</span>
              </label>
              <input 
                type="text" 
                value={atfRef}
                onChange={(e) => setAtfRef(e.target.value)}
                placeholder="ex: ATF 143 III 1"
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          )}
        </div>

        <button 
          type="submit"
          disabled={!selectedFile || loading}
          className="mt-4 w-full bg-accent text-background rounded-xl py-4 px-4 flex items-center justify-center gap-2 font-bold glow-gold hover:bg-accent-strong transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save size={18} />
          <span>{loading ? 'Traitement et envoi...' : 'Enregistrer le document'}</span>
        </button>
      </form>
    </div>
  );
}

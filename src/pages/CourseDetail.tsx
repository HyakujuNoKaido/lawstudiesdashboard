import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, FileText, Upload, Plus, Award, Scale, Layers, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { fetchCourseById, fetchCourseChapters, fetchCourseDocuments, fetchCourseGrades, createChapter, uploadCourseDocument } from '../services/supabaseService';

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Chapitre / Document
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Support de cours');

  useEffect(() => {
    if (courseId) {
      loadCourseData(courseId);
    }
  }, [courseId]);

  async function loadCourseData(id: string) {
    try {
      const [courseRes, chaptersRes, docsRes, gradesRes] = await Promise.all([
        fetchCourseById(id),
        fetchCourseChapters(id),
        fetchCourseDocuments(id),
        fetchCourseGrades(id)
      ]);
      setCourse(courseRes);
      setChapters(chaptersRes);
      setDocuments(docsRes);
      setGrades(gradesRes);
    } catch (err) {
      console.error("Erreur chargement détails du cours:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle || !courseId) return;
    try {
      await createChapter({
        course_id: courseId,
        title: newChapterTitle,
        order_index: chapters.length + 1
      });
      setNewChapterTitle('');
      setIsChapterModalOpen(false);
      loadCourseData(courseId);
    } catch (err) {
      console.error("Erreur création chapitre:", err);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !courseId) return;
    try {
      await uploadCourseDocument(selectedFile, courseId, docType);
      setSelectedFile(null);
      setIsDocModalOpen(false);
      loadCourseData(courseId);
    } catch (err) {
      console.error("Erreur upload document:", err);
      alert("Échec du téléchargement du fichier.");
    }
  };

  // Icône dynamique sans emoji selon le type de document
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'Arrêt ATF':
      case 'Jurisprudence':
        return <Scale size={16} className="text-warning" />;
      case 'Doctrine':
      case 'Manuel':
        return <BookOpen size={16} className="text-accent" />;
      case 'Support de cours':
      case 'Slides':
        return <FileText size={16} className="text-info" />;
      default:
        return <Layers size={16} className="text-text-muted" />;
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-text-muted text-sm">Chargement du cours...</div>;
  }

  if (!course) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4">
        <p className="text-text-muted text-sm">Cours introuvable.</p>
        <button onClick={() => navigate('/courses')} className="px-4 py-2 bg-accent text-background rounded-xl text-xs font-semibold">
          Retour aux cours
        </button>
      </div>
    );
  }

  const courseAverage = grades.length > 0 
    ? (grades.reduce((acc, g) => acc + Number(g.grade) * Number(g.weight), 0) / grades.reduce((acc, g) => acc + Number(g.weight), 0)).toFixed(2)
    : 'N/A';

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      {/* En-tête */}
      <header className="flex flex-col gap-4 px-1">
        <button 
          onClick={() => navigate('/courses')}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit cursor-pointer"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour aux cours</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{course.course_code || 'DROIT'}</Badge>
                <Badge variant="success">{course.status}</Badge>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold">{course.title}</h1>
              <p className="text-xs text-text-muted mt-1">{course.teacher_name ? `Enseignant: ${course.teacher_name} • ` : ''}{course.ects} ECTS • Semestre : {course.semester || 'Automne 2026'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-surface-elevated px-4 py-3 rounded-xl border border-border flex flex-col items-center">
              <span className="text-[10px] uppercase text-text-muted font-semibold">Moyenne</span>
              <span className="font-serif text-lg font-bold text-accent">{courseAverage}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-3 px-1">
        <button 
          onClick={() => setIsChapterModalOpen(true)}
          className="bg-surface border border-border py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:border-accent/50 transition-colors cursor-pointer"
        >
          <Plus size={16} className="text-accent" />
          <span>Ajouter un chapitre</span>
        </button>
        <button 
          onClick={() => setIsDocModalOpen(true)}
          className="bg-accent text-background py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 glow-gold hover:bg-accent-strong transition-colors cursor-pointer"
        >
          <Upload size={16} />
          <span>Importer un document</span>
        </button>
      </div>

      {/* Chapitres du cours */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-semibold px-1">Plan et chapitres</h2>
        {chapters.length === 0 ? (
          <Card className="bg-surface border-border p-6 text-center text-text-muted text-xs">
            Aucun chapitre enregistré pour l'instant. Utilisez le bouton ci-dessus pour en ajouter.
          </Card>
        ) : (
          chapters.map((chap, idx) => (
            <Card key={chap.id} className="bg-surface border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-surface-elevated text-accent font-mono text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="font-medium text-sm text-text">{chap.title}</span>
              </div>
            </Card>
          ))
        )}
      </section>

      {/* Documents et Fiches associés */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-semibold px-1">Documents et Fiches (Arrêts ATF, Doctrine)</h2>
        {documents.length === 0 ? (
          <Card className="bg-surface border-border p-6 text-center text-text-muted text-xs">
            Aucun document importé pour ce cours.
          </Card>
        ) : (
          documents.map(doc => (
            <Card key={doc.id} className="bg-surface border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-elevated flex items-center justify-center">
                  {getDocumentIcon(doc.document_type)}
                </div>
                <div>
                  <p className="font-medium text-sm text-text">{doc.original_name}</p>
                  <p className="text-xs text-text-muted">{doc.document_type} • {(doc.size_bytes / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <Badge variant="outline">{doc.document_type}</Badge>
            </Card>
          ))
        )}
      </section>

      {/* Modal Ajout Chapitre */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-2xl p-6 shadow-2xl">
            <h2 className="font-serif text-xl font-bold mb-4">Nouveau chapitre</h2>
            <form onSubmit={handleCreateChapter} className="flex flex-col gap-4">
              <input 
                type="text" required value={newChapterTitle} onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="ex: Chapitre 3 - Les vices du consentement"
                className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent"
              />
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setIsChapterModalOpen(false)} className="flex-1 bg-surface border border-border py-3 rounded-xl text-sm">Annuler</button>
                <button type="submit" className="flex-1 bg-accent text-background py-3 rounded-xl text-sm font-semibold glow-gold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Document */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-elevated border border-border rounded-2xl p-6 shadow-2xl">
            <h2 className="font-serif text-xl font-bold mb-4">Importer un document</h2>
            <form onSubmit={handleUploadDoc} className="flex flex-col gap-4">
              <select 
                value={docType} onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl py-3 px-3 text-sm appearance-none"
              >
                <option value="Support de cours">Support de cours / Slides</option>
                <option value="Arrêt ATF">Arrêt ATF / Jurisprudence</option>
                <option value="Doctrine">Doctrine / Manuel</option>
              </select>
              <input 
                type="file" required onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full bg-surface border border-border rounded-xl p-3 text-sm text-text-muted"
              />
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setIsDocModalOpen(false)} className="flex-1 bg-surface border border-border py-3 rounded-xl text-sm">Annuler</button>
                <button type="submit" className="flex-1 bg-accent text-background py-3 rounded-xl text-sm font-semibold glow-gold">Télécharger</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MoreVertical, FileText, Upload, Plus, Clock, File, Filter } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { fetchCourseById, fetchCourseDocuments } from '../services/supabaseService';

const TABS = ['Aperçu', 'Documents', 'Fiches', 'Flashcards', 'Évaluations', 'Planning'];
const DOC_FILTERS = ['Tous', 'Support de cours', 'Cas pratique', 'Résumé personnel', 'Autre'];

export function CourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [activeTab, setActiveTab] = useState('Documents');
  const [selectedDocFilter, setSelectedDocFilter] = useState('Tous');
  const [course, setCourse] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    
    Promise.all([
      fetchCourseById(courseId),
      fetchCourseDocuments(courseId)
    ])
      .then(([courseData, docsData]) => {
        setCourse(courseData);
        setDocuments(docsData);
      })
      .catch(err => console.error("Erreur chargement détail cours:", err))
      .finally(() => setLoading(false));
  }, [courseId]);

  const filteredDocuments = documents.filter(doc => {
    if (selectedDocFilter === 'Tous') return true;
    return doc.document_type === selectedDocFilter;
  });

  if (loading) {
    return <div className="text-center py-12 text-text-muted text-sm">Chargement du cours...</div>;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-text-muted">Cours introuvable.</p>
        <button onClick={() => navigate('/courses')} className="text-accent underline text-sm">Retour aux cours</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <button className="text-text-muted hover:text-text p-2">
          <MoreVertical size={20} />
        </button>
      </header>

      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline">{course.course_code || 'COURS'}</Badge>
          <Badge variant="accent" icon={<Clock size={12}/>}>{course.status}</Badge>
          <Badge>{course.ects} ECTS</Badge>
        </div>
        <h1 className="font-serif text-3xl leading-tight mb-2">
          {course.title}
        </h1>
        {course.teacher_name && (
          <p className="text-text-muted text-sm">
            Enseignant·e : {course.teacher_name}
          </p>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto border-b border-border scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab 
                ? 'text-accent border-accent' 
                : 'text-text-muted border-transparent hover:text-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <main>
        {activeTab === 'Documents' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-medium">Fichiers et supports</h2>
              <button 
                onClick={() => navigate('/add/document')}
                className="flex items-center gap-1.5 text-xs font-semibold text-background bg-text px-3 py-1.5 rounded-sm hover:bg-text-muted transition-colors"
              >
                <Upload size={14} />
                Importer
              </button>
            </div>

            {/* Sous-filtres par catégorie de document */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {DOC_FILTERS.map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedDocFilter(filter)}
                  className={`whitespace-nowrap px-3 py-1 rounded text-xs font-medium transition-colors border ${
                    selectedDocFilter === filter 
                      ? 'bg-accent/10 text-accent border-accent/30' 
                      : 'bg-surface text-text-muted border-border hover:border-text-muted/50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-lg text-text-muted text-sm">
                Aucun document ne correspond à ce filtre.
              </div>
            ) : (
              filteredDocuments.map(doc => (
                <Card 
                  key={doc.id} 
                  onClick={() => navigate(`/viewer/${doc.id}`)} 
                  className="group flex items-center justify-between p-4 cursor-pointer hover:border-accent/50"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-info/10 text-info rounded flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm group-hover:text-accent transition-colors truncate">{doc.original_name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="text-accent font-medium">{doc.document_type || 'Document'}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{(doc.size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); }} className="text-text-muted hover:text-text p-2 shrink-0">
                    <MoreVertical size={16} />
                  </button>
                </Card>
              ))
            )}
            
            <div 
              onClick={() => navigate('/add/document')}
              className="mt-4 border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/50 hover:bg-surface-elevated/30 transition-all"
            >
              <div className="w-12 h-12 bg-surface-elevated rounded-full flex items-center justify-center text-text-muted mb-3">
                <Plus size={24} />
              </div>
              <p className="font-medium text-sm mb-1">Ajouter un document</p>
              <p className="text-xs text-text-muted max-w-[200px]">
                PDF, PPTX ou Word.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Aperçu' && (
          <div className="flex flex-col gap-4 text-sm text-text-muted">
            <p>Vue d'ensemble et statistiques de la matière {course.title}.</p>
            <div className="bg-surface p-4 rounded border border-border flex flex-col gap-2">
              <span className="text-text font-medium">Crédits ECTS attribués : {course.ects}</span>
              <span className="text-text font-medium">Statut actuel : {course.status}</span>
            </div>
          </div>
        )}

        {activeTab !== 'Documents' && activeTab !== 'Aperçu' && (
          <div className="py-12 text-center text-text-muted text-sm border border-dashed border-border rounded-lg">
            Le module {activeTab.toLowerCase()} est en cours de configuration.
          </div>
        )}
      </main>

    </div>
  );
}

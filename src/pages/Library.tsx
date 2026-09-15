import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Scale, FileEdit, ChevronRight, Folder, Calendar, BookOpen, Filter, Download, ExternalLink } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { fetchNotes, fetchCaseLaws, fetchCourses } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { SOLO_USER_ID } from '../lib/constants';

export function Library() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [caseLaws, setCaseLaws] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('Tous');
  const [selectedType, setSelectedType] = useState('Tous');
  const [activeTab, setActiveTab] = useState<'documents' | 'cases' | 'notes'>('documents');

  useEffect(() => {
    async function loadLibrary() {
      try {
        const [notesData, caseLawsData, coursesData, docsRes] = await Promise.all([
          fetchNotes(),
          fetchCaseLaws(),
          fetchCourses(),
          supabase
            .from('documents')
            .select('*, courses(id, title), chapters(title)')
            .eq('user_id', SOLO_USER_ID)
            .order('created_at', { ascending: false })
        ]);
        setNotes(notesData);
        setCaseLaws(caseLawsData);
        setCourses(coursesData);
        setDocuments(docsRes.data || []);
      } catch (err) {
        console.error("Erreur chargement bibliothèque :", err);
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, []);

  // Filtrage global des documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.original_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourseId === 'Tous' || doc.course_id === selectedCourseId;
    const matchesType = selectedType === 'Tous' || doc.document_type === selectedType;
    return matchesSearch && matchesCourse && matchesType;
  });

  const filteredCaseLaws = caseLaws.filter(cl => 
    cl.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cl.atf_citation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNotes = notes.filter(n => 
    n.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 pt-2 pb-20 animate-in fade-in duration-300 text-text">
      
      {/* HEADER ET RECHERCHE GLOBALE */}
      <header className="flex flex-col gap-5 px-1 border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Bibliothèque & Archives</h1>
            <p className="text-text-muted text-sm max-w-lg">
              Vue d'ensemble de vos supports, arrêts et notes avec traçabilité complète des cours et chapitres.
            </p>
          </div>
          
          {/* Onglets principaux */}
          <div className="flex bg-surface border border-border rounded-xl p-1 self-start">
            <button 
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTab === 'documents' ? 'bg-accent text-background' : 'text-text-muted hover:text-text'}`}
            >
              Fichiers & Documents ({documents.length})
            </button>
            <button 
              onClick={() => setActiveTab('cases')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTab === 'cases' ? 'bg-accent text-background' : 'text-text-muted hover:text-text'}`}
            >
              Jurisprudence ({caseLaws.length})
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${activeTab === 'notes' ? 'bg-accent text-background' : 'text-text-muted hover:text-text'}`}
            >
              Notes ({notes.length})
            </button>
          </div>
        </div>

        {/* Barre de recherche et filtres rapides */}
        {activeTab === 'documents' && (
          <div className="flex flex-col md:flex-row items-center gap-3 mt-2">
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom de fichier, type..."
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Filtre par cours */}
              <select 
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-surface-elevated border border-border rounded-xl py-3 px-3 text-xs font-medium focus:outline-none focus:border-accent appearance-none cursor-pointer flex-1 md:flex-none"
              >
                <option value="Tous">Tous les cours</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              {/* Filtre par type de document */}
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-surface-elevated border border-border rounded-xl py-3 px-3 text-xs font-medium focus:outline-none focus:border-accent appearance-none cursor-pointer flex-1 md:flex-none"
              >
                <option value="Tous">Tous les types</option>
                <option value="Support de cours">Supports de cours</option>
                <option value="Cas pratique">Cas pratiques</option>
                <option value="Arrêt ATF">Arrêts ATF</option>
                <option value="Résumé personnel">Résumés</option>
                <option value="Loi / Code">Lois / Codes</option>
              </select>
            </div>
          </div>
        )}
      </header>

      {loading ? (
        <div className="text-center py-20 text-text-muted font-mono animate-pulse">Exploration des archives académiques...</div>
      ) : (
        <>
          {/* --- VUE 1 : DOCUMENTS & FICHIERS (ULTRA DÉTAILLÉE) --- */}
          {activeTab === 'documents' && (
            <div className="flex flex-col gap-4">
              {filteredDocs.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-2xl text-text-muted text-sm flex flex-col items-center gap-2">
                  <Folder size={32} className="opacity-30" />
                  <p>Aucun document ne correspond à vos critères de recherche.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredDocs.map(doc => {
                    const isPdf = doc.mime_type === 'application/pdf' || doc.original_name?.toLowerCase().endsWith('.pdf');
                    const isPpt = doc.original_name?.toLowerCase().match(/\.pptx?$/);
                    const isWord = doc.original_name?.toLowerCase().match(/\.docx?$/);
                    
                    const formattedDate = new Date(doc.created_at).toLocaleDateString('fr-CH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <div 
                        key={doc.id}
                        onClick={() => navigate(`/viewer/${doc.id}`)}
                        className="bg-surface border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-accent/50 transition-all cursor-pointer group shadow-sm"
                      >
                        {/* Infos principales (Nom + Fil d'ariane Cours > Chapitre) */}
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5
                            ${isPdf ? 'bg-danger/10 text-danger border border-danger/20' : ''}
                            ${isPpt ? 'bg-warning/10 text-warning border border-warning/20' : ''}
                            ${isWord ? 'bg-info/10 text-info border border-info/20' : ''}
                            {!isPdf && !isPpt && !isWord ? 'bg-surface-elevated text-text-muted border border-border' : ''}
                          `}>
                            <FileText size={22} />
                          </div>
                          
                          <div className="min-w-0 flex-1 flex flex-col gap-1">
                            <h3 className="font-semibold text-sm md:text-base text-text truncate group-hover:text-accent transition-colors">
                              {doc.original_name}
                            </h3>

                            {/* Fil d'ariane contextuel (Cours > Chapitre) */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted font-medium">
                              <span className="text-secondary font-bold flex items-center gap-1">
                                <BookOpen size={13} /> {doc.courses?.title || 'Matière générale'}
                              </span>
                              {doc.chapters?.title && (
                                <>
                                  <ChevronRight size={12} className="opacity-50" />
                                  <span className="bg-surface-elevated px-2 py-0.5 rounded text-text font-normal truncate max-w-[250px]">
                                    {doc.chapters.title}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Méta-détails (Format, Type/But, Date) à voir au premier coup d'œil */}
                        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
                          
                          {/* Badge Type / But */}
                          <Badge variant="outline" className="text-[10px] font-sans">
                            {doc.document_type || 'Support'}
                          </Badge>

                          {/* Badge Format */}
                          <span className={`text-[10px] font-mono px-2 py-1 rounded font-bold uppercase
                            ${isPdf ? 'bg-danger/10 text-danger border border-danger/20' : ''}
                            ${isPpt ? 'bg-warning/10 text-warning border border-warning/20' : ''}
                            ${isWord ? 'bg-info/10 text-info border border-info/20' : ''}
                          `}>
                            {isPdf ? 'PDF' : isPpt ? 'PPT' : isWord ? 'DOC' : 'Fichier'}
                          </span>

                          {/* Date d'ajout */}
                          <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-text-muted ml-2">
                            <Calendar size={13} />
                            <span>{formattedDate}</span>
                          </div>

                          <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted group-hover:bg-accent group-hover:text-background transition-colors ml-1">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* --- VUE 2 : JURISPRUDENCE (ATF) --- */}
          {activeTab === 'cases' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCaseLaws.length === 0 ? (
                <div className="col-span-2 text-center py-16 border border-dashed border-border rounded-2xl text-text-muted text-sm">
                  Aucune fiche d'arrêt enregistrée.
                </div>
              ) : (
                filteredCaseLaws.map(cl => (
                  <Card key={cl.id} variant="editorial" className="p-5 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="text-[10px] border-warning/30 text-warning font-mono">{cl.atf_citation}</Badge>
                        <span className="text-[10px] text-text-muted font-mono">{new Date(cl.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-serif font-bold text-lg text-text leading-snug">{cl.title}</h3>
                      <p className="text-xs text-text-muted line-clamp-2 font-serif mt-1">{cl.facts}</p>
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between items-center text-xs text-accent font-semibold">
                      <span>{cl.courses?.title || 'Jurisprudence générale'}</span>
                      <span className="flex items-center gap-1 hover:underline cursor-pointer" onClick={() => navigate('/courses')}>Consulter <ChevronRight size={14}/></span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* --- VUE 3 : NOTES DE COURS --- */}
          {activeTab === 'notes' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredNotes.length === 0 ? (
                <div className="col-span-3 text-center py-16 border border-dashed border-border rounded-2xl text-text-muted text-sm">
                  Aucune note de cours enregistrée.
                </div>
              ) : (
                filteredNotes.map(n => (
                  <Card key={n.id} onClick={() => navigate(`/editor/${n.id}`)} className="p-5 cursor-pointer hover:border-accent/50 transition-colors flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="accent" className="text-[9px]">{n.courses?.title || 'Général'}</Badge>
                        <FileEdit size={16} className="text-accent" />
                      </div>
                      <h3 className="font-serif font-bold text-base text-text">{n.title}</h3>
                      <p className="text-xs text-text-muted line-clamp-3 font-serif">{n.content}</p>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted">Mis à jour le {new Date(n.updated_at).toLocaleDateString()}</span>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

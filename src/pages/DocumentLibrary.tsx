import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Download, Trash2, Sparkles, Filter, ExternalLink, FolderOpen, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentUserId } from '../services/supabaseService';
import { toast } from '../lib/toast';

export function DocumentLibrary() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres & Recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'todo'>('all');

  useEffect(() => {
    loadLibraryData();
  }, []);

  async function loadLibraryData() {
    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      const [docsRes, coursesRes] = await Promise.all([
        supabase.from('documents').select('*, courses(title)').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('courses').select('id, title').eq('user_id', userId)
      ]);

      if (docsRes.error) throw docsRes.error;

      setDocuments(docsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error(err);
      toast("Erreur lors du chargement de la bibliothèque", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string, bucketPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Voulez-vous vraiment supprimer ce document ?")) return;

    try {
      if (bucketPath) {
        await supabase.storage.from('user-documents').remove([bucketPath]);
      }
      await supabase.from('documents').delete().eq('id', id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast("Document supprimé avec succès", "success");
    } catch (err) {
      toast("Erreur lors de la suppression", "error");
    }
  };

  // Filtrage intelligent
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.original_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (doc.courses?.title && doc.courses.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCourse = selectedCourseId === 'all' || doc.course_id === selectedCourseId;
    
    if (activeTab === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return matchesSearch && matchesCourse && new Date(doc.created_at) > oneWeekAgo;
    }
    
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 animate-in fade-in duration-300 text-text max-w-5xl mx-auto w-full">
      {/* HEADER DE LA BIBLIOTHÈQUE */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-1">Bibliothèque</h1>
          <p className="text-text-muted text-sm">Tous vos supports de cours, arrêts et cas pratiques centralisés.</p>
        </div>
        <button 
          onClick={() => navigate('/add/document')}
          className="bg-accent text-background px-4 py-2.5 rounded-xl font-bold text-sm glow-gold hover:scale-[1.02] transition-transform cursor-pointer w-fit"
        >
          + Importer un document
        </button>
      </header>

      {/* BARRE DE RECHERCHE ET FILTRES RAPIDES */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Recherche */}
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un document ou une matière..."
            className="w-full bg-surface border border-border rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filtre par cours */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select 
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-text cursor-pointer focus:outline-none focus:border-accent"
          >
            <option value="all">📚 Tous les cours</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          
          {/* Onglets rapides */}
          <div className="flex bg-surface-elevated border border-border rounded-xl p-1 shrink-0">
            <button onClick={() => setActiveTab('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'all' ? 'bg-accent text-background' : 'text-text-muted'}`}>Tous</button>
            <button onClick={() => setActiveTab('recent')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'recent' ? 'bg-accent text-background' : 'text-text-muted'}`}>Récents</button>
            <button onClick={() => setActiveTab('todo')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === 'todo' ? 'bg-accent text-background' : 'text-text-muted'}`}>À traiter</button>
          </div>
        </div>
      </div>

      {/* LISTE DES DOCUMENTS */}
      {loading ? (
        <div className="text-center py-20 text-text-muted font-mono animate-pulse">Chargement de la bibliothèque...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-3xl text-text-muted gap-4 bg-surface/30">
          <FolderOpen size={48} className="opacity-20" />
          <p className="text-sm">Aucun document trouvé dans cette vue.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredDocs.map(doc => {
            const isPdf = doc.mime_type === 'application/pdf' || doc.original_name.toLowerCase().endsWith('.pdf');
            return (
              <div 
                key={doc.id}
                onClick={() => navigate(`/viewer/${doc.id}`)}
                className="bg-surface border border-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-accent/50 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-start md:items-center gap-4 min-w-0 flex-1">
                  <div className={`p-3 rounded-xl shrink-0 ${isPdf ? 'bg-danger/10 text-danger' : 'bg-info/10 text-info'}`}>
                    <FileText size={22} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-bold text-base text-text truncate group-hover:text-accent transition-colors">
                      {doc.original_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-1 font-mono">
                      <span className="text-accent font-semibold flex items-center gap-1">
                        <BookOpen size={12} /> {doc.courses?.title || 'Fichier général'}
                      </span>
                      <span>•</span>
                      <span>{doc.document_type || 'Support'}</span>
                      <span>•</span>
                      <span>{new Date(doc.created_at).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/viewer/${doc.id}`); }}
                    className="px-3 py-1.5 bg-surface-elevated hover:bg-accent hover:text-background border border-border rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={14} className="text-warning" /> Lire & Noter
                  </button>
                  <button 
                    onClick={(e) => handleDelete(doc.id, doc.bucket_path, e)}
                    className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 border border-border rounded-xl transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

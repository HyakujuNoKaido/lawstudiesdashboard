import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Scale, FileEdit, ChevronRight, Folder } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { fetchNotes, fetchCaseLaws } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { SOLO_USER_ID } from '../lib/constants';

export function Library() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [caseLaws, setCaseLaws] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    async function loadLibrary() {
      try {
        // On récupère toutes les ressources transverses
        const [notesData, caseLawsData, docsRes] = await Promise.all([
          fetchNotes(),
          fetchCaseLaws(),
          supabase
            .from('documents')
            .select('*, courses(title)')
            .eq('user_id', SOLO_USER_ID)
            .order('created_at', { ascending: false })
        ]);
        setNotes(notesData);
        setCaseLaws(caseLawsData);
        setDocuments(docsRes.data || []);
      } catch (err) {
        console.error("Erreur de chargement de la bibliothèque :", err);
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, []);

  // Filtrage local
  const term = filter.toLowerCase();
  const filteredNotes = notes.filter(n => n.title?.toLowerCase().includes(term));
  const filteredCaseLaws = caseLaws.filter(c => c.title?.toLowerCase().includes(term) || c.atf_citation?.toLowerCase().includes(term));
  const filteredDocs = documents.filter(d => d.original_name?.toLowerCase().includes(term));

  return (
    <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      <header className="flex flex-col gap-4 px-1 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">Bibliothèque</h1>
          <p className="text-text-muted text-sm max-w-md">
            L'intégralité de vos ressources, notes et jurisprudence classées au même endroit.
          </p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer dans la bibliothèque..."
            className="w-full bg-surface-elevated border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-secondary transition-colors"
          />
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12 text-text-muted text-sm font-mono animate-pulse">Exploration des archives...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLONNE 1 : JURISPRUDENCE (ATF) */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2 px-1">
              <Scale size={16} className="text-warning" /> Jurisprudence
            </h2>
            {filteredCaseLaws.length === 0 ? (
              <p className="text-xs text-text-muted italic px-1">Aucune fiche d'arrêt.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredCaseLaws.map(cl => (
                  <Card key={cl.id} variant="default" className="group p-4 hover:border-warning/50">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-[9px] border-warning/30 text-warning">{cl.atf_citation}</Badge>
                      <ChevronRight size={16} className="text-text-muted group-hover:text-warning transition-colors" />
                    </div>
                    <h3 className="font-medium text-sm text-text leading-snug">{cl.title}</h3>
                    <p className="text-[10px] text-text-muted mt-2 truncate">{cl.courses?.title || 'Général'}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* COLONNE 2 : NOTES DE COURS */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2 px-1">
              <FileEdit size={16} className="text-accent" /> Mes Notes
            </h2>
            {filteredNotes.length === 0 ? (
              <p className="text-xs text-text-muted italic px-1">Aucune note de cours.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredNotes.map(n => (
                  <Card key={n.id} variant="default" onClick={() => navigate(`/editor/${n.id}`)} className="group p-4 hover:border-accent/50 cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-sm text-text leading-snug group-hover:text-accent transition-colors">{n.title}</h3>
                    </div>
                    <p className="text-[10px] text-text-muted mt-2 truncate">{n.courses?.title || 'Général'}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* COLONNE 3 : DOCUMENTS & PDF */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2 px-1">
              <Folder size={16} className="text-info" /> Fichiers importés
            </h2>
            {filteredDocs.length === 0 ? (
              <p className="text-xs text-text-muted italic px-1">Aucun document.</p>
            ) : (
              <div className="flex flex-col gap-2 border border-border bg-surface rounded-xl overflow-hidden shadow-sm">
                {filteredDocs.map((doc, index) => (
                  <div 
                    key={doc.id} 
                    onClick={() => navigate(`/viewer/${doc.id}`)}
                    className={`flex items-center gap-3 p-3 hover:bg-surface-elevated cursor-pointer transition-colors ${index !== filteredDocs.length - 1 ? 'border-b border-border/50' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted shrink-0">
                      <FileText size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-text truncate">{doc.original_name}</p>
                      <p className="text-[9px] text-text-muted font-mono uppercase mt-0.5">{doc.document_type} • {doc.courses?.title || 'Sans cours'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

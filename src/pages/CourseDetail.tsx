import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MoreVertical, FileText, Upload, Plus, Clock, File } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

const TABS = ['Aperçu', 'Documents', 'Fiches', 'Flashcards', 'Évaluations', 'Planning'];

export function CourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams(); // Permettra plus tard de fetch les données depuis Supabase
  const [activeTab, setActiveTab] = useState('Documents'); // "Documents" par défaut pour la démo

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      {/* En-tête de navigation */}
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

      {/* Titre et Méta-données */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline">DO-PG</Badge>
          <Badge variant="accent" icon={<Clock size={12}/>}>En cours</Badge>
          <Badge>12 ECTS</Badge>
        </div>
        <h1 className="font-serif text-3xl leading-tight mb-2">
          Droit des obligations (Partie générale)
        </h1>
        <p className="text-text-muted text-sm">
          Semestre d'automne • Prof. J. Dupont
        </p>
      </div>

      {/* Onglets (Scroll horizontal) */}
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

      {/* Contenu de l'onglet actif (Démo sur "Documents") */}
      <main>
        {activeTab === 'Documents' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-medium">Fichiers du cours</h2>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-background bg-text px-3 py-1.5 rounded-sm hover:bg-text-muted transition-colors">
                <Upload size={14} />
                Importer
              </button>
            </div>

            <Card className="group flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-info/10 text-info rounded flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-accent transition-colors">Plan du cours 2026.pdf</p>
                  <p className="text-xs text-text-muted mt-0.5">Ajouté il y a 2 jours • 1.2 MB</p>
                </div>
              </div>
              <button className="text-text-muted hover:text-text p-2">
                <MoreVertical size={16} />
              </button>
            </Card>

            <Card className="group flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-elevated text-text-muted rounded flex items-center justify-center">
                  <File size={20} />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-accent transition-colors">Support_Seminaire_01.pdf</p>
                  <p className="text-xs text-text-muted mt-0.5">Ajouté aujourd'hui • 4.5 MB</p>
                </div>
              </div>
              <button className="text-text-muted hover:text-text p-2">
                <MoreVertical size={16} />
              </button>
            </Card>
            
            {/* Zone d'import drag & drop vide/incitative */}
            <div className="mt-4 border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/50 hover:bg-surface-elevated/30 transition-all">
              <div className="w-12 h-12 bg-surface-elevated rounded-full flex items-center justify-center text-text-muted mb-3">
                <Plus size={24} />
              </div>
              <p className="font-medium text-sm mb-1">Ajouter un document</p>
              <p className="text-xs text-text-muted max-w-[200px]">
                PDF, JPG, PNG ou CSV. L'extraction des données requiert une validation manuelle.
              </p>
            </div>
          </div>
        )}

        {activeTab !== 'Documents' && (
          <div className="py-12 text-center text-text-muted text-sm border border-dashed border-border rounded-lg">
            Le module {activeTab.toLowerCase()} est en cours de construction.
          </div>
        )}
      </main>

    </div>
  );
}

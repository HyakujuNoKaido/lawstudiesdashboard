import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, CheckCircle2, AlertCircle, XCircle, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

// Simulation des données extraites d'un PDF (Relevé de notes)
const EXTRACTED_DATA = [
  { id: 1, subject: 'Droit des obligations (CO)', grade: 4.5, ects: 12, status: 'valid', selected: true },
  { id: 2, subject: 'Droit pénal général', grade: 5.0, ects: 9, status: 'valid', selected: true },
  { id: 3, subject: 'Histoire du droit', grade: 3.5, ects: 6, status: 'warning', selected: true }, // Sous la moyenne
  { id: 4, subject: 'Introduction à l\'économie (Inconnu)', grade: null, ects: null, status: 'error', selected: false } // Erreur OCR / Incomplet
];

export function DocumentImport() {
  const navigate = useNavigate();
  const [items, setItems] = useState(EXTRACTED_DATA);

  const toggleSelection = (id: number) => {
    setItems(items.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleConfirm = () => {
    // Logique d'enregistrement dans Supabase pour les éléments sélectionnés
    console.log("Enregistrement de :", items.filter(i => i.selected));
    navigate('/');
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24 animate-in fade-in duration-300">
      
      {/* En-tête */}
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Annuler l'import</span>
        </button>

        <div>
          <h1 className="font-serif text-3xl leading-tight mb-2">Vérification des données</h1>
          <p className="text-text-muted text-sm">
            Lexi a extrait ces informations de votre document. Veuillez décocher les erreurs ou les données à ignorer avant l'import final.
          </p>
        </div>
      </header>

      {/* Résumé du fichier */}
      <Card className="flex items-center gap-4 bg-surface-elevated border-border/50">
        <div className="w-12 h-12 bg-info/10 text-info rounded-md flex items-center justify-center shrink-0">
          <FileText size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">releve_notes_bachelor_2025.pdf</p>
          <p className="text-xs text-text-muted">Type détecté : Relevé de notes</p>
        </div>
        <Badge variant="success" icon={<CheckCircle2 size={12}/>}>Analysé</Badge>
      </Card>

      {/* Liste de validation */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Éléments détectés ({items.filter(i => i.selected).length}/{items.length})</h2>
        </div>

        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => toggleSelection(item.id)}
            className={`p-4 rounded-md border flex items-start gap-4 transition-all cursor-pointer ${
              item.selected 
                ? 'bg-surface border-accent/40 shadow-sm' 
                : 'bg-background border-border opacity-60'
            }`}
          >
            <div className="mt-0.5">
              {item.selected ? (
                <CheckCircle2 size={20} className="text-accent" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-text-muted/50" />
              )}
            </div>
            
            <div className="flex-1">
              <p className={`font-medium text-sm ${!item.selected && 'line-through decoration-text-muted/50'}`}>
                {item.subject}
              </p>
              
              <div className="flex items-center gap-3 mt-2">
                {item.grade ? (
                  <span className="text-xs font-semibold bg-surface-elevated px-2 py-1 rounded-sm">
                    Note: {item.grade.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-xs font-semibold bg-danger/10 text-danger px-2 py-1 rounded-sm flex items-center gap-1">
                    <XCircle size={12} /> Donnée manquante
                  </span>
                )}
                
                {item.ects && (
                  <span className="text-xs text-text-muted">
                    {item.ects} ECTS
                  </span>
                )}

                {item.status === 'warning' && (
                  <span className="text-xs text-warning flex items-center gap-1 ml-auto">
                    <AlertCircle size={12} /> Sous la validation
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Barre d'action fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-elevated border-t border-border z-50 md:left-64">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-md font-medium text-sm border border-border bg-background hover:bg-surface transition-colors"
          >
            Ignorer
          </button>
          <button 
            onClick={handleConfirm}
            disabled={items.filter(i => i.selected).length === 0}
            className="flex-1 bg-accent text-background rounded-md py-3 px-4 flex items-center justify-center gap-2 font-medium text-sm hover:bg-accent-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Confirmer l'import</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';

export function AddCourse() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation d'enregistrement
    navigate('/courses');
  };

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors -ml-2 p-2 w-fit"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Annuler</span>
        </button>

        <div>
          <h1 className="font-serif text-3xl mb-1">Nouveau cours</h1>
          <p className="text-text-muted text-sm">Ajoutez manuellement une matière à votre plan d'études.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">Titre du cours</label>
          <input 
            type="text" 
            required
            placeholder="ex: Droit des sociétés"
            className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Code (Optionnel)</label>
            <input 
              type="text" 
              placeholder="ex: DRO-304"
              className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">Crédits ECTS</label>
            <input 
              type="number" 
              required
              min="0"
              step="0.5"
              placeholder="ex: 6"
              className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">Semestre</label>
          <select className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors appearance-none">
            <option value="automne">Semestre d'automne</option>
            <option value="printemps">Semestre de printemps</option>
            <option value="annuel">Annuel</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-muted">Enseignant·e (Optionnel)</label>
          <input 
            type="text" 
            placeholder="Nom du professeur"
            className="w-full bg-surface border border-border rounded-md py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <button 
          type="submit"
          className="mt-4 w-full bg-accent text-background rounded-md py-3.5 px-4 flex items-center justify-center gap-2 font-medium hover:bg-accent-strong transition-colors"
        >
          <Save size={18} />
          <span>Enregistrer le cours</span>
        </button>

      </form>
    </div>
  );
}

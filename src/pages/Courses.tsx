import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Search, SlidersHorizontal, BookOpen, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

// Données de démonstration typiques d'une faculté de droit suisse
const MOCK_COURSES = [
  {
    id: '1',
    title: 'Droit des obligations (Partie générale)',
    code: 'DO-PG',
    ects: 12,
    semester: 'Automne',
    status: 'en_cours',
    progress: 35,
    nextEvent: { type: 'Séminaire', date: 'Demain, 14:15' }
  },
  {
    id: '2',
    title: 'Droit pénal général',
    code: 'DPG',
    ects: 9,
    semester: 'Automne',
    status: 'en_cours',
    progress: 60,
    nextEvent: { type: 'Cours', date: 'Mercredi, 08:15' }
  },
  {
    id: '3',
    title: 'Droit constitutionnel',
    code: 'DCONST',
    ects: 12,
    semester: 'Printemps',
    status: 'valide',
    progress: 100,
    grade: 5.25
  },
  {
    id: '4',
    title: 'Introduction à l\'économie',
    code: 'ECON',
    ects: 6,
    semester: 'Automne',
    status: 'a_reprendre',
    progress: 10,
    nextEvent: { type: 'Rendu', date: 'Dans 3 jours' }
  }
];

const FILTERS = ['Tous', 'En cours', 'Automne', 'Printemps', 'Validés', 'À reprendre'];

export function Courses() {
  const [activeFilter, setActiveFilter] = useState('En cours');

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      {/* En-tête et Recherche */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl mb-1">Cours</h1>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une matière..." 
              className="w-full bg-surface border border-border rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted"
            />
          </div>
          <button className="w-11 h-11 bg-surface border border-border rounded-md flex items-center justify-center text-text-muted hover:text-text transition-colors">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* Filtres défilants (Scroll horizontal caché) */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              activeFilter === filter 
                ? 'bg-text text-background border-text' 
                : 'bg-surface text-text-muted border-border hover:border-text-muted/50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Liste des cours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_COURSES.map(course => (
          <Card key={course.id} onClick={() => console.log(`Ouvrir ${course.id}`)} className="group">
            
            <div className="flex justify-between items-start mb-3">
              <Badge variant="outline">{course.code}</Badge>
              
              {course.status === 'en_cours' && <Badge variant="accent" icon={<Clock size={12}/>}>En cours</Badge>}
              {course.status === 'valide' && <Badge variant="success" icon={<CheckCircle2 size={12}/>}>Validé</Badge>}
              {course.status === 'a_reprendre' && <Badge variant="danger" icon={<AlertCircle size={12}/>}>À reprendre</Badge>}
            </div>

            <h3 className="font-medium text-lg leading-tight mb-4 group-hover:text-accent transition-colors">
              {course.title}
            </h3>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Badge>{course.ects} ECTS</Badge>
                <Badge variant="default" icon={<Calendar size={12}/>}>{course.semester}</Badge>
                {course.grade && (
                  <Badge variant="success">Note: {course.grade.toFixed(2)}</Badge>
                )}
              </div>

              {course.status !== 'valide' && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>Préparation</span>
                    <span>{course.progress}%</span>
                  </div>
                  <ProgressBar value={course.progress} max={100} colorClass="bg-info" />
                </div>
              )}

              {course.nextEvent && (
                <div className="mt-2 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <BookOpen size={14} />
                    {course.nextEvent.type}
                  </span>
                  <span className="font-medium text-text">{course.nextEvent.date}</span>
                </div>
              )}
            </div>
            
          </Card>
        ))}
      </div>
    </div>
  );
}

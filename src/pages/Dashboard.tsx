import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, CalendarDays, Upload, Plus, Award, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { fetchCourses, fetchFlashcards } from '../services/supabaseService';

export function Dashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCourses(), fetchFlashcards()])
      .then(([coursesData, cardsData]) => {
        setCourses(coursesData);
        setFlashcards(cardsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalECTS = courses.reduce((acc, c) => acc + (c.status === 'Validé' ? Number(c.ects || 0) : 0), 0);
  const dueCards = flashcards.filter(f => new Date(f.due_at) <= new Date()).length;

  return (
    <div className="flex flex-col gap-8 pt-2 pb-6 animate-in fade-in duration-300">
      
      {/* En-tête de bienvenue */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl mb-1">Bonjour</h1>
          <p className="text-text-muted text-sm">Votre espace de droit personnel est synchronisé.</p>
        </div>
        <button 
          onClick={() => navigate('/add/course')}
          className="bg-accent text-background px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 hover:bg-accent-strong transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span>Nouveau cours</span>
        </button>
      </header>

      {/* Statistiques globales cliquables */}
      <div className="grid grid-cols-2 gap-4">
        <Card onClick={() => navigate('/courses')} className="cursor-pointer hover:border-accent/50 transition-colors flex flex-col gap-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">ECTS Validés</span>
            <Award size={18} className="text-accent" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl">{totalECTS}</span>
            <span className="text-xs text-text-muted">/ 180 ECTS</span>
          </div>
          <ProgressBar value={totalECTS} max={180} colorClass="bg-accent" />
        </Card>

        <Card onClick={() => navigate('/study')} className="cursor-pointer hover:border-accent/50 transition-colors flex flex-col gap-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Flashcards dues</span>
            <BrainCircuit size={18} className="text-info" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl">{dueCards}</span>
            <span className="text-xs text-text-muted">cartes</span>
          </div>
          <ProgressBar value={dueCards} max={50} colorClass="bg-info" />
        </Card>
      </div>

      {/* Raccourcis d'actions rapides */}
      <div className="grid grid-cols-3 gap-3">
        <button 
          onClick={() => navigate('/import')}
          className="p-4 bg-surface border border-border rounded-xl flex flex-col items-center text-center gap-2 hover:border-accent/50 transition-all group"
        >
          <div className="w-10 h-10 bg-info/10 text-info rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload size={20} />
          </div>
          <span className="text-xs font-medium">Importer plan</span>
        </button>

        <button 
          onClick={() => navigate('/schedule')}
          className="p-4 bg-surface border border-border rounded-xl flex flex-col items-center text-center gap-2 hover:border-accent/50 transition-all group"
        >
          <div className="w-10 h-10 bg-warning/10 text-warning rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarDays size={20} />
          </div>
          <span className="text-xs font-medium">Planning</span>
        </button>

        <button 
          onClick={() => navigate('/study')}
          className="p-4 bg-surface border border-border rounded-xl flex flex-col items-center text-center gap-2 hover:border-accent/50 transition-all group"
        >
          <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <BrainCircuit size={20} />
          </div>
          <span className="text-xs font-medium">Réviser</span>
        </button>
      </div>

      {/* Liste des cours récents */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-xl">Vos cours récents</h2>
          <button onClick={() => navigate('/courses')} className="text-xs text-accent font-medium flex items-center gap-1 hover:underline">
            <span>Voir tout</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-text-muted text-sm">Chargement...</div>
         маслом courses.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl text-text-muted text-sm">
            Aucun cours enregistré. Cliquez sur "Nouveau cours" pour commencer.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {courses.slice(0, 3).map(course => {
              const realProgress = course.status === 'Validé' ? 100 : 0;
              return (
                <Card 
                  key={course.id} 
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:border-accent/50 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-surface-elevated rounded-lg flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm group-hover:text-accent transition-colors truncate">{course.title}</p>
                        <Badge variant="outline">{course.course_code || 'COURS'}</Badge>
                      </div>
                      <p className="text-xs text-text-muted">{course.ects} ECTS • {course.status}</p>
                    </div>
                  </div>
                  <div className="w-20 shrink-0 hidden md:block">
                    <ProgressBar value={realProgress} max={100} colorClass="bg-info" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}

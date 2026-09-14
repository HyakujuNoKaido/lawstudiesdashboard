import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Search, SlidersHorizontal, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchCourses } from '../services/supabaseService';

export function Courses() {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses()
      .then(data => setCourses(data))
      .catch(err => console.error("Erreur fetch courses:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = courses.filter(course => {
    if (activeFilter === 'Tous') return true;
    if (activeFilter === 'En cours' && course.status === 'En cours') return true;
    if (activeFilter === 'Validés' && course.status === 'Validé') return true;
    if (activeFilter === 'À reprendre' && course.status === 'À reprendre') return true;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header className="flex flex-col gap-4">
        <h1 className="font-serif text-3xl mb-1">Cours</h1>
        
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

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {['Tous', 'En cours', 'Validés', 'À reprendre'].map(filter => (
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

      {loading ? (
        <div className="text-center py-12 text-text-muted text-sm">Chargement de vos cours...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-text-muted text-sm">
          Aucun cours trouvé. Utilisez le bouton d'ajout "+" pour commencer.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map(course => {
            const realProgress = course.status === 'Validé' ? 100 : 0;
            return (
              <Card key={course.id} onClick={() => navigate(`/courses/${course.id}`)} className="group cursor-pointer">
                
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="outline">{course.course_code || 'COURS'}</Badge>
                  
                  {course.status === 'En cours' && <Badge variant="accent" icon={<Clock size={12}/>}>En cours</Badge>}
                  {course.status === 'Validé' && <Badge variant="success" icon={<CheckCircle2 size={12}/>}>Validé</Badge>}
                  {course.status === 'À reprendre' && <Badge variant="danger" icon={<AlertCircle size={12}/>}>À reprendre</Badge>}
                </div>

                <h3 className="font-medium text-lg leading-tight mb-4 group-hover:text-accent transition-colors">
                  {course.title}
                </h3>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Badge>{course.ects} ECTS</Badge>
                    {course.teacher_name && <Badge variant="default">{course.teacher_name}</Badge>}
                  </div>

                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Progression</span>
                      <span>{realProgress}%</span>
                    </div>
                    <ProgressBar value={realProgress} max={100} colorClass="bg-info" />
                  </div>
                </div>
                
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

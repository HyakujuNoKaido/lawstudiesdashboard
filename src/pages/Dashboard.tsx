import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, CalendarDays, Upload, Plus, Award, ChevronRight, AlertTriangle, Clock, Scale } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { fetchCourses, fetchFlashcards, fetchEvents } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

const SOLO_USER_ID = '00000000-0000-0000-0000-000000000000';

export function Dashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [userName, setUserName] = useState('Étudiant');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCourses(), 
      fetchFlashcards(), 
      fetchEvents(),
      supabase.from('profiles').select('full_name').eq('id', SOLO_USER_ID).single()
    ])
      .then(([coursesData, cardsData, eventsData, profileRes]) => {
        setCourses(coursesData);
        setFlashcards(cardsData);
        setEvents(eventsData);
        if (profileRes.data?.full_name) {
          const firstName = profileRes.data.full_name.split(' ')[0];
          setUserName(firstName);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const totalECTS = courses.reduce((acc, c) => acc + (c.status === 'Validé' ? Number(c.ects || 0) : 0), 0);
  const dueCards = flashcards.filter(f => new Date(f.due_at) <= new Date()).length;
  
  const nextExam = events.find(e => e.category === 'Examen' && new Date(e.event_date) >= new Date());
  const daysBeforeExam = nextExam 
    ? Math.ceil((new Date(nextExam.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      {/* En-tête avec prénom dynamique */}
      <header className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Scale size={22} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-text">Bonjour, {userName}</h1>
            <p className="text-text-muted text-xs">Tu construis ton avenir, un cours à la fois.</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-accent hover:border-accent/50 transition-colors cursor-pointer"
        >
          <Award size={20} />
        </button>
      </header>

      {/* Progression ECTS */}
      <Card 
        onClick={() => navigate('/courses')}
        className="cursor-pointer bg-surface border-border hover:border-accent/40 transition-all p-5 flex flex-col gap-3 shadow-lg"
      >
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">Progression ECTS</span>
          <span className="text-xs text-text-muted font-medium">Encore {Math.max(0, 180 - totalECTS)} ECTS pour ton diplôme</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-3xl font-bold text-text">{totalECTS}<span className="text-lg text-text-muted font-normal">/180 ECTS</span></span>
        </div>
        <div className="w-full bg-surface-elevated rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-accent h-full rounded-full transition-all duration-500" 
            style={{ width: `${Math.min(100, (totalECTS / 180) * 100)}%` }}
          />
        </div>
      </Card>

      {/* Widgets rapides */}
      <Card 
        onClick={() => navigate('/schedule')}
        className="cursor-pointer bg-surface border-border hover:border-accent/40 transition-all p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-text-muted uppercase">Prochain examen</span>
            <h3 className="font-medium text-base text-text mt-0.5">
              {nextExam ? nextExam.title : 'Aucun examen planifié'}
            </h3>
            <p className="text-xs text-warning font-medium mt-0.5">
              {daysBeforeExam !== null ? `Dans ${daysBeforeExam} jour(s)` : 'Planifie tes échéances dans le calendrier'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-text-muted group-hover:text-accent transition-colors" />
      </Card>

      <Card 
        onClick={() => navigate('/study')}
        className="cursor-pointer bg-surface border-border hover:border-accent/40 transition-all p-4 flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BrainCircuit size={22} />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-text-muted uppercase">Flashcards</span>
            <h3 className="font-medium text-base text-text mt-0.5">
              {dueCards} cartes à réviser
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Renforce ta mémoire à long terme</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-text-muted group-hover:text-accent transition-colors" />
      </Card>

      {/* Raccourci vers les cours récents */}
      <section className="flex flex-col gap-3 mt-2">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-serif text-lg font-semibold">Accès direct aux cours</h2>
          <button onClick={() => navigate('/courses')} className="text-xs text-accent font-medium hover:underline cursor-pointer">
            Voir tout
          </button>
        </div>

        {courses.slice(0, 2).map(course => (
          <Card 
            key={course.id}
            onClick={() => navigate(`/courses/${course.id}`)}
            className="p-4 flex items-center justify-between cursor-pointer hover:border-accent/40 bg-surface"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-elevated text-accent flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="font-medium text-sm text-text">{course.title}</p>
                <p className="text-xs text-text-muted">{course.ects} ECTS • {course.status}</p>
              </div>
            </div>
            <Badge variant="outline">{course.course_code || 'COURS'}</Badge>
          </Card>
        ))}
      </section>

    </div>
  );
}

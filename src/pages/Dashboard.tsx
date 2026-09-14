import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, ChevronRight, Clock, Scale, FileText, Timer } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { fetchCourses, fetchFlashcards, fetchEvents } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { SOLO_USER_ID } from '../lib/constants';

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
  const upcomingCourses = events.filter(e => e.category === 'Cours' && new Date(e.event_date) >= new Date()).slice(0, 2);

  return (
    <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300 text-text">
      
      {/* En-tête épurée (Bouton profil en double retiré) */}
      <header className="flex items-center gap-3 px-1">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
          <Scale size={24} strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-text">Bonjour, {userName}</h1>
          <p className="text-text-muted text-xs font-medium mt-0.5">Espace académique de droit suisse.</p>
        </div>
      </header>

      {/* 1. Progression ECTS - Design minimaliste */}
      <Card 
        onClick={() => navigate('/courses')}
        className="cursor-pointer bg-surface border-border hover:border-accent/40 transition-all p-6 flex flex-col gap-4 shadow-sm group"
      >
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold tracking-widest text-text-muted uppercase">Progression ECTS</span>
          <ChevronRight size={16} className="text-text-muted group-hover:text-accent transition-colors" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-4xl font-bold text-text">{totalECTS}</span>
          <span className="text-sm text-text-muted font-medium">/ 180 ECTS</span>
        </div>
        <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-accent h-full rounded-full transition-all duration-700 ease-out" 
            style={{ width: `${Math.min(100, (totalECTS / 180) * 100)}%` }}
          />
        </div>
      </Card>

      {/* 2. Outils juridiques */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl font-semibold px-1">Outils juridiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card onClick={() => navigate('/cases/law')} className="cursor-pointer bg-surface border-border hover:border-accent/50 p-4 flex items-center gap-4 transition-all group shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FileText size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-medium text-sm text-text">Fiche d'Arrêt (ATF)</h3>
              <p className="text-[11px] text-text-muted">Synthèse de jurisprudence</p>
            </div>
          </Card>

          <Card onClick={() => navigate('/cases/study')} className="cursor-pointer bg-surface border-border hover:border-accent/50 p-4 flex items-center gap-4 transition-all group shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Scale size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-medium text-sm text-text">Subsumption</h3>
              <p className="text-[11px] text-text-muted">Résolution de cas pratique</p>
            </div>
          </Card>

          <Card onClick={() => navigate('/exams/simulator')} className="cursor-pointer bg-surface border-border hover:border-accent/50 p-4 flex items-center gap-4 transition-all group shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Timer size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-medium text-sm text-text">Examen Blanc</h3>
              <p className="text-[11px] text-text-muted">Simulateur chronométré</p>
            </div>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. Révisions actives */}
        <Card onClick={() => navigate('/study')} className="cursor-pointer bg-surface border-border hover:border-accent/40 transition-all p-5 flex flex-col gap-3 group shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BrainCircuit size={20} strokeWidth={1.5} />
            </div>
            <ChevronRight size={18} className="text-text-muted group-hover:text-accent transition-colors" />
          </div>
          <div className="mt-2">
            <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Révisions actives</span>
            <h3 className="font-medium text-lg text-text mt-1">{dueCards} flashcards dues</h3>
          </div>
        </Card>

        {/* 4. Prochains cours */}
        <Card onClick={() => navigate('/schedule')} className="cursor-pointer bg-surface border-border hover:border-accent/40 transition-all p-5 flex flex-col gap-3 group shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Clock size={20} strokeWidth={1.5} />
            </div>
            <ChevronRight size={18} className="text-text-muted group-hover:text-accent transition-colors" />
          </div>
          <div className="mt-2">
            <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Planning</span>
            {upcomingCourses.length > 0 ? (
              <h3 className="font-medium text-lg text-text mt-1 truncate">{upcomingCourses[0].title}</h3>
            ) : (
              <h3 className="font-medium text-lg text-text mt-1">Aucun cours à venir</h3>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}

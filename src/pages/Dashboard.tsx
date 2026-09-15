import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, ChevronRight, Clock, Scale, FileText, Timer, AlertCircle, CheckCircle2 } from 'lucide-react';
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

  // --- TRAITEMENT DES DONNÉES ---
  const totalECTS = courses.reduce((acc, c) => acc + (c.status === 'Validé' ? Number(c.ects || 0) : 0), 0);
  const dueCards = flashcards.filter(f => new Date(f.due_at) <= new Date()).length;
  
  // Séparer les événements du jour et ceux à venir
  const today = new Date().toDateString();
  const todayEvents = events.filter(e => new Date(e.event_date).toDateString() === today);
  const upcomingEvents = events.filter(e => new Date(e.event_date) > new Date() && new Date(e.event_date).toDateString() !== today).slice(0, 3);

  // Date du jour formatée en français
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const formattedDate = new Intl.DateTimeFormat('fr-CH', dateOptions).format(new Date());

  if (loading) {
    return <div className="pt-20 text-center text-text-muted text-sm font-mono animate-pulse">Chargement de l'espace...</div>;
  }

  return (
    <div className="flex flex-col gap-10 pt-2 pb-16 animate-in fade-in duration-500 text-text">
      
      {/* En-tête Éditoriale */}
      <header className="flex flex-col gap-1 px-1 border-b border-border pb-6">
        <p className="text-secondary font-mono text-[10px] uppercase tracking-widest font-bold">
          {formattedDate}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-text leading-none mt-1">
          Bonjour, {userName}.
        </h1>
        <p className="text-text-muted text-sm font-medium mt-2 max-w-lg leading-relaxed">
          Voici votre état des lieux pour aujourd'hui. Concentrez-vous sur vos échéances immédiates et votre mémoire.
        </p>
      </header>

      {/* Layout principal asymétrique (Type Magazine) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* COLONNE GAUCHE (7/12) : Action du jour & Timeline */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Focus du jour : La mémoire */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
              <BrainCircuit size={16} />
              Charge cognitive du jour
            </h2>
            <Card 
              variant="editorial" 
              onClick={() => navigate('/study')}
              className="group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BrainCircuit size={24} strokeWidth={1.5} />
                </div>
                <ChevronRight size={20} className="text-text-muted group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-text mb-1">
                {dueCards > 0 ? `${dueCards} flashcards à réviser` : "Mémoire à jour !"}
              </h3>
              <p className="text-sm text-text-muted mb-4">
                {dueCards > 0 
                  ? "Votre algorithme d'espacement a ciblé ces notions pour optimiser votre rétention long terme." 
                  : "Aucune révision urgente. Prenez de l'avance sur vos lectures ou reposez-vous."}
              </p>
              {dueCards > 0 && (
                <button className="text-xs font-bold uppercase tracking-wider text-info flex items-center gap-1 group-hover:underline">
                  Démarrer la session <ChevronRight size={14} />
                </button>
              )}
            </Card>
          </div>

          {/* Timeline : Programme du jour */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
              <Clock size={16} />
              Programme de la journée
            </h2>
            {todayEvents.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-6 text-center">
                <p className="text-sm text-text-muted">Aucun événement ou cours prévu aujourd'hui.</p>
                <button onClick={() => navigate('/schedule')} className="text-xs text-accent mt-2 hover:underline">Ouvrir le planning complet</button>
              </div>
            ) : (
              <div className="flex flex-col relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-border/60">
                {todayEvents.map((evt, idx) => (
                  <div key={idx} className="relative flex gap-4 items-start mb-6 last:mb-0 group cursor-pointer" onClick={() => navigate('/schedule')}>
                    <div className="w-6 h-6 rounded-full bg-background border-[3px] border-surface-elevated z-10 flex items-center justify-center mt-0.5 group-hover:border-accent transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-text-muted group-hover:bg-accent" />
                    </div>
                    <div className="flex-1 bg-surface-elevated border border-border/50 rounded-xl p-4 shadow-sm group-hover:border-accent/40 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-[11px] text-accent font-bold">
                          {new Date(evt.event_date).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <Badge variant={evt.category === 'Examen' ? 'danger' : 'outline'}>{evt.category}</Badge>
                      </div>
                      <h4 className="text-sm font-semibold text-text">{evt.title}</h4>
                      <p className="text-xs text-text-muted mt-1">{evt.courses?.title || 'Événement général'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* COLONNE DROITE (5/12) : Diplôme & Raccourcis */}
        <section className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Progression Diplôme */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
              <BookOpen size={16} />
              Progression du diplôme
            </h2>
            <Card 
              variant="default" 
              onClick={() => navigate('/courses')}
              className="bg-secondary/5 border-secondary/20 hover:border-secondary/50 group"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-[11px] font-mono text-secondary uppercase tracking-widest font-bold">Crédits ECTS</span>
                <ChevronRight size={16} className="text-secondary/50 group-hover:text-secondary transition-colors" />
              </div>
              
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-serif text-5xl font-bold text-text">{totalECTS}</span>
                <span className="text-sm font-mono text-text-muted">/ 180</span>
              </div>
              
              <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className="bg-secondary h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                  style={{ width: `${Math.min(100, (totalECTS / 180) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
              <p className="text-[10px] text-text-muted mt-3 text-right">
                {Math.round((totalECTS / 180) * 100)}% du cursus complété
              </p>
            </Card>
          </div>

          {/* Outils & Assistants */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
              <Scale size={16} />
              Atelier Juridique
            </h2>
            <div className="flex flex-col gap-0 border border-border rounded-xl overflow-hidden bg-surface">
              <div onClick={() => navigate('/cases/law')} className="flex items-center gap-4 p-4 border-b border-border hover:bg-surface-elevated cursor-pointer transition-colors">
                <div className="p-2 rounded-lg bg-warning/10 text-warning"><FileText size={18} /></div>
                <div>
                  <h4 className="text-sm font-semibold">Fiche d'Arrêt (ATF)</h4>
                  <p className="text-[11px] text-text-muted">Disséquer une jurisprudence</p>
                </div>
              </div>
              <div onClick={() => navigate('/cases/study')} className="flex items-center gap-4 p-4 border-b border-border hover:bg-surface-elevated cursor-pointer transition-colors">
                <div className="p-2 rounded-lg bg-info/10 text-info"><Scale size={18} /></div>
                <div>
                  <h4 className="text-sm font-semibold">Subsumption</h4>
                  <p className="text-[11px] text-text-muted">Résoudre un cas pratique</p>
                </div>
              </div>
              <div onClick={() => navigate('/exams/simulator')} className="flex items-center gap-4 p-4 hover:bg-surface-elevated cursor-pointer transition-colors">
                <div className="p-2 rounded-lg bg-danger/10 text-danger"><Timer size={18} /></div>
                <div>
                  <h4 className="text-sm font-semibold">Examen Blanc</h4>
                  <p className="text-[11px] text-text-muted">Générer un sujet inédit (IA)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prochaines échéances (Compact) */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                <AlertCircle size={16} />
                À l'horizon
              </h2>
              <div className="flex flex-col gap-3">
                {upcomingEvents.map((evt, idx) => (
                  <Card key={idx} variant="minimal" onClick={() => navigate('/schedule')} className="group flex items-center justify-between pb-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium group-hover:text-accent transition-colors">{evt.title}</p>
                      <p className="text-[11px] font-mono text-text-muted">
                        {new Date(evt.event_date).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </Card>
                ))}
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}

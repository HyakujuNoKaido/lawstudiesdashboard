import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, Calendar, FileText, FileEdit, ChevronRight, Activity, Flame, Clock, Target, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { fetchCourses, fetchNotes, fetchEvents, fetchFlashcards } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { SOLO_USER_ID } from '../lib/constants';

export function Dashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Métriques du Journal de Bord
  const [weeklyStats, setWeeklyStats] = useState({
    docsAdded: 0,
    cardsReviewed: 0,
    notesUpdated: 0,
    coursesActive: 0
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [coursesData, eventsData, notesData, cardsData, docsRes] = await Promise.all([
          fetchCourses(),
          fetchEvents(),
          fetchNotes(),
          fetchFlashcards(),
          supabase.from('documents').select('created_at').eq('user_id', SOLO_USER_ID)
        ]);
        
        setCourses(coursesData);
        setEvents(eventsData);

        // --- CALCUL DU JOURNAL DE BORD (7 derniers jours) ---
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentDocs = (docsRes.data || []).filter(d => new Date(d.created_at) > oneWeekAgo).length;
        const recentNotes = notesData.filter((n: any) => new Date(n.updated_at) > oneWeekAgo).length;
        // On simule les cartes révisées via last_reviewed_at si existant, sinon on compte le total pour la démo
        const cardsReviewed = cardsData.filter((c: any) => c.last_reviewed_at && new Date(c.last_reviewed_at) > oneWeekAgo).length || cardsData.length;

        setWeeklyStats({
          docsAdded: recentDocs,
          notesUpdated: recentNotes,
          cardsReviewed: cardsReviewed,
          coursesActive: coursesData.length
        });

      } catch (err) {
        console.error("Erreur chargement dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Filtrer les événements pour "Aujourd'hui"
  const today = new Date().toISOString().split('T')[0];
  const todaysEvents = events.filter(e => e.event_date.startsWith(today));

  // Salutation dynamique
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (loading) return <div className="text-center p-12 text-text-muted font-mono animate-pulse">Chargement de votre espace...</div>;

  return (
    <div className="flex flex-col gap-8 pt-2 pb-24 animate-in fade-in duration-300">
      
      {/* HEADER : Salutation & Bouton Mode Amphi */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2">{greeting}, Maître.</h1>
          <p className="text-text-muted text-sm">Voici votre journal de bord et vos priorités du jour.</p>
        </div>
        <button 
          onClick={() => navigate('/notes')}
          className="bg-accent text-background px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 glow-gold hover:scale-[1.02] transition-transform shadow-lg cursor-pointer"
        >
          <FileEdit size={18} /> Je suis en cours (Note rapide)
        </button>
      </header>

      {/* JOURNAL DE BORD : LE BILAN ANTI-CULPABILITÉ */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <Activity size={16} className="text-info" /> Bilan de la semaine
        </h2>
        <div className="bg-surface border border-info/30 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-info/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
                <Flame size={24} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-text mb-1">Beau travail !</h3>
                <p className="text-sm text-text-muted max-w-md leading-relaxed">
                  Même si vous avez l'impression de stagner, les chiffres montrent le contraire. Votre régularité paie, continuez à structurer votre savoir.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-8 bg-background/50 p-3 rounded-xl border border-border/50">
              <div className="flex flex-col items-center">
                <span className="font-mono text-2xl font-bold text-accent">{weeklyStats.docsAdded}</span>
                <span className="text-[10px] uppercase text-text-muted font-bold">Docs importés</span>
              </div>
              <div className="w-px h-8 bg-border/50 hidden md:block"></div>
              <div className="flex flex-col items-center">
                <span className="font-mono text-2xl font-bold text-warning">{weeklyStats.cardsReviewed}</span>
                <span className="text-[10px] uppercase text-text-muted font-bold">Flashcards vues</span>
              </div>
              <div className="w-px h-8 bg-border/50 hidden md:block"></div>
              <div className="flex flex-col items-center">
                <span className="font-mono text-2xl font-bold text-success">{weeklyStats.notesUpdated}</span>
                <span className="text-[10px] uppercase text-text-muted font-bold">Notes rédigées</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE : AGENDA DU JOUR */}
        <section className="lg:col-span-1 flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <Calendar size={16} /> Aujourd'hui
          </h2>
          <Card className="bg-surface-elevated flex flex-col gap-3">
            {todaysEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-text-muted gap-2">
                <CheckCircle2 size={32} className="opacity-20" />
                <p className="text-sm">Aucun cours ni séminaire prévu aujourd'hui.</p>
              </div>
            ) : (
              todaysEvents.map(evt => (
                <div key={evt.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
                  <div className="w-1.5 h-full min-h-[40px] bg-accent rounded-full"></div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-sm text-text truncate">{evt.title}</span>
                    <span className="text-xs text-text-muted flex items-center gap-1 font-mono">
                      <Clock size={12} /> {new Date(evt.event_date).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <button onClick={() => navigate('/schedule')} className="mt-2 text-xs font-bold text-accent hover:underline text-center">
              Voir tout l'agenda
            </button>
          </Card>
        </section>

        {/* COLONNE DROITE : COURS RÉCENTS */}
        <section className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <BookOpen size={16} /> Accès rapide aux cours
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.slice(0, 4).map(course => (
              <Card 
                key={course.id} 
                onClick={() => navigate(`/courses/${course.id}`)}
                className="cursor-pointer hover:border-accent/50 transition-all group flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-base text-text group-hover:text-accent transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted group-hover:bg-accent group-hover:text-background transition-colors shrink-0">
                    <ChevronRight size={16} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted bg-surface-elevated w-fit px-2 py-1 rounded">
                  <Target size={12} className="text-info" /> {course.course_code || 'Général'} • {course.semester}
                </div>
              </Card>
            ))}
          </div>
          <button onClick={() => navigate('/courses')} className="w-fit text-xs font-bold text-text-muted hover:text-accent flex items-center gap-1 transition-colors">
            Voir tous les cours <ChevronRight size={14} />
          </button>
        </section>

      </div>
    </div>
  );
}

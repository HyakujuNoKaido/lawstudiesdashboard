import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, ChevronRight, Clock, Scale, FileText, Timer, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import { SOLO_USER_ID } from '../lib/constants';
import { useApp } from '../context/AppContext';
import { LexiIcons } from '../lib/icons';

export function Dashboard() {
  const navigate = useNavigate();
  
  // On consomme instantanément les données du contexte sans spinner !
  const { courses, events, flashcards, loading: contextLoading } = useApp();
  
  const [userName, setUserName] = useState('Étudiant');

  useEffect(() => {
    // Le nom d'utilisateur reste fetché localement en fond pour ne pas alourdir le contexte global
    supabase.from('profiles').select('full_name').eq('id', SOLO_USER_ID).single()
      .then((res) => {
        if (res.data?.full_name) {
          setUserName(res.data.full_name.split(' ')[0]);
        }
      });
  }, []);

  // --- TRAITEMENT DES DONNÉES ---
  const totalECTS = courses.reduce((acc, c) => acc + (c.status === 'Validé' ? Number(c.ects || 0) : 0), 0);
  const dueCards = flashcards.filter(f => new Date(f.due_at) <= new Date()).length;
  
  const today = new Date().toDateString();
  const todayEvents = events.filter(e => new Date(e.event_date).toDateString() === today);
  const upcomingEvents = events.filter(e => new Date(e.event_date) > new Date() && new Date(e.event_date).toDateString() !== today).slice(0, 3);

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const formattedDate = new Intl.DateTimeFormat('fr-CH', dateOptions).format(new Date());

  if (contextLoading) {
    return <div className="pt-20 text-center text-text-muted text-sm font-mono animate-pulse">Synchronisation de Lexi...</div>;
  }

  return (
    <div className="flex flex-col gap-10 pt-2 pb-16 animate-in fade-in duration-500 text-text">
      
      {/* En-tête Éditoriale (Plus imposante) */}
      <header className="flex flex-col gap-1 px-1 border-b border-border pb-6">
        <p className="text-secondary font-mono text-[11px] uppercase tracking-widest font-bold">
          {formattedDate}
        </p>
        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-text leading-none mt-2">
          Bonjour, {userName}.
        </h1>
        <p className="text-text-muted text-base font-medium mt-3 max-w-lg leading-relaxed">
          Voici votre état des lieux. Concentrez-vous sur vos échéances immédiates et l'entretien de votre mémoire.
        </p>
      </header>

      {/* Layout principal asymétrique */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* COLONNE GAUCHE (7/12) */}
        <section className="lg:col-span-7 flex flex-col gap-10">
          
          {/* Focus du jour (Carte Majeure, ombre plus profonde) */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
              <LexiIcons.Memory size={18} /> Charge cognitive du jour
            </h2>
            <Card 
              variant="editorial" 
              onClick={() => navigate('/study')}
              className="group cursor-pointer shadow-xl border-l-[4px] border-info/50 hover:border-info transition-all bg-surface-elevated"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-info/10 text-info flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <LexiIcons.Memory size={28} strokeWidth={1.5} />
                </div>
                <ChevronRight size={24} className="text-text-muted group-hover:text-info transition-colors" />
              </div>
              <h3 className="font-serif text-3xl font-bold text-text mb-2">
                {dueCards > 0 ? `${dueCards} flashcards à réviser` : "Mémoire à jour !"}
              </h3>
              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                {dueCards > 0 
                  ? "Votre algorithme d'espacement a ciblé ces notions pour optimiser votre rétention long terme. Ne laissez pas la courbe d'oubli chuter." 
                  : "Aucune révision urgente. Prenez de l'avance sur vos lectures ou reposez-vous l'esprit."}
              </p>
              {dueCards > 0 && (
                <button className="text-sm font-bold uppercase tracking-wider text-info flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  Démarrer la session <ChevronRight size={16} />
                </button>
              )}
            </Card>
          </div>

          {/* Timeline */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
              <LexiIcons.Schedule size={18} /> Programme de la journée
            </h2>
            {todayEvents.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center bg-surface/50">
                <p className="text-sm text-text-muted">Aucun événement ou cours prévu aujourd'hui.</p>
                <button onClick={() => navigate('/schedule')} className="text-sm font-bold text-accent mt-3 hover:underline">Ouvrir le calendrier</button>
              </div>
            ) : (
              <div className="flex flex-col relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-border/60">
                {todayEvents.map((evt, idx) => (
                  <div key={idx} className="relative flex gap-4 items-start mb-6 last:mb-0 group cursor-pointer" onClick={() => navigate('/schedule')}>
                    <div className="w-6 h-6 rounded-full bg-background border-[3px] border-surface-elevated z-10 flex items-center justify-center mt-0.5 group-hover:border-accent transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-text-muted group-hover:bg-accent" />
                    </div>
                    <div className="flex-1 bg-surface-elevated border border-border/50 rounded-2xl p-5 shadow-md group-hover:border-accent/40 group-hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-[12px] text-accent font-bold">
                          {new Date(evt.event_date).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <Badge variant={evt.category === 'Examen' ? 'danger' : 'outline'}>{evt.category}</Badge>
                      </div>
                      <h4 className="text-base font-semibold text-text">{evt.title}</h4>
                      <p className="text-xs text-text-muted mt-1 font-medium">{evt.courses?.title || 'Événement général'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* COLONNE DROITE (5/12) */}
        <section className="lg:col-span-5 flex flex-col gap-10">
          
          {/* Progression Diplôme */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
              <LexiIcons.Course size={18} /> Progression du diplôme
            </h2>
            <Card 
              variant="default" 
              onClick={() => navigate('/courses')}
              className="bg-secondary/5 border-secondary/20 hover:border-secondary/50 group cursor-pointer shadow-md"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-mono text-secondary uppercase tracking-widest font-bold">Crédits ECTS</span>
                <ChevronRight size={18} className="text-secondary/50 group-hover:text-secondary transition-colors" />
              </div>
              
              <div className="flex items-baseline gap-2 mb-5">
                <span className="font-serif text-6xl font-bold text-text">{totalECTS}</span>
                <span className="text-sm font-mono text-text-muted">/ 180</span>
              </div>
              
              <div className="w-full bg-surface-elevated rounded-full h-2.5 overflow-hidden shadow-inner">
                <div 
                  className="bg-secondary h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                  style={{ width: `${Math.min(100, (totalECTS / 180) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
              <p className="text-[11px] font-bold text-text-muted mt-3 text-right">
                {Math.round((totalECTS / 180) * 100)}% complété
              </p>
            </Card>
          </div>

          {/* Outils & Assistants (Action Majeure) */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
              <LexiIcons.Law size={18} /> Atelier Juridique
            </h2>
            <div className="flex flex-col gap-0 border border-border rounded-2xl overflow-hidden bg-surface shadow-lg">
              <div onClick={() => navigate('/cases/law')} className="flex items-center gap-4 p-5 border-b border-border hover:bg-surface-elevated cursor-pointer transition-colors group">
                <div className="p-3 rounded-xl bg-warning/10 text-warning group-hover:scale-110 transition-transform"><LexiIcons.Document size={20} /></div>
                <div>
                  <h4 className="text-sm font-bold text-text mb-0.5">Fiche d'Arrêt (ATF)</h4>
                  <p className="text-xs text-text-muted">Disséquer une jurisprudence</p>
                </div>
              </div>
              <div onClick={() => navigate('/cases/study')} className="flex items-center gap-4 p-5 border-b border-border hover:bg-surface-elevated cursor-pointer transition-colors group">
                <div className="p-3 rounded-xl bg-info/10 text-info group-hover:scale-110 transition-transform"><LexiIcons.Law size={20} /></div>
                <div>
                  <h4 className="text-sm font-bold text-text mb-0.5">Subsumption</h4>
                  <p className="text-xs text-text-muted">Résoudre un cas pratique</p>
                </div>
              </div>
              <div onClick={() => navigate('/exams/simulator')} className="flex items-center gap-4 p-5 hover:bg-surface-elevated cursor-pointer transition-colors group">
                <div className="p-3 rounded-xl bg-danger/10 text-danger group-hover:scale-110 transition-transform"><LexiIcons.Exam size={20} /></div>
                <div>
                  <h4 className="text-sm font-bold text-text mb-0.5">Examen Blanc</h4>
                  <p className="text-xs text-text-muted">Sujet généré par l'IA chronométré</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prochaines échéances (Carte plus légère) */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                <AlertCircle size={18} /> À l'horizon
              </h2>
              <div className="flex flex-col gap-3">
                {upcomingEvents.map((evt, idx) => (
                  <Card key={idx} variant="minimal" onClick={() => navigate('/schedule')} className="group flex items-center justify-between pb-4 hover:bg-surface-elevated/50 p-2 -mx-2 rounded-xl transition-colors cursor-pointer border-b border-border">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm font-bold text-text group-hover:text-accent transition-colors">{evt.title}</p>
                      <p className="text-[11px] font-mono text-text-muted">
                        {new Date(evt.event_date).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
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

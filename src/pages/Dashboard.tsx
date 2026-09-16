import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Calendar, FileText, BrainCircuit, FileEdit, Clock, Plus, BookOpen } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { fetchCourses, fetchEvents, fetchFlashcards, getCurrentUserId } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const navigate = useNavigate();
  
  const [profileName, setProfileName] = useState('Étudiant');
  const [loading, setLoading] = useState(true);
  
  const [events, setEvents] = useState<any[]>([]);
  const [dueCardsCount, setDueCardsCount] = useState(0);
  const [recentAccess, setRecentAccess] = useState<any[]>([]);
  
  const [weeklyStats, setWeeklyStats] = useState({
    studyTime: '2h 15m', // Valeur mockée en attendant un timer global
    cardsMastered: 0,
    progress: 0
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const userId = await getCurrentUserId();
        
        const [profileRes, coursesData, eventsData, cardsData, docsRes, notesRes] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', userId).single(),
          fetchCourses(),
          fetchEvents(),
          fetchFlashcards(),
          supabase.from('documents').select('id, original_name, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(2),
          supabase.from('notes').select('id, title, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(2)
        ]);

        if (profileRes.data?.full_name) {
          setProfileName(profileRes.data.full_name.split(' ')[0]);
        }

        // --- À FAIRE AUJOURD'HUI ---
        setEvents(eventsData);
        const dueCards = cardsData.filter(c => !c.due_at || new Date(c.due_at) <= new Date());
        setDueCardsCount(dueCards.length);

        // --- VOTRE SEMAINE ---
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const mastered = cardsData.filter(c => c.ease_factor >= 2.5 && new Date(c.last_reviewed_at) > oneWeekAgo).length;
        const totalEcts = coursesData.reduce((acc, c) => acc + (c.ects || 0), 0);
        const progress = totalEcts > 0 ? Math.min(100, Math.round(((coursesData.filter(c => c.status === 'Validé').length) / coursesData.length) * 100)) : 0;
        
        setWeeklyStats(prev => ({ ...prev, cardsMastered: mastered, progress }));

        // --- ACCÈS RÉCENTS (Fusion des docs, notes et cours) ---
        const combinedRecent = [
          ...(coursesData.slice(0, 1).map(c => ({ id: c.id, title: c.title, type: 'course', date: c.updated_at }))),
          ...(docsRes.data || []).map(d => ({ id: d.id, title: d.original_name, type: 'doc', date: d.created_at })),
          ...(notesRes.data || []).map(n => ({ id: n.id, title: n.title, type: 'note', date: n.updated_at }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
        
        setRecentAccess(combinedRecent);

      } catch (err) {
        console.error("Erreur chargement dashboard", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaysEvents = events.filter(e => e.event_date.startsWith(today));
  const hasTasks = dueCardsCount > 0 || todaysEvents.length > 0;

  if (loading) {
    return <div className="text-center p-12 text-text-muted font-mono animate-pulse">Ouverture du cockpit...</div>;
  }

  return (
    <div className="flex flex-col gap-8 pt-4 pb-24 animate-in fade-in duration-300 max-w-4xl mx-auto">
      
      {/* HEADER : COCKPIT */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-1 text-text">
            Bonjour, {profileName}
          </h1>
          <p className="text-text-muted text-sm font-medium">
            Voici ce qui mérite votre attention aujourd'hui.
          </p>
        </div>
        <button 
          onClick={() => navigate('/editor/new')}
          className="bg-surface-elevated border border-border text-text hover:bg-surface-interactive px-5 py-3 rounded-btn text-sm font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
        >
          <Plus size={16} /> Note rapide
        </button>
      </header>

      {/* ACTION PRINCIPALE : CONTINUER LA RÉVISION */}
      {dueCardsCount > 0 && (
        <button 
          onClick={() => navigate('/session/all', { state: { from: '/' } })}
          className="w-full bg-accent text-background rounded-card p-5 flex items-center justify-between shadow-apple-subtle hover:scale-[1.01] hover:shadow-apple transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-background/20 rounded-xl flex items-center justify-center shrink-0">
              <BrainCircuit size={24} className="text-background" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg leading-tight">Continuer la révision</h3>
              <p className="text-background/80 text-sm font-medium">{dueCardsCount} flashcards dues. Environ {Math.ceil(dueCardsCount * 0.5)} minutes.</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center group-hover:bg-background/30 transition-colors">
            <Play size={18} className="text-background fill-background ml-1" />
          </div>
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLONNE GAUCHE : À FAIRE AUJOURD'HUI */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">À faire aujourd'hui</h2>
          
          <div className="flex flex-col gap-3">
            {!hasTasks ? (
              <Card className="flex flex-col items-center justify-center py-10 gap-3 text-center border-dashed bg-transparent">
                <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-2">
                  <Calendar size={20} className="text-text-muted opacity-50" />
                </div>
                <p className="text-sm font-medium text-text">Votre journée est libre.</p>
                <p className="text-xs text-text-muted">Ajoutez un cours ou planifiez une session d'étude.</p>
                <button onClick={() => navigate('/schedule')} className="mt-2 text-xs font-bold text-accent hover:underline cursor-pointer">Ouvrir le planning</button>
              </Card>
            ) : (
              <>
                {dueCardsCount > 0 && (
                  <Card className="flex items-center gap-4 p-4 border-l-4 border-l-warning">
                    <div className="p-2 bg-warning/10 text-warning rounded-lg"><BrainCircuit size={18} /></div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text">Session de mémorisation</span>
                      <span className="text-xs text-text-muted">{dueCardsCount} cartes en attente</span>
                    </div>
                  </Card>
                )}
                
                {todaysEvents.map(evt => (
                  <Card key={evt.id} className="flex items-center gap-4 p-4 border-l-4 border-l-info">
                    <div className="p-2 bg-info/10 text-info rounded-lg"><Clock size={18} /></div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-text">{evt.title}</span>
                      <span className="text-xs text-text-muted font-mono">{new Date(evt.event_date).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : VOTRE SEMAINE & ACCÈS RÉCENTS */}
        <div className="flex flex-col gap-8">
          
          {/* VOTRE SEMAINE */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Votre semaine</h2>
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 flex flex-col items-center justify-center text-center gap-1 bg-surface-interactive/50">
                <span className="text-[10px] text-text-muted font-bold uppercase">Temps d'étude</span>
                <span className="font-serif text-xl font-bold text-text">{weeklyStats.studyTime}</span>
              </Card>
              <Card className="p-4 flex flex-col items-center justify-center text-center gap-1 bg-surface-interactive/50">
                <span className="text-[10px] text-text-muted font-bold uppercase">Maîtrise</span>
                <span className="font-serif text-xl font-bold text-success">{weeklyStats.cardsMastered}</span>
              </Card>
              <Card className="p-4 flex flex-col items-center justify-center text-center gap-1 bg-surface-interactive/50">
                <span className="text-[10px] text-text-muted font-bold uppercase">Progression</span>
                <span className="font-serif text-xl font-bold text-info">{weeklyStats.progress}%</span>
              </Card>
            </div>
          </div>

          {/* ACCÈS RÉCENTS */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Accès récents</h2>
            <div className="flex flex-col bg-surface border border-border/50 rounded-card overflow-hidden">
              {recentAccess.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted">Aucune activité récente.</div>
              ) : (
                recentAccess.map((item, idx) => (
                  <div 
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      if (item.type === 'course') navigate(`/courses/${item.id}`);
                      if (item.type === 'doc') navigate(`/viewer/${item.id}`);
                      if (item.type === 'note') navigate(`/editor/${item.id}`);
                    }}
                    className={`flex items-center gap-4 p-4 hover:bg-surface-interactive cursor-pointer transition-colors ${idx !== recentAccess.length - 1 ? 'border-b border-border/50' : ''}`}
                  >
                    <div className="p-2 rounded-lg bg-surface-elevated text-text-muted shrink-0">
                      {item.type === 'course' && <BookOpen size={16} />}
                      {item.type === 'doc' && <FileText size={16} />}
                      {item.type === 'note' && <FileEdit size={16} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm text-text truncate">{item.title}</span>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                        {item.type === 'course' ? 'Cours' : item.type === 'doc' ? 'Document' : 'Note'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

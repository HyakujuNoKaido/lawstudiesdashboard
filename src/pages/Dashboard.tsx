import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Calendar, FileText, BrainCircuit, FileEdit, Clock, Plus, BookOpen, Activity, Settings2, ArrowUp, ArrowDown, Eye, EyeOff, Star } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { ActivityTimeline } from '../components/ui/ActivityTimeline';
import { fetchCourses, fetchEvents, fetchFlashcards, getCurrentUserId } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useApp();
  
  const [profileName, setProfileName] = useState('Étudiant');
  const [loading, setLoading] = useState(true);
  
  const [events, setEvents] = useState<any[]>([]);
  const [dueCardsCount, setDueCardsCount] = useState(0);
  const [recentAccess, setRecentAccess] = useState<any[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<any[]>([]);
  
  const [weeklyStats, setWeeklyStats] = useState({ cardsMastered: 0, progress: 0 });
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const userId = await getCurrentUserId();
        const [profileRes, coursesData, eventsData, cardsData, docsRes, notesRes] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', userId).single(),
          fetchCourses(), fetchEvents(), fetchFlashcards(),
          supabase.from('documents').select('id, original_name, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
          supabase.from('notes').select('id, title, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(5)
        ]);

        if (profileRes.data?.full_name) setProfileName(profileRes.data.full_name.split(' ')[0]);

        setEvents(eventsData);
        setDueCardsCount(cardsData.filter(c => !c.due_at || new Date(c.due_at) <= new Date()).length);

        const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const mastered = cardsData.filter(c => c.ease_factor >= 2.5 && new Date(c.last_reviewed_at) > oneWeekAgo).length;
        const totalEcts = coursesData.reduce((acc, c) => acc + (c.ects || 0), 0);
        const progress = totalEcts > 0 ? Math.min(100, Math.round(((coursesData.filter(c => c.status === 'Validé').length) / coursesData.length) * 100)) : 0;
        setWeeklyStats({ cardsMastered: mastered, progress });

        const combinedRecent = [
          ...(coursesData.slice(0, 2).map(c => ({ id: c.id, title: c.title, type: 'course', date: c.updated_at }))),
          ...(docsRes.data || []).map(d => ({ id: d.id, title: d.original_name, type: 'doc', date: d.created_at })),
          ...(notesRes.data || []).map(n => ({ id: n.id, title: n.title, type: 'note', date: n.updated_at }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
        setRecentAccess(combinedRecent);

        // Extraction des favoris à partir des données chargées
        const favs = [
          ...coursesData.filter(c => settings.favorites.includes(c.id)).map(c => ({ id: c.id, title: c.title, type: 'course' })),
          ...(docsRes.data || []).filter(d => settings.favorites.includes(d.id)).map(d => ({ id: d.id, title: d.original_name, type: 'doc' }))
        ];
        setFavoriteItems(favs);

      } catch (err) {
        console.error("Erreur chargement dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [settings.favorites]);

  const today = new Date().toISOString().split('T')[0];
  const todaysEvents = events.filter(e => e.event_date.startsWith(today));
  const hasTasks = dueCardsCount > 0 || todaysEvents.length > 0;

  // --- LOGIQUE DE PERSONNALISATION ---
  const handleToggleModule = (id: string) => {
    const newModules = settings.dashboardModules.map(m => m.id === id ? { ...m, visible: !m.visible } : m);
    updateSettings({ dashboardModules: newModules });
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === settings.dashboardModules.length - 1)) return;
    const newModules = [...settings.dashboardModules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newModules[index].order, newModules[targetIndex].order] = [newModules[targetIndex].order, newModules[index].order];
    newModules.sort((a, b) => a.order - b.order);
    updateSettings({ dashboardModules: newModules });
  };

  const renderModule = (id: string) => {
    switch (id) {
      case 'today':
        return (
          <div key="today" className="flex flex-col gap-4 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">À faire aujourd'hui</h2>
            <div className="flex flex-col gap-3">
              {!hasTasks ? (
                <Card className="flex flex-col items-center justify-center py-10 gap-3 text-center border-dashed bg-transparent shadow-none">
                  <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-2"><Calendar size={20} className="text-text-muted opacity-50" /></div>
                  <p className="text-sm font-medium text-text">Votre journée est libre.</p>
                  <button onClick={() => navigate('/schedule')} className="text-xs font-bold text-accent hover:underline cursor-pointer">Ouvrir le planning</button>
                </Card>
              ) : (
                <>
                  {dueCardsCount > 0 && (
                    <Card className="flex items-center gap-4 p-4 border-l-4 border-l-warning">
                      <div className="p-2 bg-warning/10 text-warning rounded-lg"><BrainCircuit size={18} /></div>
                      <div className="flex flex-col"><span className="font-bold text-sm text-text">Session de mémorisation</span><span className="text-xs text-text-muted">{dueCardsCount} cartes en attente</span></div>
                    </Card>
                  )}
                  {todaysEvents.map(evt => (
                    <Card key={evt.id} className="flex items-center gap-4 p-4 border-l-4 border-l-info">
                      <div className="p-2 bg-info/10 text-info rounded-lg"><Clock size={18} /></div>
                      <div className="flex flex-col"><span className="font-bold text-sm text-text">{evt.title}</span><span className="text-xs text-text-muted font-mono">{new Date(evt.event_date).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}</span></div>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </div>
        );

      case 'weekly':
        return (
          <div key="weekly" className="flex flex-col gap-4 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Statistiques (7 jours)</h2>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 flex flex-col justify-center gap-1 bg-surface-interactive/50 border-t-2 border-t-success rounded-t-none">
                <span className="text-[10px] text-text-muted font-bold uppercase">Cartes maîtrisées</span>
                <span className="font-serif text-3xl font-bold text-success">{weeklyStats.cardsMastered}</span>
              </Card>
              <Card className="p-4 flex flex-col justify-center gap-1 bg-surface-interactive/50 border-t-2 border-t-info rounded-t-none">
                <span className="text-[10px] text-text-muted font-bold uppercase">Diplôme</span>
                <span className="font-serif text-3xl font-bold text-info">{weeklyStats.progress}%</span>
              </Card>
            </div>
          </div>
        );

      case 'favorites':
        if (favoriteItems.length === 0 && !isCustomizing) return null;
        return (
          <div key="favorites" className="flex flex-col gap-4 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1 flex items-center gap-1.5"><Star size={14} className="text-warning"/> Épinglés</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favoriteItems.length === 0 ? (
                <div className="col-span-2 p-6 text-center text-xs text-text-muted border border-dashed border-border rounded-card">Utilisez le menu [···] d'un cours pour l'épingler ici.</div>
              ) : (
                favoriteItems.map(item => (
                  <Card key={item.id} onClick={() => item.type === 'course' ? navigate(`/courses/${item.id}`) : navigate(`/viewer/${item.id}`)} className="p-4 flex items-center gap-3 cursor-pointer hover:border-warning/50 border-border/50 group">
                    <div className="p-2 bg-warning/10 text-warning rounded-lg"><Star size={16} fill="currentColor" /></div>
                    <span className="font-medium text-sm text-text truncate group-hover:text-accent transition-colors">{item.title}</span>
                  </Card>
                ))
              )}
            </div>
          </div>
        );

      case 'recent':
        return (
          <div key="recent" className="flex flex-col gap-4 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Accès récents</h2>
            <div className="flex flex-col bg-surface border border-border/50 rounded-card overflow-hidden">
              {recentAccess.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted">Aucune activité récente.</div>
              ) : (
                recentAccess.map((item, idx) => (
                  <div key={`${item.type}-${item.id}`} onClick={() => { if (item.type === 'course') navigate(`/courses/${item.id}`); if (item.type === 'doc') navigate(`/viewer/${item.id}`); if (item.type === 'note') navigate(`/editor/${item.id}`); }} className={`flex items-center gap-4 p-4 hover:bg-surface-interactive cursor-pointer transition-colors ${idx !== recentAccess.length - 1 ? 'border-b border-border/50' : ''}`}>
                    <div className="p-2 rounded-lg bg-surface-elevated text-text-muted shrink-0">{item.type === 'course' && <BookOpen size={16} />}{item.type === 'doc' && <FileText size={16} />}{item.type === 'note' && <FileEdit size={16} />}</div>
                    <div className="flex flex-col min-w-0"><span className="font-medium text-sm text-text truncate">{item.title}</span><span className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">{item.type === 'course' ? 'Cours' : item.type === 'doc' ? 'Document' : 'Note'}</span></div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'activity':
        return (
          <div key="activity" className="flex flex-col gap-4 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1 flex items-center gap-1.5"><Activity size={14}/> Journal d'activité</h2>
            <Card className="bg-surface p-5"><ActivityTimeline /></Card>
          </div>
        );

      default: return null;
    }
  };

  if (loading) return <div className="text-center p-12 text-text-muted font-mono animate-pulse">Ouverture du cockpit...</div>;

  const visibleModules = settings.dashboardModules.filter(m => m.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-8 pt-4 pb-24 animate-in fade-in duration-300 max-w-4xl mx-auto relative">
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-1 text-text">Bonjour, {profileName}</h1>
          <p className="text-text-muted text-sm font-medium">Voici ce qui mérite votre attention aujourd'hui.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsCustomizing(!isCustomizing)} className={`p-3 rounded-btn flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all ${isCustomizing ? 'bg-accent text-background glow-gold' : 'bg-surface-elevated border border-border text-text hover:bg-surface-interactive'}`}>
            <Settings2 size={16} /> <span className="hidden sm:inline">{isCustomizing ? 'Terminer' : 'Modifier'}</span>
          </button>
          <button onClick={() => navigate('/editor/new')} className="bg-surface-elevated border border-border text-text hover:bg-surface-interactive px-5 py-3 rounded-btn text-sm font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.98]">
            <Plus size={16} /> Note rapide
          </button>
        </div>
      </header>

      {/* PANNEAU DE PERSONNALISATION (S'affiche sous le header si actif) */}
      {isCustomizing && (
        <div className="bg-surface border border-accent/40 rounded-card p-5 animate-in slide-in-from-top-4 shadow-apple-subtle mb-4">
          <h3 className="font-bold text-sm mb-4 text-accent">Personnalisation du Cockpit</h3>
          <div className="flex flex-col gap-2">
            {settings.dashboardModules.sort((a, b) => a.order - b.order).map((mod, idx) => (
              <div key={mod.id} className="flex items-center justify-between bg-surface-elevated p-3 rounded-btn border border-border/50">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleModule(mod.id)} className={`p-1.5 rounded-md transition-colors cursor-pointer ${mod.visible ? 'bg-accent/20 text-accent' : 'bg-surface text-text-muted'}`}>
                    {mod.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <span className={`text-sm font-medium ${mod.visible ? 'text-text' : 'text-text-muted line-through opacity-50'}`}>{mod.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button disabled={idx === 0} onClick={() => handleMoveModule(idx, 'up')} className="p-1.5 text-text-muted hover:text-text disabled:opacity-30 cursor-pointer"><ArrowUp size={16}/></button>
                  <button disabled={idx === settings.dashboardModules.length - 1} onClick={() => handleMoveModule(idx, 'down')} className="p-1.5 text-text-muted hover:text-text disabled:opacity-30 cursor-pointer"><ArrowDown size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOUTON D'ACTION PRINCIPALE (Statique) */}
      {dueCardsCount > 0 && !isCustomizing && (
        <button onClick={() => navigate('/session/all', { state: { from: '/' } })} className="w-full bg-accent text-background rounded-card p-5 flex items-center justify-between shadow-apple-subtle hover:scale-[1.01] hover:shadow-apple transition-all cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-background/20 rounded-xl flex items-center justify-center shrink-0"><BrainCircuit size={24} className="text-background" /></div>
            <div className="text-left"><h3 className="font-bold text-lg leading-tight">Continuer la révision</h3><p className="text-background/80 text-sm font-medium">{dueCardsCount} flashcards dues. Environ {Math.ceil(dueCardsCount * 0.5)} minutes.</p></div>
          </div>
          <div className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center group-hover:bg-background/30 transition-colors"><Play size={18} className="text-background fill-background ml-1" /></div>
        </button>
      )}

      {/* RENDU DYNAMIQUE DES MODULES (En 2 colonnes sur Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-8">
        <div className="flex flex-col gap-8">
          {visibleModules.filter((_, i) => i % 2 === 0).map(m => renderModule(m.id))}
        </div>
        <div className="flex flex-col gap-8">
          {visibleModules.filter((_, i) => i % 2 !== 0).map(m => renderModule(m.id))}
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Settings2, Target, BookOpen, Award, LogOut, Moon, Sun, Edit3, X, Check } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { toast } from '../lib/toast';
import { supabase } from '../lib/supabase';
import { SOLO_USER_ID } from '../lib/constants';
import { fetchCourses } from '../services/supabaseService';

export function Profile() {
  const navigate = useNavigate();
  const { settings } = useApp();
  const [activeTab, setActiveTab] = useState<'diploma' | 'personal' | 'settings'>('diploma');

  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    university: '',
    cycle: ''
  });

  useEffect(() => {
    async function loadUserData() {
      try {
        const [profileRes, coursesData, gradesRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', SOLO_USER_ID).single(),
          fetchCourses(),
          supabase.from('grades').select('*').eq('user_id', SOLO_USER_ID)
        ]);

        if (profileRes.data) {
          setProfile(profileRes.data);
          setEditForm({
            full_name: profileRes.data.full_name || '',
            university: profileRes.data.university || '',
            cycle: profileRes.data.cycle || 'Bachelor en Droit'
          });
        }
        setCourses(coursesData);
        setGrades(gradesRes.data || []);
      } catch (err) {
        console.error("Erreur chargement profil:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: SOLO_USER_ID,
        full_name: editForm.full_name,
        university: editForm.university,
        cycle: editForm.cycle,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setProfile({ ...profile, ...editForm });
      setIsEditProfileOpen(false);
      toast("Profil mis à jour", "success");
    } catch (err) {
      toast("Erreur lors de la mise à jour", "error");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      toast("Déconnexion réussie", "success");
      navigate('/onboarding');
    }
  };

  // Calculs dynamiques basés sur tes vraies données
  const totalECTS = courses.reduce((sum, c) => sum + (Number(c.ects) || 6), 0);
  
  let gpaText = "Aucune note d'examen enregistrée";
  if (grades.length > 0) {
    const totalWeighted = grades.reduce((sum, g) => sum + (Number(g.grade) * Number(g.weight)), 0);
    const totalWeight = grades.reduce((sum, g) => sum + Number(g.weight), 0);
    if (totalWeight > 0) {
      gpaText = `${(totalWeighted / totalWeight).toFixed(2)} / 6.0`;
    }
  }

  if (loading) return <div className="text-center p-12 text-text-muted font-mono animate-pulse">Chargement de votre profil...</div>;

  return (
    <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300 text-text max-w-4xl mx-auto w-full relative">
      
      {/* HEADER PROFIL : Données réelles Supabase */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-surface border border-border p-6 md:p-8 rounded-3xl shadow-sm relative">
        <button 
          onClick={() => setIsEditProfileOpen(true)}
          className="absolute top-6 right-6 p-2 bg-surface-elevated hover:bg-accent hover:text-background border border-border rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Edit3 size={14} /> Modifier
        </button>

        <div className="w-24 h-24 rounded-full bg-accent/10 border-2 border-accent text-accent flex items-center justify-center font-serif text-4xl font-bold uppercase shrink-0 shadow-inner">
          {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'LX'}
        </div>
        <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
          <h1 className="font-serif text-3xl font-bold text-text mb-1.5">{profile?.full_name || 'Étudiant en Droit'}</h1>
          <p className="text-sm font-medium text-text-muted flex items-center gap-2 mb-4">
            <GraduationCap size={16} /> {profile?.cycle || 'Bachelor en Droit'} • {profile?.university || 'Université suisse'}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="bg-surface-elevated text-text px-3 py-1 rounded-lg text-xs font-bold border border-border">Moyenne: {gpaText}</span>
            <span className="bg-accent/10 text-accent px-3 py-1 rounded-lg text-xs font-bold border border-accent/25">{totalECTS} ECTS inscrits</span>
            <span className="bg-surface-elevated text-text-muted px-3 py-1 rounded-lg text-xs font-bold border border-border">{courses.length} cours actifs</span>
          </div>
        </div>
      </div>

      {/* SYSTÈME D'ONGLETS */}
      <div className="flex bg-surface-elevated border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto custom-scrollbar">
        <button onClick={() => setActiveTab('diploma')} className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'diploma' ? 'bg-accent text-background shadow-sm' : 'text-text-muted hover:text-text'}`}>
          Vue du cursus
        </button>
        <button onClick={() => setActiveTab('personal')} className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-accent text-background shadow-sm' : 'text-text-muted hover:text-text'}`}>
          Identité & Objectifs
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-accent text-background shadow-sm' : 'text-text-muted hover:text-text'}`}>
          Préférences UX
        </button>
      </div>

      {/* CONTENU DES ONGLETS */}
      <div className="flex flex-col gap-6">
        
        {/* ONGLET 1 : CURSUS & COURS */}
        {activeTab === 'diploma' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-surface flex flex-col items-center justify-center p-6 text-center">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-2">Total ECTS en cours</span>
                <span className="font-serif text-5xl font-bold text-accent">{totalECTS}</span>
                <span className="text-xs text-text-muted mt-2">Basé sur vos cours</span>
              </Card>
              <Card className="bg-surface flex flex-col items-center justify-center p-6 text-center">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-2">Cours enregistrés</span>
                <span className="font-serif text-5xl font-bold text-info">{courses.length}</span>
                <span className="text-xs text-text-muted mt-2">Matières actives</span>
              </Card>
              <Card className="bg-surface flex flex-col items-center justify-center p-6 text-center">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-2">Notes d'examens</span>
                <span className="font-serif text-3xl font-bold text-text-muted mt-2">{grades.length === 0 ? 'Aucune' : grades.length}</span>
                <span className="text-xs text-text-muted mt-2">Saisies à ce jour</span>
              </Card>
            </div>

            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 mb-3 px-1 text-text">
                <BookOpen size={18} className="text-accent" /> Vos cours actuels
              </h3>
              <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
                {courses.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-sm">Aucun cours trouvé. Ajoutez vos matières depuis l'onglet Cours.</div>
                ) : (
                  courses.map(c => (
                    <div key={c.id} className="p-4 md:p-5 flex justify-between items-center bg-surface-elev/30 hover:bg-surface-elevated/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text">{c.title}</span>
                        <span className="text-xs text-text-muted">{c.teacher_name || 'Enseignant non spécifié'} • {c.semester || 'Semestre actuel'}</span>
                      </div>
                      <span className="text-sm font-bold bg-surface-elevated border border-border px-3 py-1.5 rounded-lg">{c.ects || 6} ECTS</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 2 : IDENTITÉ & OBJECTIFS */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <Card className="bg-surface p-6 flex flex-col gap-5">
              <h3 className="font-bold flex items-center gap-2 text-accent text-lg"><User size={20}/> Identité Académique</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Nom complet</label>
                  <p className="font-medium text-text bg-surface-elevated border border-border px-3 py-2 rounded-xl">{profile?.full_name || 'Non renseigné'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Université</label>
                  <p className="font-medium text-text bg-surface-elevated border border-border px-3 py-2 rounded-xl">{profile?.university || 'Non renseignée'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Cycle / Cursus</label>
                  <p className="font-medium text-text bg-surface-elevated border border-border px-3 py-2 rounded-xl">{profile?.cycle || 'Bachelor en Droit'}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-surface p-6 flex flex-col gap-5">
              <h3 className="font-bold flex items-center gap-2 text-warning text-lg"><Target size={20}/> Objectifs & Barème</h3>
              <div className="flex flex-col gap-4 flex-1">
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-sm font-medium text-text">Barème suisse de réussite</span>
                  <span className="font-bold font-mono text-accent bg-accent/10 px-2 py-1 rounded">4.0 / 6.0</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-sm font-medium text-text">Mode de stockage</span>
                  <span className="font-bold font-mono text-success bg-success/10 px-2 py-1 rounded">Supabase Cloud</span>
                </div>
                <button 
                  onClick={() => setIsEditProfileOpen(true)}
                  className="mt-auto w-full text-xs font-bold text-background bg-text py-3 rounded-xl hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  Modifier mes informations
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ONGLET 3 : PRÉFÉRENCES UX */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="bg-surface border border-border rounded-3xl p-6 flex flex-col gap-6">
              <h3 className="font-bold flex items-center gap-2 text-info text-lg border-b border-border/50 pb-4">
                <Settings2 size={20}/> Préférences de l'application
              </h3>
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-text">Mode Focus juriste</p>
                    <p className="text-xs text-text-muted mt-0.5">Contraste renforcé et épuration visuelle.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSettings({ ...settings, focusMode: !settings.focusMode });
                      toast("Mode Focus mis à jour", "success");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${settings.focusMode ? 'bg-accent text-background border-accent' : 'bg-surface-elevated text-text-muted border-border'}`}
                  >
                    {settings.focusMode ? 'Activé' : 'Désactivé'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-danger/5 border border-danger/20 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="font-bold text-sm text-danger flex items-center gap-2"><LogOut size={16}/> Déconnexion</p>
                <p className="text-xs text-text-muted mt-1">Quitter votre session sécurisée sur cet appareil.</p>
              </div>
              <button onClick={handleLogout} className="text-danger text-sm font-bold bg-danger/10 px-6 py-2.5 rounded-xl hover:bg-danger/25 transition-colors cursor-pointer">
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALE : MODIFIER LE PROFIL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleSaveProfile} className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-3">
              <h3 className="font-serif font-bold text-lg">Modifier votre profil</h3>
              <button type="button" onClick={() => setIsEditProfileOpen(false)} className="p-1 text-text-muted hover:text-text cursor-pointer rounded-full bg-surface-elevated">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-bold text-text-muted">
                Nom complet
                <input 
                  type="text" 
                  value={editForm.full_name} 
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="bg-background border border-border rounded-xl p-2.5 text-sm text-text font-normal focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-text-muted">
                Université / Faculté
                <input 
                  type="text" 
                  value={editForm.university} 
                  onChange={(e) => setEditForm({...editForm, university: e.target.value})}
                  className="bg-background border border-border rounded-xl p-2.5 text-sm text-text font-normal focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-text-muted">
                Cursus (ex: Bachelor en Droit)
                <input 
                  type="text" 
                  value={editForm.cycle} 
                  onChange={(e) => setEditForm({...editForm, cycle: e.target.value})}
                  className="bg-background border border-border rounded-xl p-2.5 text-sm text-text font-normal focus:border-accent"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setIsEditProfileOpen(false)} className="px-4 py-2 bg-surface-elevated text-text text-xs font-bold rounded-xl cursor-pointer">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-accent text-background text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"><Check size={14}/> Enregistrer</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

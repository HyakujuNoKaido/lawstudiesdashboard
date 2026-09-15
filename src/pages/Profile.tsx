import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Settings2, Target, BookOpen, Award, LogOut, Moon, Sun, Edit3, X, Check } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { toast } from '../lib/toast';

export function Profile() {
  const navigate = useNavigate();
  const { settings } = useApp();
  const [activeTab, setActiveTab] = useState<'diploma' | 'personal' | 'settings'>('diploma');

  // États pour les modales d'édition
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditGoalsOpen, setIsEditGoalsOpen] = useState(false);

  // Données locales modifiables du profil
  const [profileData, setProfileData] = useState({
    fullName: "Aniss Bahaji",
    university: "Université de Genève (UNIGE)",
    cycle: "Master en Droit",
    targetAverage: "5.5",
    studyHours: "35h",
    targetDate: "Juin 2027"
  });

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      toast("Déconnexion réussie", "success");
      navigate('/onboarding');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditProfileOpen(false);
    toast("Identité académique mise à jour", "success");
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditGoalsOpen(false);
    toast("Objectifs mis à jour avec succès", "success");
  };

  return (
    <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300 text-text max-w-4xl mx-auto w-full relative">
      
      {/* HEADER PROFIL : Identité visuelle forte */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-surface border border-border p-6 md:p-8 rounded-3xl shadow-sm relative">
        <button 
          onClick={() => setIsEditProfileOpen(true)}
          className="absolute top-6 right-6 p-2 bg-surface-elevated hover:bg-accent hover:text-background border border-border rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Edit3 size={14} /> Modifier
        </button>

        <div className="w-24 h-24 rounded-full bg-accent/10 border-2 border-accent text-accent flex items-center justify-center font-serif text-4xl font-bold uppercase shrink-0 shadow-inner">
          AB
        </div>
        <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
          <h1 className="font-serif text-3xl font-bold text-text mb-1.5">{profileData.fullName}</h1>
          <p className="text-sm font-medium text-text-muted flex items-center gap-2 mb-4">
            <GraduationCap size={16} /> {profileData.cycle} • {profileData.university}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="bg-success/10 text-success px-3 py-1 rounded-lg text-xs font-bold border border-success/20">Moyenne: 5.2/6.0</span>
            <span className="bg-info/10 text-info px-3 py-1 rounded-lg text-xs font-bold border border-info/20">Semestre 2</span>
            <span className="bg-surface-elevated text-text-muted px-3 py-1 rounded-lg text-xs font-bold border border-border">90 ECTS</span>
          </div>
        </div>
      </div>

      {/* SYSTÈME D'ONGLETS */}
      <div className="flex bg-surface-elevated border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto custom-scrollbar">
        <button onClick={() => setActiveTab('diploma')} className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'diploma' ? 'bg-accent text-background shadow-sm' : 'text-text-muted hover:text-text'}`}>
          Vue du diplôme
        </button>
        <button onClick={() => setActiveTab('personal')} className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-accent text-background shadow-sm' : 'text-text-muted hover:text-text'}`}>
          Objectifs & Identité
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 sm:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-accent text-background shadow-sm' : 'text-text-muted hover:text-text'}`}>
          Préférences UX
        </button>
      </div>

      {/* CONTENU DES ONGLETS */}
      <div className="flex flex-col gap-6">
        
        {/* ONGLET 1 : DIPLÔME & ECTS */}
        {activeTab === 'diploma' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-surface flex flex-col items-center justify-center p-6 text-center">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-2">ECTS Obtenus</span>
                <span className="font-serif text-5xl font-bold text-success">42</span>
                <span className="text-xs text-text-muted mt-2">/ 90 requis</span>
              </Card>
              <Card className="bg-surface flex flex-col items-center justify-center p-6 text-center">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-2">En cours</span>
                <span className="font-serif text-5xl font-bold text-info">24</span>
                <span className="text-xs text-text-muted mt-2">Semestre actuel</span>
              </Card>
              <Card className="bg-surface flex flex-col items-center justify-center p-6 text-center border-accent/30 shadow-sm relative overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-accent tracking-wider mb-2 relative z-10">Progression</span>
                <span className="font-serif text-5xl font-bold text-text relative z-10">46%</span>
                <div className="w-full bg-surface-elevated h-2 rounded-full mt-4 overflow-hidden relative z-10">
                  <div className="bg-accent h-full w-[46%]"></div>
                </div>
              </Card>
            </div>

            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 mb-3 px-1 text-text">
                <BookOpen size={18} className="text-accent" /> Modules du Plan d'Études
              </h3>
              <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 md:p-5 border-b border-border flex justify-between items-center bg-surface-elevated/30">
                  <span className="font-semibold text-text">Droit Privé (Obligations, Réels)</span>
                  <span className="text-sm font-bold bg-surface-elevated border border-border px-3 py-1.5 rounded-lg">18 / 24 ECTS</span>
                </div>
                <div className="p-4 md:p-5 border-b border-border flex justify-between items-center bg-surface-elevated/30">
                  <span className="font-semibold text-text">Droit Pénal & Procédure</span>
                  <span className="text-sm font-bold text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg flex items-center gap-1">12 / 12 ECTS <Award size={14}/></span>
                </div>
                <div className="p-4 md:p-5 flex justify-between items-center bg-surface-elevated/30">
                  <span className="font-semibold text-text">Droit Public (Administratif, Constit)</span>
                  <span className="text-sm font-bold text-warning bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-lg">0 / 18 ECTS</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 2 : OBJECTIFS & IDENTITÉ */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <Card className="bg-surface p-6 flex flex-col gap-5">
              <h3 className="font-bold flex items-center gap-2 text-accent text-lg"><User size={20}/> Identité Académique</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Nom complet</label>
                  <p className="font-medium text-text bg-surface-elevated border border-border px-3 py-2 rounded-xl">{profileData.fullName}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Université</label>
                  <p className="font-medium text-text bg-surface-elevated border border-border px-3 py-2 rounded-xl">{profileData.university}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Cycle actuel</label>
                  <p className="font-medium text-text bg-surface-elevated border border-border px-3 py-2 rounded-xl">{profileData.cycle}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-surface p-6 flex flex-col gap-5">
              <h3 className="font-bold flex items-center gap-2 text-warning text-lg"><Target size={20}/> Objectifs</h3>
              <div className="flex flex-col gap-4 flex-1">
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-sm font-medium text-text">Moyenne cible</span>
                  <span className="font-bold font-mono text-accent bg-accent/10 px-2 py-1 rounded">{profileData.targetAverage} / 6.0</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-sm font-medium text-text">Heures d'étude / semaine</span>
                  <span className="font-bold font-mono text-text bg-surface-elevated px-2 py-1 rounded">{profileData.studyHours}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-sm font-medium text-text">Fin de diplôme prévue</span>
                  <span className="font-bold font-mono text-text bg-surface-elevated px-2 py-1 rounded">{profileData.targetDate}</span>
                </div>
                <button 
                  onClick={() => setIsEditGoalsOpen(true)}
                  className="mt-auto w-full text-xs font-bold text-background bg-text py-3 rounded-xl hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  Modifier mes objectifs
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ONGLET 3 : PRÉFÉRENCES UX & PARAMÈTRES */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="bg-surface border border-border rounded-3xl p-6 flex flex-col gap-6">
              <h3 className="font-bold flex items-center gap-2 text-info text-lg border-b border-border/50 pb-4">
                <Settings2 size={20}/> Paramètres de l'application
              </h3>
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-text">Thème de l'interface</p>
                    <p className="text-xs text-text-muted mt-0.5">Mode sombre actif (Optimisé droit).</p>
                  </div>
                  <span className="text-xs font-bold bg-accent/10 text-accent px-3 py-1 rounded-lg border border-accent/20">Sombre Premium</span>
                </div>
                <div className="h-px bg-border/50"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-text">Densité d'affichage</p>
                    <p className="text-xs text-text-muted mt-0.5">Style des listes (flashcards, cours).</p>
                  </div>
                  <select 
                    value={settings.listDensity}
                    onChange={() => toast("Préférence de densité enregistrée", "success")}
                    className="bg-background border border-border rounded-xl text-sm font-medium p-2 cursor-pointer"
                  >
                    <option value="comfortable">Aéré (Défaut)</option>
                    <option value="compact">Compact</option>
                  </select>
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

      {/* MODALE : MODIFIER L'IDENTITÉ */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleSaveProfile} className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-3">
              <h3 className="font-serif font-bold text-lg">Modifier l'identité académique</h3>
              <button type="button" onClick={() => setIsEditProfileOpen(false)} className="p-1 text-text-muted hover:text-text cursor-pointer rounded-full bg-surface-elevated">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-bold text-text-muted">
                Nom complet
                <input 
                  type="text" 
                  value={profileData.fullName} 
                  onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                  className="bg-background border border-border rounded-xl p-2.5 text-sm text-text font-normal focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-text-muted">
                Université
                <input 
                  type="text" 
                  value={profileData.university} 
                  onChange={(e) => setProfileData({...profileData, university: e.target.value})}
                  className="bg-background border border-border rounded-xl p-2.5 text-sm text-text font-normal focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-text-muted">
                Cycle d'étude
                <input 
                  type="text" 
                  value={profileData.cycle} 
                  onChange={(e) => setProfileData({...profileData, cycle: e.target.value})}
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

      {/* MODALE : MODIFIER LES OBJECTIFS */}
      {isEditGoalsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleSaveGoals} className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-3">
              <h3 className="font-serif font-bold text-lg">Modifier mes objectifs</h3>
              <button type="button" onClick={() => setIsEditGoalsOpen(false)} className="p-1 text-text-muted hover:text-text cursor-pointer rounded-full bg-surface-elevated">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-bold text-text-muted">
                Moyenne cible / 6.0
                <input 
                  type="text" 
                  value={profileData.targetAverage} 
                  onChange={(e) => setProfileData({...profileData, targetAverage: e.target.value})}
                  className="bg-background border border-border rounded-xl p-2.5 text-sm text-text font-normal focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-text-muted">
                Heures d'étude / semaine
                <input 
                  type="text" 
                  value={profileData.studyHours} 
                  onChange={(e) => setProfileData({...profileData, studyHours: e.target.value})}
                  className="bg-background border border-border rounded-xl p-2.5 text-sm text-text font-normal focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-text-muted">
                Fin de diplôme prévue
                <input 
                  type="text" 
                  value={profileData.targetDate} 
                  onChange={(e) => setProfileData({...profileData, targetDate: e.target.value})}
                  className="bg-background border border-border rounded-xl p-2.5 text-sm text-text font-normal focus:border-accent"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setIsEditGoalsOpen(false)} className="px-4 py-2 bg-surface-elevated text-text text-xs font-bold rounded-xl cursor-pointer">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-accent text-background text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"><Check size={14}/> Enregistrer</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

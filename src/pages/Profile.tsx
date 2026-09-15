import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Settings2, Target, BookOpen, Award, LogOut, Moon, Sun } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { toast } from '../lib/toast';

export function Profile() {
  const navigate = useNavigate();
  const { settings } = useApp();
  const [activeTab, setActiveTab] = useState<'diploma' | 'personal' | 'settings'>('diploma');

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      toast("Déconnexion réussie", "success");
      navigate('/onboarding');
    }
  };

  return (
    <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300 text-text max-w-4xl mx-auto w-full">
      
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-surface border border-border p-6 md:p-8 rounded-3xl shadow-sm">
        <div className="w-24 h-24 rounded-full bg-accent/10 border-2 border-accent text-accent flex items-center justify-center font-serif text-4xl font-bold uppercase shrink-0 shadow-inner">
          AB
        </div>
        <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
          <h1 className="font-serif text-3xl font-bold text-text mb-1.5">Aniss Bahaji</h1>
          <p className="text-sm font-medium text-text-muted flex items-center gap-2 mb-4">
            <GraduationCap size={16} /> Master en Droit • Université de Genève (UNIGE)
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="bg-success/10 text-success px-3 py-1 rounded-lg text-xs font-bold border border-success/20">Moyenne: 5.2/6.0</span>
            <span className="bg-info/10 text-info px-3 py-1 rounded-lg text-xs font-bold border border-info/20">Semestre 2</span>
            <span className="bg-surface-elevated text-text-muted px-3 py-1 rounded-lg text-xs font-bold border border-border">90 ECTS</span>
          </div>
        </div>
      </div>

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

      <div className="flex flex-col gap-6">
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

        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <Card className="bg-surface p-6 flex flex-col gap-5">
              <h3 className="font-bold flex items-center gap-2 text-accent text-lg"><User size={20}/> Identité Académique</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Nom complet</label>
                  <p className="font-medium text-text bg-surface-elevated border border-border px-3 py-2 rounded-xl">Aniss Bahaji</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Université</label>
                  <p className="font-medium text-text bg-surface-elevated border border-border px-3 py-2 rounded-xl">Université de Genève (UNIGE)</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Cycle actuel</label>
                  <p className="font-medium text-text bg-surface-elevated border border-border px-3 py-2 rounded-xl">Master en Droit</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-surface p-6 flex flex-col gap-5">
              <h3 className="font-bold flex items-center gap-2 text-warning text-lg"><Target size={20}/> Objectifs</h3>
              <div className="flex flex-col gap-4 flex-1">
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-sm font-medium text-text">Moyenne cible</span>
                  <span className="font-bold font-mono text-accent bg-accent/10 px-2 py-1 rounded">5.5 / 6.0</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-3">
                  <span className="text-sm font-medium text-text">Heures d'étude / semaine</span>
                  <span className="font-bold font-mono text-text bg-surface-elevated px-2 py-1 rounded">35h</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-sm font-medium text-text">Fin de diplôme prévue</span>
                  <span className="font-bold font-mono text-text bg-surface-elevated px-2 py-1 rounded">Juin 2027</span>
                </div>
                <button className="mt-auto w-full text-xs font-bold text-background bg-text py-3 rounded-xl hover:scale-[1.02] transition-transform cursor-pointer">
                  Modifier mes objectifs
                </button>
              </div>
            </Card>
          </div>
        )}

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
                    <p className="text-xs text-text-muted mt-0.5">Basculer entre mode sombre et clair.</p>
                  </div>
                  <div className="flex bg-surface-elevated border border-border rounded-lg p-1">
                    <button className="p-1.5 rounded text-text-muted hover:text-text"><Sun size={16} /></button>
                    <button className="p-1.5 rounded bg-accent text-background shadow-sm"><Moon size={16} /></button>
                  </div>
                </div>
                <div className="h-px bg-border/50"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-text">Densité d'affichage</p>
                    <p className="text-xs text-text-muted mt-0.5">Style des listes (flashcards, cours).</p>
                  </div>
                  <select 
                    value={settings.listDensity}
                    onChange={() => toast("Préférence enregistrée", "success")}
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
    </div>
  );
}

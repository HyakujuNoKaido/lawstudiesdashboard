import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Save, GraduationCap, Building2, BookOpen, Settings2, Activity, Moon, Zap, LayoutList } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { toast } from '../lib/toast';
import { SOLO_USER_ID } from '../lib/constants';

export function Profile() {
  const navigate = useNavigate();
  const { settings, updateSettings, logs } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: 'Étudiant en Droit',
    university_name: 'Université de Lausanne (UNIL)',
    program_name: 'Master en Droit',
    program_level: 'Master',
    required_ects: 90,
    current_semester: 2,
    grade_min: 1.0,
    grade_max: 6.0,
    passing_grade: 4.0
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', SOLO_USER_ID)
          .single();
        if (data) setProfile(data);
      } catch (err) {
        console.log("Profil initial non trouvé, utilisation des valeurs par défaut.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: SOLO_USER_ID,
          ...profile,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      toast("Profil mis à jour avec succès", "success");
    } catch (err: any) {
      console.error("Erreur sauvegarde profil:", err);
      toast("Échec de la sauvegarde du profil", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-text-muted text-sm font-mono animate-pulse">Chargement du profil...</div>;
  }

  return (
    <div className="flex flex-col gap-8 pt-2 pb-16 animate-in fade-in duration-300">
      
      <header className="flex items-center gap-4 px-1 border-b border-border pb-6">
        <div className="w-14 h-14 bg-surface border-y border-r border-l-[3px] border-l-secondary border-y-border border-r-border rounded-r-xl flex items-center justify-center text-secondary shadow-sm">
          <UserRound size={28} />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Mon Profil</h1>
          <p className="text-text-muted text-sm">Paramètres académiques et préférences de l'application.</p>
        </div>
      </header>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        
        {/* IDENTITÉ */}
        <Card variant="default" className="flex flex-col gap-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-text-muted flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-accent" /> Informations institutionnelles
          </h2>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted">Nom / Prénom</label>
            <input 
              type="text" 
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted">Université / Faculté</label>
            <input 
              type="text" 
              value={profile.university_name}
              onChange={(e) => setProfile({ ...profile, university_name: e.target.value })}
              className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">Programme</label>
              <input 
                type="text" 
                value={profile.program_name}
                onChange={(e) => setProfile({ ...profile, program_name: e.target.value })}
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">Niveau</label>
              <select 
                value={profile.program_level}
                onChange={(e) => setProfile({ ...profile, program_level: e.target.value })}
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent appearance-none cursor-pointer transition-colors"
              >
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="Doctorat">Doctorat</option>
              </select>
            </div>
          </div>
        </Card>

        {/* CURSUS & BARÈME */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="default" className="flex flex-col gap-4">
            <h2 className="font-bold text-xs uppercase tracking-wider text-text-muted flex items-center gap-2 mb-2">
              <GraduationCap size={16} className="text-info" /> Cursus & ECTS
            </h2>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">ECTS totaux requis</label>
              <input 
                type="number" 
                value={profile.required_ects}
                onChange={(e) => setProfile({ ...profile, required_ects: Number(e.target.value) })}
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">Semestre actuel</label>
              <input 
                type="number" 
                value={profile.current_semester}
                onChange={(e) => setProfile({ ...profile, current_semester: Number(e.target.value) })}
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </Card>

          <Card variant="default" className="flex flex-col gap-4">
            <h2 className="font-bold text-xs uppercase tracking-wider text-text-muted flex items-center gap-2 mb-2">
              <BookOpen size={16} className="text-success" /> Barème Suisse
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-text-muted">Note min</label>
                <input 
                  type="number" step="0.1" value={profile.grade_min}
                  onChange={(e) => setProfile({ ...profile, grade_min: Number(e.target.value) })}
                  className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-text-muted">Note max</label>
                <input 
                  type="number" step="0.1" value={profile.grade_max}
                  onChange={(e) => setProfile({ ...profile, grade_max: Number(e.target.value) })}
                  className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">Seuil de réussite</label>
              <input 
                type="number" step="0.1" value={profile.passing_grade}
                onChange={(e) => setProfile({ ...profile, passing_grade: Number(e.target.value) })}
                className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent font-bold text-accent"
              />
            </div>
          </Card>
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="w-full bg-accent text-background rounded-xl py-4 px-4 flex items-center justify-center gap-2 font-bold hover:bg-accent-strong transition-colors disabled:opacity-50 glow-gold cursor-pointer"
        >
          <Save size={18} />
          <span>{saving ? 'Enregistrement de la base...' : 'Mettre à jour le profil académique'}</span>
        </button>
      </form>

      {/* PARAMÈTRES ERGONOMIQUES (Liés au AppContext) */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2">
          <Settings2 size={24} className="text-text-muted" /> Préférences UX
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-warning mb-1">
              <Moon size={18} /> <h3 className="font-bold text-sm">Mode Focus</h3>
            </div>
            <p className="text-[11px] text-text-muted mb-2">Réduit le contraste des couleurs et coupe les lueurs (glows) pour réduire la fatigue visuelle.</p>
            <button 
              onClick={() => updateSettings({ focusMode: !settings.focusMode })}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors w-full border ${settings.focusMode ? 'bg-warning/10 border-warning text-warning' : 'bg-surface-elevated border-border text-text-muted hover:text-text'}`}
            >
              {settings.focusMode ? 'Activé' : 'Désactivé'}
            </button>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-info mb-1">
              <Zap size={18} /> <h3 className="font-bold text-sm">Animations</h3>
            </div>
            <p className="text-[11px] text-text-muted mb-2">Ajuste la vitesse des transitions entre les pages (utile sur vieux appareils).</p>
            <select 
              value={settings.animationSpeed}
              onChange={(e) => updateSettings({ animationSpeed: e.target.value as any })}
              className="bg-surface-elevated border border-border rounded-lg py-2 px-3 text-xs w-full focus:outline-none focus:border-info appearance-none"
            >
              <option value="normal">Normales (Fluides)</option>
              <option value="fast">Rapides</option>
              <option value="none">Désactivées</option>
            </select>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-success mb-1">
              <LayoutList size={18} /> <h3 className="font-bold text-sm">Densité d'affichage</h3>
            </div>
            <p className="text-[11px] text-text-muted mb-2">Passez d'une interface aérée à une vue condensée (idéal pour les longues listes).</p>
            <div className="flex gap-2">
              <button 
                onClick={() => updateSettings({ listDensity: 'comfortable' })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${settings.listDensity === 'comfortable' ? 'bg-success/10 border-success text-success' : 'bg-surface-elevated border-border text-text-muted hover:text-text'}`}
              >Aéré</button>
              <button 
                onClick={() => updateSettings({ listDensity: 'compact' })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${settings.listDensity === 'compact' ? 'bg-success/10 border-success text-success' : 'bg-surface-elevated border-border text-text-muted hover:text-text'}`}
              >Compact</button>
            </div>
          </Card>

        </div>
      </section>

      {/* JOURNAL D'ACTIVITÉ */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2">
          <Activity size={24} className="text-text-muted" /> Journal d'Activité
        </h2>
        <Card variant="minimal" className="bg-surface p-4">
          {logs.length === 0 ? (
            <p className="text-xs text-text-muted italic text-center py-6">Aucune activité récente enregistrée.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    log.type === 'create' ? 'bg-success' : 
                    log.type === 'delete' ? 'bg-danger' : 
                    log.type === 'study' ? 'bg-info' : 'bg-accent'
                  }`} />
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm text-text font-medium">{log.action}</p>
                    <p className="text-[10px] text-text-muted font-mono">{new Date(log.timestamp).toLocaleString('fr-CH')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

    </div>
  );
}

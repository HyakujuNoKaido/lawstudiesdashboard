import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Save, GraduationCap, Building2, BookOpen } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';

const SOLO_USER_ID = '00000000-0000-0000-0000-000000000000';

export function Profile() {
  const navigate = useNavigate();
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

        if (data) {
          setProfile(data);
        }
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
      alert("Profil mis à jour avec succès !");
    } catch (err: any) {
      console.error("Erreur sauvegarde profil:", err);
      alert("Échec de la sauvegarde du profil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-text-muted text-sm">Chargement du profil...</div>;
  }

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 bg-surface-elevated border border-border rounded-xl flex items-center justify-center text-accent">
          <UserRound size={24} />
        </div>
        <div>
          <h1 className="font-serif text-3xl mb-0.5">Mon Profil</h1>
          <p className="text-text-muted text-sm">Paramètres académiques et échelle de notation.</p>
        </div>
      </header>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="font-medium text-sm text-text flex items-center gap-2">
            <Building2 size={16} className="text-accent" />
            <span>Informations institutionnelles</span>
          </h2>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted">Nom / Prénom</label>
            <input 
              type="text" 
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-text-muted">Université / Faculté</label>
            <input 
              type="text" 
              value={profile.university_name}
              onChange={(e) => setProfile({ ...profile, university_name: e.target.value })}
              className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">Programme</label>
              <input 
                type="text" 
                value={profile.program_name}
                onChange={(e) => setProfile({ ...profile, program_name: e.target.value })}
                className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">Niveau</label>
              <select 
                value={profile.program_level}
                onChange={(e) => setProfile({ ...profile, program_level: e.target.value })}
                className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-accent appearance-none"
              >
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="Doctorat">Doctorat</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <h2 className="font-medium text-sm text-text flex items-center gap-2">
            <GraduationCap size={16} className="text-accent" />
            <span>Cursus et ECTS requis</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">ECTS totaux requis</label>
              <input 
                type="number" 
                value={profile.required_ects}
                onChange={(e) => setProfile({ ...profile, required_ects: Number(e.target.value) })}
                className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">Semestre actuel</label>
              <input 
                type="number" 
                value={profile.current_semester}
                onChange={(e) => setProfile({ ...profile, current_semester: Number(e.target.value) })}
                className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <h2 className="font-medium text-sm text-text flex items-center gap-2">
            <BookOpen size={16} className="text-accent" />
            <span>Système de notation suisse</span>
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">Note min</label>
              <input 
                type="number" 
                step="0.1"
                value={profile.grade_min}
                onChange={(e) => setProfile({ ...profile, grade_min: Number(e.target.value) })}
                className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">Note max</label>
              <input 
                type="number" 
                step="0.1"
                value={profile.grade_max}
                onChange={(e) => setProfile({ ...profile, grade_max: Number(e.target.value) })}
                className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-muted">Seuil de réussite</label>
              <input 
                type="number" 
                step="0.1"
                value={profile.passing_grade}
                onChange={(e) => setProfile({ ...profile, passing_grade: Number(e.target.value) })}
                className="w-full bg-surface border border-border rounded-md py-2.5 px-3 text-sm"
              />
            </div>
          </div>
        </Card>

        <button 
          type="submit"
          disabled={saving}
          className="w-full bg-accent text-background rounded-md py-3.5 px-4 flex items-center justify-center gap-2 font-medium hover:bg-accent-strong transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          <span>{saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}</span>
        </button>

      </form>
    </div>
  );
}

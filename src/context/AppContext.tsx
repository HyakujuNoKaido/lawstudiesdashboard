import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCourses, fetchEvents, fetchFlashcards } from '../services/supabaseService';
import { useAuth } from './AuthContext';

export interface DashboardModule {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

interface AppSettings {
  defaultView: 'today' | 'dashboard';
  focusMode: boolean;
  animationSpeed: 'normal' | 'fast' | 'none';
  listDensity: 'comfortable' | 'compact';
  favorites: string[]; // Liste des IDs épinglés
  dashboardModules: DashboardModule[]; // Configuration de l'accueil
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'study';
}

interface AppContextType {
  courses: any[];
  events: any[];
  flashcards: any[];
  loading: boolean;
  isOffline: boolean;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleFavorite: (id: string) => void;
  logs: ActivityLog[];
  addLog: (action: string, type: ActivityLog['type']) => void;
  refreshData: () => Promise<void>;
}

const defaultModules: DashboardModule[] = [
  { id: 'today', title: "À faire aujourd'hui", visible: true, order: 1 },
  { id: 'favorites', title: "Éléments épinglés", visible: true, order: 2 },
  { id: 'weekly', title: "Votre semaine", visible: true, order: 3 },
  { id: 'recent', title: "Accès récents", visible: true, order: 4 },
  { id: 'activity', title: "Journal d'activité", visible: false, order: 5 }, // Masqué par défaut
];

const defaultSettings: AppSettings = {
  defaultView: 'today',
  focusMode: false,
  animationSpeed: 'normal',
  listDensity: 'comfortable',
  favorites: [],
  dashboardModules: defaultModules,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('lexi-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration douce si les modules n'existent pas encore dans l'ancien cache
      if (!parsed.dashboardModules) parsed.dashboardModules = defaultModules;
      if (!parsed.favorites) parsed.favorites = [];
      return parsed;
    }
    return defaultSettings;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('lexi-logs');
    return saved ? JSON.parse(saved) : [];
  });

  const refreshData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [coursesData, eventsData, cardsData] = await Promise.all([
        fetchCourses(), fetchEvents(), fetchFlashcards()
      ]);
      setCourses(coursesData); setEvents(eventsData); setFlashcards(cardsData);
    } catch (err) {
      console.error("Erreur de pré-chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) refreshData();
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [user, authLoading]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('lexi-settings', JSON.stringify(updated));
  };

  const toggleFavorite = (id: string) => {
    const isFav = settings.favorites.includes(id);
    const newFavorites = isFav ? settings.favorites.filter(fav => fav !== id) : [...settings.favorites, id];
    updateSettings({ favorites: newFavorites });
  };

  const addLog = (action: string, type: ActivityLog['type']) => {
    const newLog: ActivityLog = { id: Date.now().toString(), action, timestamp: new Date().toISOString(), type };
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    setLogs(updatedLogs);
    localStorage.setItem('lexi-logs', JSON.stringify(updatedLogs));
  };

  return (
    <AppContext.Provider value={{ courses, events, flashcards, loading, isOffline, settings, updateSettings, toggleFavorite, logs, addLog, refreshData }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

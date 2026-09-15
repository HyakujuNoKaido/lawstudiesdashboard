import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCourses, fetchEvents, fetchFlashcards } from '../services/supabaseService';

interface AppSettings {
  defaultView: 'today' | 'dashboard';
  focusMode: boolean; // Moins de couleurs/glows
  animationSpeed: 'normal' | 'fast' | 'none';
  listDensity: 'comfortable' | 'compact';
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
  logs: ActivityLog[];
  addLog: (action: string, type: ActivityLog['type']) => void;
  refreshData: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  defaultView: 'today',
  focusMode: false,
  animationSpeed: 'normal',
  listDensity: 'comfortable',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Settings (persistés dans localStorage pour la rapidité)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('lexi-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  // Logs d'activité (persistés dans localStorage)
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('lexi-logs');
    return saved ? JSON.parse(saved) : [];
  });

  const refreshData = async () => {
    try {
      const [coursesData, eventsData, cardsData] = await Promise.all([
        fetchCourses(),
        fetchEvents(),
        fetchFlashcards()
      ]);
      setCourses(coursesData);
      setEvents(eventsData);
      setFlashcards(cardsData);
    } catch (err) {
      console.error("Erreur de pré-chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    // Gestion du statut Offline/Online
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('lexi-settings', JSON.stringify(updated));
  };

  const addLog = (action: string, type: ActivityLog['type']) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      action,
      timestamp: new Date().toISOString(),
      type
    };
    const updatedLogs = [newLog, ...logs].slice(0, 50); // Garder les 50 derniers
    setLogs(updatedLogs);
    localStorage.setItem('lexi-logs', JSON.stringify(updatedLogs));
  };

  return (
    <AppContext.Provider value={{ 
      courses, events, flashcards, loading, isOffline, 
      settings, updateSettings, logs, addLog, refreshData 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

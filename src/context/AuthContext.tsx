import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { SOLO_USER_ID } from '../lib/constants';

interface AuthContextType {
  session: Session | null;
  user: User | { id: string; email: string } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. On stocke l'activation du mode solo dans ton navigateur/téléphone
    localStorage.setItem('lexi_solo_mode', 'true');
    
    // 2. On injecte instantanément ton identifiant personnel (Bypass total de l'authentification)
    setUser({ id: SOLO_USER_ID, email: 'Aniss (Mode Solo)' });
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import { createClient } from '@supabase/supabase-js';

// Fallback vide pour éviter les crashs dans l'éditeur web avant la configuration de Cloudflare
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseKey);

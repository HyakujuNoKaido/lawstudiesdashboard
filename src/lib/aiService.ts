import { supabase } from './supabase';

export async function generateCaseLaw(atfCitation: string) {
  console.log(`[AI Service] Appel Supabase Edge Function pour: ${atfCitation}`);
  
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { 
      action: 'generate_case_law',
      payload: { citation: atfCitation }
    }
  });

  if (error) {
    console.error("Erreur de l'Edge Function:", error);
    throw new Error("L'IA n'a pas pu générer la fiche d'arrêt.");
  }

  return data;
}

export async function generateSubsumption(factsAndLegalIssue: string) {
  console.log(`[AI Service] Appel Supabase Edge Function pour subsumption.`);
  
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { 
      action: 'generate_subsumption',
      payload: { facts: factsAndLegalIssue }
    }
  });

  if (error) {
    console.error("Erreur de l'Edge Function:", error);
    throw new Error("L'IA n'a pas pu générer la subsumption.");
  }

  return data;
}

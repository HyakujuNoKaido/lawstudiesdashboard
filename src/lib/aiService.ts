import { supabase } from './supabase';

export async function generateCaseLaw(atfCitation: string) {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { action: 'generate_case_law', payload: { citation: atfCitation } }
  });
  if (error) throw new Error("L'IA n'a pas pu générer la fiche d'arrêt.");
  return data;
}

export async function generateSubsumption(factsAndLegalIssue: string) {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { action: 'generate_subsumption', payload: { facts: factsAndLegalIssue } }
  });
  if (error) throw new Error("L'IA n'a pas pu générer la subsumption.");
  return data;
}

export async function generateMockExam(topic: string) {
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { action: 'generate_mock_exam', payload: { topic } }
  });
  if (error) throw new Error("L'IA n'a pas pu générer l'examen blanc.");
  return data;
}

import { supabase } from '../lib/supabase';

const SOLO_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function fetchCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data || [];
}

export async function fetchFlashcards() {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*, courses(title)')
    .order('due_at', { ascending: true });
  
  if (error) return [];
  return data || [];
}

export async function createFlashcard(card: { course_id: string; front: string; back: string }) {
  const { data, error } = await supabase
    .from('flashcards')
    .insert([{ user_id: SOLO_USER_ID, ...card }])
    .select();
  if (error) throw error;
  return data;
}

export async function updateFlashcardProgress(id: string, repetitions: number, intervalDays: number, easeFactor: number) {
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + intervalDays);

  const { error } = await supabase
    .from('flashcards')
    .update({
      repetitions,
      interval_days: intervalDays,
      ease_factor: easeFactor,
      due_at: nextDue.toISOString(),
      last_reviewed_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function fetchNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*, courses(title)')
    .order('updated_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function saveNote(note: { id?: string; course_id: string; title: string; content: string }) {
  if (note.id) {
    const { data, error } = await supabase
      .from('notes')
      .update({ title: note.title, content: note.content, updated_at: new Date().toISOString() })
      .eq('id', note.id)
      .select();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('notes')
      .insert([{ user_id: SOLO_USER_ID, course_id: note.course_id, title: note.title, content: note.content }])
      .select();
    if (error) throw error;
    return data;
  }
}

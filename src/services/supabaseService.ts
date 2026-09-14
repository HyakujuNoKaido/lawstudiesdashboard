import { supabase } from '../lib/supabase';

const SOLO_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function fetchCourses(semester?: string) {
  let query = supabase.from('courses').select('*');
  if (semester && semester !== 'Tous') {
    query = query.eq('semester', semester);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchCourseById(courseId: string) {
  const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
  if (error) throw error;
  return data;
}

export async function fetchCourseChapters(courseId: string) {
  const { data, error } = await supabase.from('chapters').select('*').eq('course_id', courseId).order('order_index', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function createChapter(chapter: { course_id: string; title: string; order_index?: number }) {
  const { data, error } = await supabase.from('chapters').insert([{ user_id: SOLO_USER_ID, ...chapter }]).select();
  if (error) throw error;
  return data;
}

export async function fetchCourseDocuments(courseId: string) {
  const { data, error } = await supabase.from('documents').select('*, chapters(title)').eq('course_id', courseId).order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchEvents() {
  const { data, error } = await supabase.from('events').select('*, courses(title)').order('event_date', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function createEvent(eventData: { title: string; event_date: string; category: string; course_id?: string }) {
  const { data, error } = await supabase.from('events').insert([{ user_id: SOLO_USER_ID, ...eventData }]).select();
  if (error) throw error;
  return data;
}

export async function saveExamSimulation(simData: { course_id: string; title: string; facts: string; legal_issue: string; major_premise: string; minor_premise: string; conclusion: string; time_spent_seconds: number }) {
  const { data, error } = await supabase.from('exam_simulations').insert([{ user_id: SOLO_USER_ID, ...simData }]).select();
  if (error) throw error;
  return data;
}

export async function fetchExamSimulations() {
  const { data, error } = await supabase.from('exam_simulations').select('*, courses(title)').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

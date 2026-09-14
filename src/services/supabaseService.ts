import { supabase } from '../lib/supabase';

const SOLO_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function fetchCourses() {
  const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchCourseById(courseId: string) {
  const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
  if (error) throw error;
  return data;
}

export async function fetchCourseChapters(courseId: string) {
  const { data, error } = await supabase.from('chapters').select('*').eq('id', courseId).order('order_index', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function createChapter(chapter: { course_id: string; title: string; order_index?: number }) {
  const { data, error } = await supabase.from('chapters').insert([{ user_id: SOLO_USER_ID, ...chapter }]).select();
  if (error) throw error;
  return data;
}

export async function parseAndCreateChaptersFromSyllabus(courseId: string, syllabusText: string) {
  const lines = syllabusText.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  let index = 1;
  const created = [];
  for (const line of lines) {
    if (/^(chapitre|semaine|module|partie|\d+[\.\-\)]|[ivx]+\.)/i.test(line)) {
      try {
        const res = await createChapter({ course_id: courseId, title: line, order_index: index++ });
        if (res) created.push(res[0]);
      } catch (err) {
        console.error("Erreur insertion chapitre:", err);
      }
    }
  }
  return created;
}

export async function fetchCourseDocuments(courseId: string) {
  const { data, error } = await supabase.from('documents').select('*, chapters(title)').eq('course_id', courseId).order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function uploadCourseDocument(file: File, courseId: string, documentType: string, chapterId?: string, atfRef?: string, legalArticle?: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${SOLO_USER_ID}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('user-documents').upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data, error: dbError } = await supabase
    .from('documents')
    .insert([{
      user_id: SOLO_USER_ID,
      course_id: courseId || null,
      chapter_id: chapterId || null,
      bucket_path: filePath,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      document_type: documentType,
      atf_ref: atfRef || null
    }])
    .select();

  if (dbError) throw dbError;
  return data;
}

// Gestion des Fiches d'Arrêt (ATF)
export async function fetchCaseLaws(courseId?: string) {
  let query = supabase.from('case_laws').select('*, courses(title), chapters(title)');
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function saveCaseLaw(caseLaw: { id?: string; course_id: string; chapter_id?: string; title: string; atf_citation: string; facts: string; procedure: string; consideranda: string; holding: string }) {
  if (caseLaw.id) {
    const { data, error } = await supabase.from('case_laws').update(caseLaw).eq('id', caseLaw.id).select();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase.from('case_laws').insert([{ user_id: SOLO_USER_ID, ...caseLaw }]).select();
    if (error) throw error;
    return data;
  }
}

// Gestion des Cas Pratiques (Subsumption)
export async function fetchCaseStudies(courseId?: string) {
  let query = supabase.from('case_studies').select('*, courses(title), chapters(title)');
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function saveCaseStudy(study: { id?: string; course_id: string; chapter_id?: string; title: string; legal_issue: string; major_premise: string; minor_premise: string; conclusion: string }) {
  if (study.id) {
    const { data, error } = await supabase.from('case_studies').update(study).eq('id', study.id).select();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase.from('case_studies').insert([{ user_id: SOLO_USER_ID, ...study }]).select();
    if (error) throw error;
    return data;
  }
}

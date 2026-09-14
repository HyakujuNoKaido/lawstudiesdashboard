import { supabase } from '../lib/supabase';

const SOLO_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function fetchCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Erreur fetchCourses:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchCourseById(courseId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchCourseDocuments(courseId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data || [];
}

export async function fetchCourseGrades(courseId: string) {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data || [];
}

export async function createCourse(course: {
  title: string;
  course_code?: string;
  ects: number;
  status: string;
  teacher_name?: string;
}) {
  const { data, error } = await supabase
    .from('courses')
    .insert([
      {
        user_id: SOLO_USER_ID,
        title: course.title,
        course_code: course.course_code || null,
        ects: Number(course.ects),
        status: course.status,
        teacher_name: course.teacher_name || null
      }
    ])
    .select();

  if (error) throw error;
  return data;
}

export async function createGrade(gradeData: {
  course_id: string;
  grade: number;
  weight: number;
  eval_type: string;
}) {
  const { data, error } = await supabase
    .from('grades')
    .insert([
      {
        user_id: SOLO_USER_ID,
        course_id: gradeData.course_id,
        grade: Number(gradeData.grade),
        weight: Number(gradeData.weight),
        eval_type: gradeData.eval_type
      }
    ])
    .select();

  if (error) throw error;
  return data;
}

export async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*, courses(title)')
    .order('event_date', { ascending: true });

  if (error) return [];
  return data || [];
}

export async function createEvent(eventData: {
  title: string;
  event_date: string;
  category: string;
  course_id?: string;
}) {
  const { data, error } = await supabase
    .from('events')
    .insert([
      {
        user_id: SOLO_USER_ID,
        title: eventData.title,
        event_date: eventData.event_date,
        category: eventData.category,
        course_id: eventData.course_id || null
      }
    ])
    .select();

  if (error) throw error;
  return data;
}

export async function uploadCourseDocument(file: File, courseId: string, documentType: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${SOLO_USER_ID}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('user-documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data, error: dbError } = await supabase
    .from('documents')
    .insert([
      {
        user_id: SOLO_USER_ID,
        course_id: courseId ? courseId : null,
        bucket_path: filePath,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        document_type: documentType,
        processing_status: 'completed'
      }
    ])
    .select();

  if (dbError) throw dbError;
  return data;
}

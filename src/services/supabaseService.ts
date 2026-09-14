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

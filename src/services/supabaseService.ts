import { supabase } from '../lib/supabase';

// Récupération de l'utilisateur ou ID par défaut pour usage personnel solo
async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return session.user.id;
  }
  // Mode solo : si aucun auth strict n'est requis immédiatement, 
  // on utilise un identifiant par défaut ou on force une session anonyme/locale
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;
  
  // Fallback pour usage personnel direct si la table profiles a une contrainte
  throw new Error("Veuillez vous connecter ou configurer un utilisateur dans Supabase.");
}

export async function fetchCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createCourse(course: {
  title: string;
  course_code?: string;
  ects: number;
  status: string;
  teacher_name?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié.");

  const { data, error } = await supabase
    .from('courses')
    .insert([
      {
        user_id: user.id,
        title: course.title,
        course_code: course.code || null,
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié.");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36.2)}_${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  // 1. Upload vers le bucket privé Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('user-documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // 2. Enregistrement des métadonnées dans la table documents
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert([
      {
        user_id: user.id,
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

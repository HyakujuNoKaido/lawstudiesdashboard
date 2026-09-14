import { supabase } from '../lib/supabase';
import { SOLO_USER_ID } from '../lib/constants';

export async function fetchCourses(semester?: string) {
  let query = supabase.from('courses').select('*');
  if (semester && semester !== 'Tous') {
    query = query.eq('semester', semester);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  
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

export async function deleteCourse(courseId: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);
  if (error) throw error;
}

export async function createCourseWithSchedule(
  courseData: { title: string; course_code?: string; ects: number; status: string; teacher_name?: string; semester?: string },
  schedules: Array<{ day_of_week: string; start_time: string; end_time: string }>
) {
  const { data: courseRes, error: courseErr } = await supabase
    .from('courses')
    .insert([{
      user_id: SOLO_USER_ID,
      title: courseData.title,
      course_code: courseData.course_code || 'DROIT',
      ects: Number(courseData.ects) || 6,
      status: courseData.status || 'En cours',
      teacher_name: courseData.teacher_name || null,
      semester: courseData.semester || 'Automne 2026'
    }])
    .select();

  if (courseErr) throw courseErr;
  const courseId = courseRes[0].id;

  if (schedules.length > 0) {
    const formattedSchedules = schedules.map(s => ({
      course_id: courseId,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time
    }));

    await supabase.from('course_schedules').insert(formattedSchedules);

    const dayMap: Record<string, number> = { 'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4, 'Vendredi': 5, 'Samedi': 6, 'Dimanche': 0 };
    const generatedEvents = [];
    const startDate = new Date();

    for (let week = 0; week < 14; week++) {
      for (const sched of schedules) {
        const targetDayNum = dayMap[sched.day_of_week];
        const eventDate = new Date(startDate);
        const currentDayNum = eventDate.getDay();
        const distance = (targetDayNum + 7 - currentDayNum) % 7;
        eventDate.setDate(eventDate.getDate() + distance + (week * 7));

        const dateStr = eventDate.toISOString().split('T')[0];
        generatedEvents.push({
          user_id: SOLO_USER_ID,
          course_id: courseId,
          title: `Cours: ${courseData.title}`,
          event_date: `${dateStr}T${sched.start_time}:00`,
          category: 'Cours'
        });
      }
    }

    if (generatedEvents.length > 0) {
      await supabase.from('events').insert(generatedEvents);
    }
  }

  return courseRes[0];
}

export async function fetchCourseChapters(courseId: string) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  
  if (error) return [];
  return data || [];
}

export async function createChapter(chapter: { course_id: string; title: string; order_index?: number; description?: string }) {
  const { data, error } = await supabase
    .from('chapters')
    .insert([{ user_id: SOLO_USER_ID, ...chapter }])
    .select();
  if (error) throw error;
  return data;
}

export async function parseAndCreateChaptersFromSyllabus(courseId: string, syllabusText: string) {
  const lines = syllabusText.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  let index = 1;
  const createdChapters = [];

  for (const line of lines) {
    if (/^(chapitre|semaine|module|partie|\d+[\.\-\)]|[ivx]+\.)/i.test(line)) {
      try {
        const res = await createChapter({
          course_id: courseId,
          title: line,
          order_index: index++
        });
        if (res) createdChapters.push(res[0]);
      } catch (err) {
        console.error("Erreur insertion chapitre auto:", err);
      }
    }
  }
  return createdChapters;
}

export async function createMultipleCourses(coursesList: Array<{ title: string; course_code?: string; ects: number; status?: string; semester?: string }>) {
  const formatted = coursesList.map(c => ({
    user_id: SOLO_USER_ID,
    title: c.title,
    course_code: c.course_code || 'DROIT',
    ects: Number(c.ects) || 6,
    status: 'En cours',
    semester: c.semester || 'Automne 2026'
  }));

  const { data, error } = await supabase
    .from('courses')
    .insert(formatted)
    .select();

  if (error) throw error;
  return data;
}

export async function fetchCourseDocuments(courseId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*, chapters(title)')
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

export async function fetchFlashcards(courseId?: string) {
  let query = supabase.from('flashcards').select('*, courses(title), chapters(title)');
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query.order('due_at', { ascending: true });
  
  if (error) return [];
  return data || [];
}

export async function createFlashcard(card: { course_id: string; chapter_id?: string; front: string; back: string }) {
  const { data, error } = await supabase
    .from('flashcards')
    .insert([{ user_id: SOLO_USER_ID, ...card }])
    .select();
  if (error) throw error;
  return data;
}

export async function updateFlashcard(id: string, card: { front: string; back: string; course_id: string }) {
  const { data, error } = await supabase
    .from('flashcards')
    .update({ front: card.front, back: card.back, course_id: card.course_id })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteFlashcard(id: string) {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', id);
  if (error) throw error;
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

export async function createCourse(course: {
  title: string;
  course_code?: string;
  ects: number;
  status: string;
  teacher_name?: string;
  semester?: string;
}) {
  const { data, error } = await supabase
    .from('courses')
    .insert([
      {
        user_id: SOLO_USER_ID,
        title: course.title,
        course_code: course.course_code || null,
        ects: Number(course.ects),
        status: course.status || 'En cours',
        teacher_name: course.teacher_name || null,
        semester: course.semester || 'Automne 2026'
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

export async function uploadCourseDocument(file: File, courseId: string, documentType: string, chapterId?: string, atfRef?: string) {
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
        chapter_id: chapterId || null,
        bucket_path: filePath,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        document_type: documentType,
        atf_ref: atfRef || null,
        processing_status: 'completed'
      }
    ])
    .select();

  if (dbError) throw dbError;
  return data;
}

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

export async function saveCaseStudy(study: { course_id: string; title: string; legal_issue: string; major_premise: string; minor_premise: string; conclusion: string }) {
  const { data, error } = await supabase.from('case_studies').insert([{ user_id: SOLO_USER_ID, ...study }]).select();
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

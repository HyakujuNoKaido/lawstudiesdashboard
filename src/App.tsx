import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { DocumentLibrary } from './pages/DocumentLibrary'; // <-- La future vraie bibliothèque
import { Study } from './pages/Study';
import { StudySession } from './pages/StudySession';
import { NoteEditor } from './pages/NoteEditor';
import { Profile } from './pages/Profile'; // <-- Notre nouveau centre d'identité
import { AddCourse } from './pages/AddCourse';
import { EditCourse } from './pages/EditCourse';
import { Schedule } from './pages/Schedule';
import { DocumentUpload } from './pages/DocumentUpload';
import { DocumentViewer } from './pages/DocumentViewer';
import { Onboarding } from './pages/Onboarding';
import { AddGrade } from './pages/AddGrade';
import { CaseLawEditor } from './pages/CaseLawEditor';
import { CaseStudyEditor } from './pages/CaseStudyEditor';
import { ExamSimulator } from './pages/ExamSimulator';
import { CreateFlashcardsBatch } from './pages/CreateFlashcardsBatch';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:courseId" element={<CourseDetail />} />
            <Route path="add/course" element={<AddCourse />} />
            <Route path="edit/course/:courseId" element={<EditCourse />} />
            <Route path="add/grade" element={<AddGrade />} />
            <Route path="add/document" element={<DocumentUpload />} />
            
            <Route path="documents" element={<DocumentLibrary />} /> {/* Nouvelle Bibliothèque */}
            
            <Route path="study" element={<Study />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="profile" element={<Profile />} /> {/* Profil & Diplôme */}
            
            <Route path="add/flashcards/batch" element={<CreateFlashcardsBatch />} />
            <Route path="cases/law" element={<CaseLawEditor />} />
            <Route path="cases/study" element={<CaseStudyEditor />} />
            <Route path="exams" element={<ExamSimulator />} />
          </Route>
          
          {/* ROUTES PLEIN ÉCRAN */}
          <Route path="/session/:deckId" element={<StudySession />} />
          <Route path="/notes" element={<NoteEditor />} />
          <Route path="/notes/:noteId" element={<NoteEditor />} />
          <Route path="/viewer/:docId" element={<DocumentViewer />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

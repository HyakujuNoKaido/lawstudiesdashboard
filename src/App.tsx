import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { DocumentImport } from './pages/DocumentImport';
import { Study } from './pages/Study';
import { StudySession } from './pages/StudySession';
import { StudyNoteEditor } from './pages/StudyNoteEditor';
import { Profile } from './pages/Profile';
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
import { CreateFlashcardsBatch } from './pages/CreateFlashcardsBatch'; // <-- NOUVEL IMPORT

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route hors Layout pour l'Onboarding */}
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Routes du Layout principal */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseId" element={<CourseDetail />} />
          <Route path="add/course" element={<AddCourse />} />
          <Route path="edit/course/:courseId" element={<EditCourse />} />
          <Route path="add/grade" element={<AddGrade />} />
          <Route path="add/document" element={<DocumentUpload />} />
          <Route path="import" element={<DocumentImport />} />
          <Route path="study" element={<Study />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="profile" element={<Profile />} />
          
          {/* NOUVEAU: Création de flashcards en lot */}
          <Route path="add/flashcards/batch" element={<CreateFlashcardsBatch />} />
          
          {/* Outils juridiques */}
          <Route path="cases/law" element={<CaseLawEditor />} />
          <Route path="cases/study" element={<CaseStudyEditor />} />
          <Route path="exams/simulator" element={<ExamSimulator />} />
        </Route>
        
        {/* Routes Plein Écran */}
        <Route path="/session/:deckId" element={<StudySession />} />
        <Route path="/editor/:noteId" element={<StudyNoteEditor />} />
        <Route path="/viewer/:docId" element={<DocumentViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { DocumentImport } from './pages/DocumentImport';
import { Study } from './pages/Study';
import { StudySession } from './pages/StudySession';
import { StudyNoteEditor } from './pages/StudyNoteEditor'; // Si tu l'as renommé NoteEditor, change ici
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
import { CreateFlashcardsBatch } from './pages/CreateFlashcardsBatch';
import { Library } from './pages/Library';

// Pour préparer la suite, on importe la future vue DocumentLibrary. 
// (Crée un fichier vide exportant un composant basique dans /pages/DocumentLibrary.tsx pour que ça ne plante pas)
import { DocumentLibrary } from './pages/DocumentLibrary';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* ROUTES CLASSIQUES (Dans le layout principal avec barre de nav) */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:courseId" element={<CourseDetail />} />
            <Route path="add/course" element={<AddCourse />} />
            <Route path="edit/course/:courseId" element={<EditCourse />} />
            <Route path="add/grade" element={<AddGrade />} />
            <Route path="add/document" element={<DocumentUpload />} />
            <Route path="import" element={<DocumentImport />} />
            
            {/* L'ancienne Library (Diplôme) et la nouvelle Bibliothèque (Documents) */}
            <Route path="library" element={<Library />} /> 
            <Route path="documents" element={<DocumentLibrary />} /> 
            
            <Route path="study" element={<Study />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="profile" element={<Profile />} />
            
            <Route path="add/flashcards/batch" element={<CreateFlashcardsBatch />} />
            
            <Route path="cases/law" element={<CaseLawEditor />} />
            <Route path="cases/study" element={<CaseStudyEditor />} />
            <Route path="exams/simulator" element={<ExamSimulator />} />
          </Route>
          
          {/* ROUTES PLEIN ÉCRAN (Hors du AppLayout pour prendre 100% de l'espace) */}
          <Route path="/session/:deckId" element={<StudySession />} />
          <Route path="/editor/:noteId" element={<StudyNoteEditor />} />
          <Route path="/viewer/:docId" element={<DocumentViewer />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

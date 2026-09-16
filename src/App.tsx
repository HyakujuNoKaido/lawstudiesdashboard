import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
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
import { CreateFlashcardsBatch } from './pages/CreateFlashcardsBatch';
import { Library } from './pages/Library';
import { DocumentLibrary } from './pages/DocumentLibrary';

// --- COMPOSANT DE PROTECTION DE ROUTE ---
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-text-muted font-mono animate-pulse">Authentification sécurisée...</div>;
  }
  
  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            
            {/* ROUTES SÉCURISÉES DANS LE LAYOUT */}
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:courseId" element={<CourseDetail />} />
              <Route path="add/course" element={<AddCourse />} />
              <Route path="edit/course/:courseId" element={<EditCourse />} />
              <Route path="add/grade" element={<AddGrade />} />
              <Route path="add/document" element={<DocumentUpload />} />
              <Route path="import" element={<DocumentImport />} />
              
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
            
            {/* ROUTES SÉCURISÉES HORS LAYOUT (Plein écran) */}
            <Route path="/session/:deckId" element={<ProtectedRoute><StudySession /></ProtectedRoute>} />
            <Route path="/editor/:noteId" element={<ProtectedRoute><StudyNoteEditor /></ProtectedRoute>} />
            <Route path="/viewer/:docId" element={<ProtectedRoute><DocumentViewer /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

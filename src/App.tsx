import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { DocumentImport } from './pages/DocumentImport';
import { StudySession } from './pages/StudySession';
import { StudyNoteEditor } from './pages/StudyNoteEditor';
import { Profile } from './pages/Profile';
import { AddCourse } from './pages/AddCourse';
import { Schedule } from './pages/Schedule';
import { BrainCircuit } from 'lucide-react';

const Study = () => (
  <div className="mt-4 flex flex-col gap-6 animate-in fade-in duration-300">
    <header>
      <h1 className="font-serif text-3xl mb-1">Révisions</h1>
      <p className="text-text-muted text-sm font-medium">42 cartes dues aujourd'hui</p>
    </header>
    <div className="bg-surface border border-border rounded-md p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-surface-elevated rounded flex items-center justify-center">
          <BrainCircuit className="text-accent" size={20} />
        </div>
        <div>
          <h3 className="font-medium">Droit des obligations (CO)</h3>
          <p className="text-xs text-text-muted">12 cartes à revoir</p>
        </div>
      </div>
      <Link 
        to="/session/do-co" 
        className="px-4 py-2 bg-accent text-background text-sm font-medium rounded hover:bg-accent-strong transition-colors"
      >
        Démarrer
      </Link>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseId" element={<CourseDetail />} />
          <Route path="add/course" element={<AddCourse />} />
          <Route path="import" element={<DocumentImport />} />
          <Route path="study" element={<Study />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        <Route path="/session/:deckId" element={<StudySession />} />
        <Route path="/editor/:noteId" element={<StudyNoteEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

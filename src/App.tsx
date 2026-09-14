import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

// Vues temporaires en attendant leur implémentation complète
const Dashboard = () => (
  <div className="mt-4">
    <h1 className="font-serif text-2xl mb-2">Tableau de bord</h1>
    <p className="text-text-muted text-sm">Bonjour. Voici ta journée.</p>
  </div>
);
const Courses = () => <div className="mt-4"><h1 className="font-serif text-2xl">Cours</h1></div>;
const Study = () => <div className="mt-4"><h1 className="font-serif text-2xl">Réviser</h1></div>;
const Schedule = () => <div className="mt-4"><h1 className="font-serif text-2xl">Planning</h1></div>;
const Profile = () => <div className="mt-4"><h1 className="font-serif text-2xl">Profil</h1></div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="study" element={<Study />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

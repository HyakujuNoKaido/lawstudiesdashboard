import React from 'react';
import { BookOpen } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-surface-elevated rounded-md flex items-center justify-center mb-6 border border-border">
        <BookOpen className="text-accent" size={32} />
      </div>
      <h1 className="font-serif text-3xl mb-3">Lexi Suisse</h1>
      <p className="text-text-muted max-w-sm">
        Le carnet académique premium pour les étudiant·e·s en droit.
      </p>
    </div>
  );
}

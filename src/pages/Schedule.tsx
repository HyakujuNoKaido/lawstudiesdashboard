import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';

const MOCK_AGENDA = [
  {
    date: "Aujourd'hui, 14 Sept.",
    items: [
      { id: 1, type: 'course', time: '08:15 - 10:00', title: 'Droit pénal général', location: 'Uni Mail - MR380' },
      { id: 2, type: 'task', time: '14:15', title: 'Rendre le cas pratique RC', location: 'Moodle' },
    ]
  },
  {
    date: "Demain, 15 Sept.",
    items: [
      { id: 3, type: 'seminar', time: '10:15 - 12:00', title: 'Séminaire: Obligations', location: 'Uni Mail - M4020' },
      { id: 4, type: 'study', time: '15:00 - 17:00', title: 'Bloc de révision : Pénal', location: 'Bibliothèque' },
    ]
  }
];

export function Schedule() {
  const [currentWeek, setCurrentWeek] = useState("14 - 20 Septembre 2026");

  return (
    <div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">
      
      <header className="flex items-center justify-between">
        <h1 className="font-serif text-3xl mb-1">Planning</h1>
      </header>

      {/* Sélecteur de semaine */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-md p-2">
        <button className="p-2 text-text-muted hover:text-text transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium">{currentWeek}</span>
        <button className="p-2 text-text-muted hover:text-text transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Liste de l'agenda */}
      <div className="flex flex-col gap-8">
        {MOCK_AGENDA.map((day, index) => (
          <div key={index} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">{day.date}</h2>
            
            <div className="flex flex-col gap-3">
              {day.items.map((item) => (
                <Card key={item.id} className="p-4 flex gap-4">
                  {/* Colonne heure (fixe) */}
                  <div className="w-20 shrink-0 border-r border-border/50 flex flex-col justify-center">
                    <span className="text-sm font-medium text-text">{item.time.split(' - ')[0]}</span>
                    {item.time.includes('-') && (
                      <span className="text-xs text-text-muted">{item.time.split(' - ')[1]}</span>
                    )}
                  </div>

                  {/* Colonne détails */}
                  <div className="flex-1 flex flex-col justify-center gap-1.5">
                    <div className="flex items-center gap-2">
                      {item.type === 'course' && <span className="w-2 h-2 rounded-full bg-accent" />}
                      {item.type === 'task' && <span className="w-2 h-2 rounded-full bg-danger" />}
                      {item.type === 'seminar' && <span className="w-2 h-2 rounded-full bg-info" />}
                      {item.type === 'study' && <span className="w-2 h-2 rounded-full bg-success" />}
                      <h3 className="font-medium text-sm leading-tight">{item.title}</h3>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{item.location}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

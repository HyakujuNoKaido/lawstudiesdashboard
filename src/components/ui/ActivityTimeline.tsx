import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit3, Trash2, BrainCircuit, Activity } from 'lucide-react';

export function ActivityTimeline() {
  const { logs } = useApp();

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-6 text-text-muted text-xs border border-dashed border-border rounded-card bg-surface/30">
        Aucune activité récente enregistrée.
      </div>
    );
  }

  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'create': return { icon: Plus, color: 'text-info', bg: 'bg-info/10' };
      case 'update': return { icon: Edit3, color: 'text-accent', bg: 'bg-accent/10' };
      case 'delete': return { icon: Trash2, color: 'text-danger', bg: 'bg-danger/10' };
      case 'study': return { icon: BrainCircuit, color: 'text-warning', bg: 'bg-warning/10' };
      default: return { icon: Activity, color: 'text-text-muted', bg: 'bg-surface-elevated' };
    }
  };

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border z-0"></div>
      
      {logs.slice(0, 10).map((log) => {
        const { icon: Icon, color, bg } = getIconAndColor(log.type);
        const timeStr = new Date(log.timestamp).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(log.timestamp).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' });
        
        return (
          <div key={log.id} className="flex items-start gap-4 relative z-10 group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-background ${bg} ${color}`}>
              <Icon size={14} />
            </div>
            <div className="flex flex-col pt-1 min-w-0">
              <span className="text-sm font-medium text-text">{log.action}</span>
              <span className="text-[10px] text-text-muted font-mono mt-0.5">
                {dateStr} à {timeStr}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

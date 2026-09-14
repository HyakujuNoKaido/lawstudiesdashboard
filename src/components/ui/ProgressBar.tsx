import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  colorClass?: string;
}

export function ProgressBar({ value, max, colorClass = 'bg-accent' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full ${colorClass} transition-all duration-500 ease-out`} 
        style={{ width: `${percentage}%` }} 
      />
    </div>
  );
}

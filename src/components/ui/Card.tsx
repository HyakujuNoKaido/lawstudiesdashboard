import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:border-text-muted/50 active:scale-[0.98] transition-all duration-200' 
    : '';

  return (
    <div 
      onClick={onClick}
      className={`bg-surface border border-border rounded-md p-4 md:p-5 shadow-sm ${interactiveClasses} ${className}`}
    >
      {children}
    </div>
  );
}

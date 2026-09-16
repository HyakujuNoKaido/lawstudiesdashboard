import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'editorial' | 'minimal';
  onClick?: () => void;
}

export function Card({ children, className = '', variant = 'default', onClick }: CardProps) {
  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:bg-surface-interactive active:scale-[0.98] transition-all duration-200 card-interactive' 
    : '';

  let variantClasses = '';
  switch (variant) {
    case 'editorial':
      // Style "Code annoté" : Marge gauche bordeaux, aspect plus plat et papier
      variantClasses = 'bg-surface border-l-[3px] border-l-secondary rounded-card shadow-apple-subtle';
      break;
    case 'minimal':
      // Juste un séparateur en bas, pas de boîte
      variantClasses = 'bg-transparent border-b border-border rounded-none pb-4';
      break;
    case 'default':
    default:
      // Carte standard : on mise sur le contraste du fond, très peu de bordure
      variantClasses = 'bg-surface rounded-card shadow-none border border-border/40';
      break;
  }

  return (
    <div 
      onClick={onClick}
      className={`p-5 ${variantClasses} ${interactiveClasses} ${className}`}
    >
      {children}
    </div>
  );
}

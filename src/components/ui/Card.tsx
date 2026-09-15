import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'editorial' | 'minimal';
  onClick?: () => void;
}

export function Card({ children, className = '', variant = 'default', onClick }: CardProps) {
  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:border-text-muted/30 active:scale-[0.99] transition-all duration-200' 
    : '';

  let variantClasses = '';
  
  // Différentes matières pour éviter le syndrome "100% de cartes identiques générées par IA"
  switch (variant) {
    case 'editorial':
      // Style "Code annoté" : Marge gauche bordeaux, aspect plus plat et papier
      variantClasses = 'bg-surface border-y border-r border-l-[3px] border-l-secondary border-y-border border-r-border rounded-r-lg shadow-none';
      break;
    case 'minimal':
      // Juste un séparateur en bas, pas de boîte
      variantClasses = 'bg-transparent border-b border-border rounded-none pb-4';
      break;
    case 'default':
    default:
      // Carte standard allégée en ombres
      variantClasses = 'bg-surface border border-border rounded-xl shadow-none';
      break;
  }

  return (
    <div 
      onClick={onClick}
      className={`p-4 md:p-5 ${variantClasses} ${interactiveClasses} ${className}`}
    >
      {children}
    </div>
  );
}

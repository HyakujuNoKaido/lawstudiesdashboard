import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'accent' | 'info';
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({ children, variant = 'default', className = '', icon }: BadgeProps) {
  const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors";
  
  const variants = {
    default: "bg-surface-elevated text-text-muted border border-border/50",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    danger: "bg-danger/10 text-danger border border-danger/20",
    accent: "bg-accent/10 text-accent border border-accent/20",
    info: "bg-info/10 text-info border border-info/20",
    outline: "bg-transparent text-text border border-border",
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {icon && <span className="opacity-80">{icon}</span>}
      {children}
    </span>
  );
}

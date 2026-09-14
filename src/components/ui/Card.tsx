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

src/components/ui/ProgressBar.tsx

Une barre de progression sobre pour les ECTS et les révisions.

TypeScript


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

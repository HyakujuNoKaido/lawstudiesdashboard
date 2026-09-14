 import React from 'react';

import { Card } from '../components/ui/Card';

import { ProgressBar } from '../components/ui/ProgressBar';

import { GraduationCap, Clock, BrainCircuit, CheckCircle2, Circle, AlertCircle } from 'lucide-react';


export function Dashboard() {

return (

<div className="flex flex-col gap-6 pt-2 pb-6 animate-in fade-in duration-300">

{/* En-tête */}

<header>

<h1 className="font-serif text-3xl mb-1">Bonjour, Alex</h1>

<p className="text-text-muted text-sm font-medium">

Lundi 14 septembre • Semestre d'automne (Exemple)

</p>

</header>


{/* Carte principale : Progression du diplôme */}

<section>

<Card>

<div className="flex justify-between items-start mb-4">

<div className="flex items-center gap-2 text-text-muted">

<GraduationCap size={18} />

<span className="text-xs uppercase tracking-wider font-semibold">Progression Bachelor</span>

</div>

<span className="text-xl font-serif text-accent">45 <span className="text-sm text-text-muted font-sans">/ 180 ECTS</span></span>

</div>

<ProgressBar value={45} max={180} />

<p className="text-xs text-text-muted mt-3">

25% complété. 135 crédits restants.

</p>

</Card>

</section>


{/* Grille : Prochaine échéance & Révision */}

<section className="grid grid-cols-1 md:grid-cols-2 gap-4">

<Card onClick={() => console.log('Ouvrir échéance')}>

<div className="flex items-center gap-2 text-text-muted mb-2">

<Clock size={16} />

<span className="text-xs uppercase tracking-wider font-semibold">Prochaine échéance</span>

</div>

<p className="font-medium text-text mt-1">Séminaire Droit des obligations</p>

<div className="flex justify-between items-center mt-3">

<span className="text-xs text-text-muted bg-surface-elevated px-2 py-1 rounded-sm">Aujourd'hui, 14:15</span>

<span className="text-xs text-info">Salle B112</span>

</div>

</Card>


<Card onClick={() => console.log('Ouvrir révision')}>

<div className="flex items-center gap-2 text-text-muted mb-2">

<BrainCircuit size={16} />

<span className="text-xs uppercase tracking-wider font-semibold">Révision du jour</span>

</div>

<p className="font-medium text-text mt-1">Droit pénal général</p>

<div className="flex justify-between items-center mt-3">

<span className="text-xs text-text-muted bg-surface-elevated px-2 py-1 rounded-sm">42 cartes dues</span>

<span className="text-xs text-accent-strong">~15 min</span>

</div>

</Card>

</section>


{/* Tâches du jour */}

<section>

<div className="flex items-center justify-between mb-3">

<h2 className="font-serif text-xl">À faire aujourd'hui</h2>

</div>

<div className="flex flex-col gap-2">

{/* Tâche à faire */}

<div className="flex items-start gap-3 p-3 bg-surface rounded-md border border-border group cursor-pointer hover:border-text-muted/40 transition-colors">

<button className="text-text-muted group-hover:text-accent mt-0.5 transition-colors">

<Circle size={20} strokeWidth={2} />

</button>

<div className="flex-1">

<p className="text-sm font-medium">Lire l'arrêt ATF 123 IV 56</p>

<p className="text-xs text-text-muted mt-1">Droit pénal • Pour le séminaire de demain</p>

</div>

</div>


{/* Tâche terminée */}

<div className="flex items-start gap-3 p-3 bg-surface rounded-md border border-border/50 opacity-60">

<button className="text-success mt-0.5">

<CheckCircle2 size={20} strokeWidth={2} />

</button>

<div className="flex-1">

<p className="text-sm font-medium line-through decoration-text-muted/50">Imprimer le plan d'études</p>

<p className="text-xs text-text-muted mt-1">Général</p>

</div>

</div>

</div>

</section>

</div>

);

} 

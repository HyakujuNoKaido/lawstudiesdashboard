export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy';

export interface CardState {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
}

/**
 * Calcule le prochain état d'une flashcard selon la qualité de la réponse.
 * Inspiré de SM-2 avec des intervalles ajustés pour un usage étudiant court/moyen terme.
 */
export function calculateNextReview(currentState: CardState, quality: ReviewQuality): CardState {
  let { intervalDays, easeFactor, repetitions, lapses } = currentState;
  
  if (quality === 'again') {
    repetitions = 0;
    lapses += 1;
    intervalDays = 0.001; // ~1 minute (à gérer via une file d'attente locale pour la session)
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    if (quality === 'hard') {
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      intervalDays = repetitions === 0 ? 0.01 : intervalDays * 1.2;
    } else if (quality === 'good') {
      intervalDays = repetitions === 0 ? 1 : intervalDays * easeFactor;
    } else if (quality === 'easy') {
      easeFactor += 0.15;
      intervalDays = repetitions === 0 ? 4 : intervalDays * easeFactor * 1.3;
    }
    repetitions += 1;
  }

  return {
    intervalDays: Number(intervalDays.toFixed(3)),
    easeFactor: Number(easeFactor.toFixed(3)),
    repetitions,
    lapses
  };
}

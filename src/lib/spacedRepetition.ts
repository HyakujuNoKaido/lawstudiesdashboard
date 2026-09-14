
export interface SM2Result {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
}

/**
 * Calcule les nouveaux paramètres de répétition espacée selon l'algorithme SM-2.
 * @param quality Note de 0 à 5 (0 = échec total, 3 = correct, 5 = parfait)
 * @param repetitions Nombre de répétitions consécutives réussies
 * @param interval Jours actuels avant la prochaine révision
 * @param easeFactor Facteur de facilité actuel (minimum 1.3)
 */
export function calculateSM2(
  quality: number,
  repetitions: number,
  interval: number,
  easeFactor: number
): SM2Result {
  let nextRepetitions = repetitions;
  let nextInterval = interval;
  let nextEaseFactor = easeFactor;

  if (quality >= 3) {
    if (nextRepetitions === 0) {
      nextInterval = 1;
    } else if (nextRepetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * easeFactor);
    }
    nextRepetitions += 1;
  } else {
    nextRepetitions = 0;
    nextInterval = 1;
  }

  // Formule standard SM-2 pour l'ajustement du facteur de facilité
  nextEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  return {
    repetitions: nextRepetitions,
    intervalDays: nextInterval,
    easeFactor: Number(nextEaseFactor.toFixed(2))
  };
}

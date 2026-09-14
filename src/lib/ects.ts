export interface CourseRecord {
  id: string;
  ects: number;
  grade?: number | null;
  status: 'valide' | 'en_cours' | 'a_reprendre';
}

export interface AcademicProgress {
  totalRequired: number;
  ectsObtained: number;
  ectsInProgress: number;
  ectsRemaining: number;
  weightedAverage: number | null;
  completionPercentage: number;
}

export function calculateAcademicProgress(
  courses: CourseRecord[], 
  totalRequired: number = 180, 
  passingGrade: number = 4.0
): AcademicProgress {
  let ectsObtained = 0;
  let ectsInProgress = 0;
  let totalPointsForAverage = 0;
  let totalEctsForAverage = 0;

  courses.forEach(course => {
    // Calcul des ECTS obtenus
    if (course.status === 'valide' || (course.grade && course.grade >= passingGrade)) {
      ectsObtained += course.ects;
    } else if (course.status === 'en_cours') {
      ectsInProgress += course.ects;
    }

    // Calcul de la moyenne pondérée (uniquement pour les cours avec une note)
    if (course.grade !== undefined && course.grade !== null) {
      totalPointsForAverage += course.grade * course.ects;
      totalEctsForAverage += course.ects;
    }
  });

  const ectsRemaining = Math.max(0, totalRequired - ectsObtained);
  const completionPercentage = Math.min(100, (ectsObtained / totalRequired) * 100);
  
  const weightedAverage = totalEctsForAverage > 0 
    ? Number((totalPointsForAverage / totalEctsForAverage).toFixed(2)) 
    : null;

  return {
    totalRequired,
    ectsObtained,
    ectsInProgress,
    ectsRemaining,
    weightedAverage,
    completionPercentage: Number(completionPercentage.toFixed(1))
  };
}

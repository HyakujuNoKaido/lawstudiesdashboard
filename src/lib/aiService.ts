import * as pdfjsLib from 'pdfjs-dist';

// Configuration du Worker PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export interface ExtractedPdfPage {
  page: number;
  text: string;
}

export interface ExtractedPdfDocument {
  text: string;
  pages: ExtractedPdfPage[];
  pageCount: number;
}

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  category: 'definition' | 'distinction' | 'condition' | 'exception' | 'liste' | 'application' | 'reference';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  sourcePages: number[];
  sourceQuote?: string;
}

export interface CaseLawAnalysis {
  title: string;
  court: string;
  citation: string;
  date: string;
  jurisdiction: string;
  source_basis: 'explicit' | 'incomplete' | 'not_found';
  facts: string;
  procedure: string;
  claims_and_arguments: string;
  legal_issues: string[];
  applicable_rules: string[];
  reasoning: string;
  holding: string;
  disposition: string;
  significance: string;
  uncertainties: string[];
  source_pages: number[];
}

/**
 * Extraction PDF structurée par pages avec traçabilité
 */
export async function extractTextFromPDF(
  fileUrl: string,
  startPage = 1,
  endPage?: number
): Promise<ExtractedPdfDocument> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      url: fileUrl,
      useWorkerFetch: true,
      isEvalSupported: true,
    });
    const pdf = await loadingTask.promise;
    const firstPage = Math.max(1, startPage);
    const lastPage = Math.min(endPage ?? pdf.numPages, pdf.numPages);
    
    const pages: ExtractedPdfPage[] = [];
    for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      pages.push({
        page: pageNumber,
        text: pageText,
      });
    }

    return {
      pageCount: pdf.numPages,
      pages,
      text: pages.map((p) => `[PAGE ${p.page}]\n${p.text}`).join('\n\n'),
    };
  } catch (error) {
    console.error('Erreur extraction PDF:', error);
    throw new Error('Impossible de lire le document PDF.');
  }
}

/**
 * Appel sécurisé via le proxy Cloudflare avec tolérance sur le format de réponse
 */
async function callLawstudiesAI(
  action: string,
  payload: Record<string, unknown>
): Promise<any> {
  try {
    const response = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        payload,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? 'Erreur du service IA via le proxy.');
    }

    // Tolérance d'adaptation selon la structure retournée par le proxy (data.result ou data direct)
    const result = data.result ?? data;
    if (result === undefined || result === null) {
      throw new Error('Réponse vide du proxy IA.');
    }

    return result;
  } catch (err) {
    console.error("Erreur critique d'appel IA:", err);
    throw err;
  }
}

/**
 * Validation robuste d'une flashcard générée
 */
function isGeneratedFlashcard(value: unknown): value is GeneratedFlashcard {
  if (!value || typeof value !== 'object') return false;
  const card = value as Record<string, unknown>;
  const validCategories = ['definition', 'distinction', 'condition', 'exception', 'liste', 'application', 'reference'];
  const validDifficulties = ['basic', 'intermediate', 'advanced'];

  return (
    typeof card.question === 'string' &&
    card.question.trim().length > 0 &&
    typeof card.answer === 'string' &&
    card.answer.trim().length > 0 &&
    typeof card.category === 'string' &&
    validCategories.includes(card.category) &&
    typeof card.difficulty === 'string' &&
    validDifficulties.includes(card.difficulty) &&
    Array.isArray(card.sourcePages) &&
    card.sourcePages.every((page) => Number.isInteger(page) && page > 0)
  );
}

/**
 * Synthèse fidèle et structurée
 */
export async function generateAISummary(
  text: string,
  options: { title?: string; courseTitle?: string; jurisdiction?: string; mode?: 'faithful' | 'exam' } = {}
): Promise<string> {
  const prompt = `Analyse le support ci-dessous et rédige une synthèse structurée.

MODE : ${options.mode === 'exam' ? 'Révision d’examen : hiérarchise les notions examinables et les distinctions.' : 'Fidélité maximale : restitue le support sans ajout externe.'}

EXIGENCES :
1. Couvre toutes les parties substantielles de la SOURCE.
2. Conserve les définitions, structures, listes et références présentes.
3. Si une information importante manque, indique explicitement : "Non précisé dans le support."
4. N’ajoute aucune référence légale extérieure au texte.
5. Termine par une section "Points à retenir pour l’examen" strictement fondée sur le support.

[SOURCE À ANALYSER]
${text}
[FIN DE LA SOURCE]`;

  const res = await callLawstudiesAI('generate_summary', { prompt, isJsonResponse: false });
  return typeof res === 'string' ? res : JSON.stringify(res);
}

/**
 * Génération de flashcards avec validation et traçabilité
 */
export async function generateAIFlashcards(
  text: string,
  optionsOrCourseId?: string | { count?: number; difficulty?: 'mixed' | 'basic' | 'intermediate' | 'advanced' },
  _chapterId?: string
): Promise<GeneratedFlashcard[]> {
  const options = typeof optionsOrCourseId === 'string' ? {} : optionsOrCourseId ?? {};

  const prompt = `Génère des flashcards universitaires à partir de la SOURCE.
RÈGLES :
1. Une carte = une seule idée vérifiable.
2. Ne crée aucune carte dont la réponse n'est pas soutenue par la SOURCE.
3. Indique les numéros de pages sources concernés ([PAGE X]) sous forme de tableau dans sourcePages.
4. sourcePages doit contenir uniquement les numéros de pages réellement utilisés.
5. sourceQuote doit être une citation courte, exacte et copiée de la SOURCE si possible.

Retourne uniquement un tableau JSON valide au format strict :
[
  {
    "question": "...",
    "answer": "...",
    "category": "definition",
    "difficulty": "intermediate",
    "sourcePages": [1],
    "sourceQuote": "..."
  }
]

[SOURCE À ANALYSER]
${text}
[FIN DE LA SOURCE]`;

  const rawResult = await callLawstudiesAI('generate_flashcards', { prompt, isJsonResponse: true });
  
  if (!Array.isArray(rawResult)) {
    // Fallback de tolérance si l'IA renvoie un objet enveloppé
    const potentialArray = (rawResult as any)?.flashcards || (rawResult as any)?.cards;
    if (Array.isArray(potentialArray)) {
      return potentialArray.filter(isGeneratedFlashcard);
    }
    return [];
  }

  return rawResult.filter(isGeneratedFlashcard);
}

/**
 * Fiche d'arrêt universelle avec adaptateur pour rétrocompatibilité
 */
export async function generateCaseLaw(text: string): Promise<any> {
  const prompt = `Réalise une fiche d’arrêt à partir de la SOURCE uniquement. 
Si une information (juridiction, citation, faits) est absente, écris "Non précisé dans le support".

Retourne uniquement un objet JSON valide :
{
  "title": "",
  "court": "",
  "citation": "",
  "date": "",
  "jurisdiction": "",
  "source_basis": "explicit",
  "facts": "",
  "procedure": "",
  "claims_and_arguments": "",
  "legal_issues": [],
  "applicable_rules": [],
  "reasoning": "",
  "holding": "",
  "disposition": "",
  "significance": "",
  "uncertainties": [],
  "source_pages": []
}

[SOURCE À ANALYSER]
${text}
[FIN DE LA SOURCE]`;

  const analysis: CaseLawAnalysis = await callLawstudiesAI('generate_case_law', { prompt, isJsonResponse: true });

  // Adaptateur de rétrocompatibilité pour les composants existants attendant atf_citation, consideranda, etc.
  return {
    title: analysis.title || "Non précisé dans le support",
    atf_citation: analysis.citation || "Non précisé dans le support",
    court: analysis.court,
    date: analysis.date,
    jurisdiction: analysis.jurisdiction,
    facts: analysis.facts || "Non précisé dans le support",
    procedure: analysis.procedure || "Non précisé dans le support",
    claims_and_arguments: analysis.claims_and_arguments,
    legal_issues: Array.isArray(analysis.legal_issues) ? analysis.legal_issues.join('\n') : (analysis.legal_issues || "Non précisé dans le support"),
    applicable_rules: analysis.applicable_rules,
    consideranda: analysis.reasoning || "Non précisé dans le support",
    holding: analysis.holding || "Non précisé dans le support",
    disposition: analysis.disposition,
    pedagogical_takeaway: analysis.significance || "Non précisé dans le support",
    uncertainties: analysis.uncertainties,
    source_pages: analysis.source_pages,
  };
}

/**
 * Subsomption juridique rigoureuse
 */
export async function generateSubsumption(text: string): Promise<any> {
  const prompt = `Résous le cas pratique par une méthode de subsomption en utilisant exclusivement les règles présentes dans la SOURCE.

Retourne uniquement un objet JSON valide :
{
  "legal_issues": [
    {
      "question": "",
      "major_premise": "",
      "minor_premise": "",
      "counterarguments": "",
      "conclusion": "",
      "source_basis": "explicit",
      "uncertainties": []
    }
  ],
  "overall_conclusion": ""
}

[SOURCE À ANALYSER]
${text}
[FIN DE LA SOURCE]`;

  return callLawstudiesAI('generate_subsumption', { prompt, isJsonResponse: true });
}

/**
 * Examen blanc ancré dans le support avec contrôle de contenu
 */
export async function generateMockExam(inputOrCourseTitle: string | { courseTitle: string; sourceText?: string; difficulty?: 'intermediate' | 'advanced'; durationMinutes?: number }): Promise<any> {
  const input = typeof inputOrCourseTitle === 'string' 
    ? { courseTitle: inputOrCourseTitle, sourceText: '' } 
    : inputOrCourseTitle;

  if (!input.sourceText?.trim()) {
    console.warn("Attention: Génération d'examen blanc sans texte source fourni. L'examen risque d'être générique.");
  }

  const prompt = `Génère un examen blanc universitaire fondé sur le cours et la SOURCE fournie.
- Cours : ${input.courseTitle}
- Difficulté : ${input.difficulty ?? 'advanced'}
- Durée : ${input.durationMinutes ?? 90} minutes

Retourne uniquement un objet JSON valide :
{
  "title": "Examen blanc : ${input.courseTitle}",
  "instructions": "",
  "facts": "",
  "questions": [
    {
      "id": "q1",
      "question": "",
      "points": 0,
      "source_pages": []
    }
  ],
  "grading_rubric": [],
  "solution_guidelines": "",
  "uncertainties": []
}

[SOURCE À ANALYSER]
${input.sourceText ?? 'Aucun texte source fourni.'}
[FIN DE LA SOURCE]`;

  return callLawstudiesAI('generate_mock_exam', { prompt, isJsonResponse: true });
}

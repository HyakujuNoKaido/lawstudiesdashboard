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

export interface FlashcardGenerationOptions {
  courseId?: string;
  chapterId?: string;
  count?: number;
  difficulty?: 'mixed' | 'basic' | 'intermediate' | 'advanced';
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
 * Construit un contexte structuré pour isoler les métadonnées de la source
 */
function buildSourceContext(input: {
  text: string;
  title?: string;
  courseTitle?: string;
  sourceType?: string;
  jurisdiction?: string;
}) {
  return `[METADONNEES]
Titre : ${input.title ?? 'Non précisé'}
Cours : ${input.courseTitle ?? 'Non précisé'}
Type de source : ${input.sourceType ?? 'Support de cours'}
Juridiction : ${input.jurisdiction ?? 'Non précisée'}

[SOURCE À ANALYSER]
${input.text}
[FIN DE LA SOURCE]`;
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
 * Normalisation et validation tolérante des flashcards pour éviter de perdre toute une génération
 */
function normalizeFlashcard(value: unknown): GeneratedFlashcard | null {
  if (!value || typeof value !== 'object') return null;
  const card = value as Record<string, unknown>;
  
  if (typeof card.question !== 'string' || !card.question.trim() ||
      typeof card.answer !== 'string' || !card.answer.trim()) {
    return null;
  }

  const validCategories = ['definition', 'distinction', 'condition', 'exception', 'liste', 'application', 'reference'];
  const validDifficulties = ['basic', 'intermediate', 'advanced'];

  return {
    question: card.question.trim(),
    answer: card.answer.trim(),
    category: validCategories.includes(card.category as string) ? (card.category as any) : 'definition',
    difficulty: validDifficulties.includes(card.difficulty as string) ? (card.difficulty as any) : 'intermediate',
    sourcePages: Array.isArray(card.sourcePages) 
      ? card.sourcePages.filter((p): p is number => Number.isInteger(p) && p > 0) 
      : [],
    sourceQuote: typeof card.sourceQuote === 'string' ? card.sourceQuote : undefined,
  };
}

/**
 * Synthèse fidèle et structurée intégrant les métadonnées
 */
export async function generateAISummary(
  text: string,
  options: { title?: string; courseTitle?: string; jurisdiction?: string; mode?: 'faithful' | 'exam' } = {}
): Promise<string> {
  const sourceContext = buildSourceContext({
    text,
    title: options.title,
    courseTitle: options.courseTitle,
    jurisdiction: options.jurisdiction,
    sourceType: 'support de cours',
  });

  const prompt = `Analyse le support ci-dessous et rédige une synthèse structurée.

MODE : ${options.mode === 'exam' ? 'Révision d’examen : hiérarchise les notions examinables et les distinctions.' : 'Fidélité maximale : restitue le support sans ajout externe.'}

EXIGENCES :
1. Couvre toutes les parties substantielles de la SOURCE.
2. Conserve les définitions, structures, listes et références présentes.
3. Si une information importante manque, indique explicitement : "Non précisé dans le support."
4. N’ajoute aucune référence légale extérieure au texte.
5. Termine par une section "Points à retenir pour l’examen" strictement fondée sur le support.

${sourceContext}`;

  const res = await callLawstudiesAI('generate_summary', { prompt, isJsonResponse: false });
  return typeof res === 'string' ? res : JSON.stringify(res);
}

/**
 * Génération de flashcards avec préservation de la signature d'origine (courseId, chapterId) et des options
 */
export async function generateAIFlashcards(
  text: string,
  optionsOrCourseId?: string | FlashcardGenerationOptions,
  chapterId?: string
): Promise<GeneratedFlashcard[]> {
  const options: FlashcardGenerationOptions =
    typeof optionsOrCourseId === 'string'
      ? { courseId: optionsOrCourseId, chapterId }
      : optionsOrCourseId ?? {};

  const sourceContext = buildSourceContext({ text, sourceType: 'support de cours' });

  const prompt = `Génère des flashcards universitaires à partir de la SOURCE.
PARAMÈTRES :
- Nombre cible : ${options.count ?? 'adaptatif'}
- Difficulté : ${options.difficulty ?? 'mixed'}

RÈGLES :
1. Une carte = une seule idée vérifiable.
2. Ne crée aucune carte dont la réponse n'est pas soutenue par la SOURCE.
3. Indique les numéros de pages sources concernés dans sourcePages (uniquement les pages réellement utilisées).
4. sourceQuote doit être une citation courte, exacte et copiée de la SOURCE si possible.

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

${sourceContext}`;

  const rawResult = await callLawstudiesAI('generate_flashcards', { prompt, isJsonResponse: true });
  
  const arrayResult = Array.isArray(rawResult) 
    ? rawResult 
    : ((rawResult as any)?.flashcards || (rawResult as any)?.cards || []);

  const normalizedCards = arrayResult.map(normalizeFlashcard).filter((c): c is GeneratedFlashcard => c !== null);
  
  return normalizedCards;
}

/**
 * Fiche d'arrêt universelle avec adaptateur complet pour CaseLawEditor.tsx
 */
export async function generateCaseLaw(text: string): Promise<any> {
  const sourceContext = buildSourceContext({ text, sourceType: 'arrêt ou décision judiciaire' });
  
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

${sourceContext}`;

  const analysis: CaseLawAnalysis = await callLawstudiesAI('generate_case_law', { prompt, isJsonResponse: true });

  const fallback = "Non précisé dans le support";
  const legalIssuesStr = Array.isArray(analysis.legal_issues) ? analysis.legal_issues.join('\n') : (analysis.legal_issues || fallback);
  const citationVal = analysis.citation || fallback;
  const reasoningVal = analysis.reasoning || fallback;
  const significanceVal = analysis.significance || fallback;

  // Adaptateur double pour couvrir à la fois les conventions snake_case et camelCase/anciennes propriétés de l'éditeur
  return {
    title: analysis.title || fallback,
    atf_citation: citationVal,
    atfcitation: citationVal,
    citation: citationVal,
    court: analysis.court || fallback,
    date: analysis.date || fallback,
    jurisdiction: analysis.jurisdiction || fallback,
    facts: analysis.facts || fallback,
    procedure: analysis.procedure || fallback,
    claims_and_arguments: analysis.claims_and_arguments || fallback,
    legal_issues: legalIssuesStr,
    legalissues: legalIssuesStr,
    applicable_rules: analysis.applicable_rules || [],
    consideranda: reasoningVal,
    reasoning: reasoningVal,
    holding: analysis.holding || fallback,
    disposition: analysis.disposition || fallback,
    pedagogical_takeaway: significanceVal,
    pedagogicaltakeaway: significanceVal,
    significance: significanceVal,
    uncertainties: analysis.uncertainties || [],
    source_pages: analysis.source_pages || [],
  };
}

/**
 * Subsomption juridique rigoureuse
 */
export async function generateSubsumption(text: string): Promise<any> {
  const sourceContext = buildSourceContext({ text, sourceType: 'cas pratique' });
  
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

${sourceContext}`;

  return callLawstudiesAI('generate_subsumption', { prompt, isJsonResponse: true });
}

/**
 * Examen blanc avec vérification stricte du texte source en mode fondé sur le cours
 */
export async function generateMockExam(
  inputOrCourseTitle: string | { 
    courseTitle: string; 
    sourceText?: string; 
    difficulty?: 'intermediate' | 'advanced'; 
    durationMinutes?: number;
    mode?: 'source_based' | 'general';
  }
): Promise<any> {
  const input = typeof inputOrCourseTitle === 'string' 
    ? { courseTitle: inputOrCourseTitle, sourceText: '', mode: 'general' as const } 
    : { mode: 'source_based' as const, ...inputOrCourseTitle };

  if (input.mode === 'source_based' && !input.sourceText?.trim()) {
    throw new Error('Un support est nécessaire pour générer un examen basé sur le cours.');
  }

  const sourceContext = buildSourceContext({
    text: input.sourceText ?? '',
    courseTitle: input.courseTitle,
    sourceType: 'support d’examen',
  });

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

${sourceContext}`;

  return callLawstudiesAI('generate_mock_exam', { prompt, isJsonResponse: true });
}

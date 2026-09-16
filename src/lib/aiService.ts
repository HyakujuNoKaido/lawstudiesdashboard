import * as pdfjsLib from 'pdfjs-dist';

// URL stricte, sans aucun markdown
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export interface GeneratedFlashcard {
  question: string;
  answer: string;
  category: 'definition' | 'distinction' | 'condition' | 'exception' | 'liste' | 'application' | 'reference';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  sourcePages: number[];
  sourceQuote?: string;
}

export interface FlashcardGenerationResult {
  cards: GeneratedFlashcard[];
  generatedCount: number;
  validCount: number;
  duplicateCount: number;
  rejectedCount: number;
  warnings: string[];
}

export interface FlashcardGenerationOptions {
  courseId?: string;
  chapterId?: string;
  courseTitle?: string;
  chapterTitle?: string;
  count?: number;
  difficulty?: 'mixed' | 'basic' | 'intermediate' | 'advanced';
  sourceType?: 'pdf' | 'text' | 'note';
  availablePages?: number[];
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

export async function extractTextFromPDF(fileUrl: string, startPage = 1, endPage?: number): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({ url: fileUrl, useWorkerFetch: true, isEvalSupported: true });
    const pdf = await loadingTask.promise;
    const firstPage = Math.max(1, startPage);
    const lastPage = Math.min(endPage ?? pdf.numPages, pdf.numPages);
    
    let fullText = '';
    for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ').replace(/\s+/g, ' ').trim();
      fullText += `[PAGE ${pageNumber}]\n${pageText}\n\n`;
    }
    return fullText.trim();
  } catch (error) {
    console.error('Erreur extraction PDF:', error);
    throw new Error('Impossible de lire le document PDF.');
  }
}

function buildSourceContext(input: { text: string; title?: string; courseTitle?: string; sourceType?: string; jurisdiction?: string; }) {
  return `[METADONNEES]
Titre : ${input.title ?? 'Non précisé'}
Cours : ${input.courseTitle ?? 'Non précisé'}
Type de source : ${input.sourceType ?? 'Support de cours'}
Juridiction : ${input.jurisdiction ?? 'Non précisée'}

[SOURCE À ANALYSER]
${input.text}
[FIN DE LA SOURCE]`;
}

async function callLawstudiesAI(action: string, payload: Record<string, unknown>): Promise<any> {
  try {
    const response = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
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

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function normalizeFlashcard(value: unknown, options: FlashcardGenerationOptions): { card: GeneratedFlashcard | null; reason?: string } {
  if (!value || typeof value !== 'object') return { card: null, reason: 'Format objet invalide' };
  const card = value as Record<string, unknown>;
  
  if (typeof card.question !== 'string' || !card.question.trim() || typeof card.answer !== 'string' || !card.answer.trim()) {
    return { card: null, reason: 'Question ou réponse vide' };
  }

  const validCategories = ['definition', 'distinction', 'condition', 'exception', 'liste', 'application', 'reference'];
  const validDifficulties = ['basic', 'intermediate', 'advanced'];

  const sourcePages = Array.isArray(card.sourcePages) ? card.sourcePages.filter((p: any) => Number.isInteger(p) && p > 0) : [];

  if (options.sourceType === 'pdf') {
    if (sourcePages.length === 0) {
      return { card: null, reason: 'Pages sources absentes pour un document PDF' };
    }
    if (options.availablePages && sourcePages.some(p => !options.availablePages!.includes(p))) {
      return { card: null, reason: 'Une page source indiquée n’existe pas dans le document analysé' };
    }
  }

  return {
    card: {
      question: card.question.trim(),
      answer: card.answer.trim(),
      category: validCategories.includes(card.category as string) ? (card.category as any) : 'definition',
      difficulty: validDifficulties.includes(card.difficulty as string) ? (card.difficulty as any) : 'intermediate',
      sourcePages,
      sourceQuote: typeof card.sourceQuote === 'string' ? card.sourceQuote : undefined,
    }
  };
}

function deduplicateFlashcards(cards: GeneratedFlashcard[]): { uniqueCards: GeneratedFlashcard[]; duplicateCount: number } {
  const seen = new Set<string>();
  let duplicateCount = 0;
  const uniqueCards = cards.filter((card) => {
    const key = `${card.question}::${card.answer}`.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) {
      duplicateCount++;
      return false;
    }
    seen.add(key);
    return true;
  });
  return { uniqueCards, duplicateCount };
}

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

export async function generateAIFlashcardsDetailed(
  text: string,
  optionsOrCourseId?: string | FlashcardGenerationOptions,
  chapterId?: string
): Promise<FlashcardGenerationResult> {
  const options: FlashcardGenerationOptions = typeof optionsOrCourseId === 'string' ? { courseId: optionsOrCourseId, chapterId } : optionsOrCourseId ?? {};

  const mappedSourceType = options.sourceType === 'pdf' ? 'support PDF' : options.sourceType === 'note' ? 'note de cours' : 'texte fourni par l’utilisateur';

  const sourceContext = buildSourceContext({ 
    text, 
    courseTitle: options.courseTitle,
    title: options.chapterTitle,
    sourceType: mappedSourceType 
  });

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
  const arrayResult = Array.isArray(rawResult) ? rawResult : ((rawResult as any)?.flashcards || (rawResult as any)?.cards || []);

  const generatedCount = arrayResult.length;
  let rejectedCount = 0;
  const warnings: string[] = [];
  const parsedCards: GeneratedFlashcard[] = [];

  for (const item of arrayResult) {
    const { card, reason } = normalizeFlashcard(item, options);
    if (card) {
      parsedCards.push(card);
    } else {
      rejectedCount++;
      if (reason) warnings.push(`Carte ignorée : ${reason}`);
    }
  }

  const { uniqueCards, duplicateCount } = deduplicateFlashcards(parsedCards);
  if (duplicateCount > 0) warnings.push(`${duplicateCount} doublon(s) textuel(s) retiré(s).`);
  if (rejectedCount > 0) warnings.push(`${rejectedCount} carte(s) ignorée(s) pour format incomplet.`);

  return { cards: uniqueCards, generatedCount, validCount: uniqueCards.length, duplicateCount, rejectedCount, warnings };
}

export async function generateAIFlashcards(
  text: string,
  optionsOrCourseId?: string | FlashcardGenerationOptions,
  chapterId?: string
): Promise<GeneratedFlashcard[]> {
  const result = await generateAIFlashcardsDetailed(text, optionsOrCourseId, chapterId);
  return result.cards;
}

export async function generateCaseLaw(text: string): Promise<any> {
  const sourceContext = buildSourceContext({ text, sourceType: 'arrêt ou décision judiciaire' });
  
  const prompt = `Réalise une fiche d’arrêt à partir de la SOURCE uniquement. 
Retourne uniquement un objet JSON valide avec exactement ces clés :
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

source_basis doit être exactement :
- "explicit" si les informations principales sont présentes ;
- "incomplete" si l’analyse est partielle ;
- "not_found" si la décision ne peut pas être identifiée.

N'ajoute aucune clé supplémentaire.
${sourceContext}`;

  const rawAnalysis = await callLawstudiesAI('generate_case_law', { prompt, isJsonResponse: true });
  const fallback = "Non précisé dans le support";
  
  const analysis: CaseLawAnalysis = {
    title: typeof rawAnalysis?.title === 'string' ? rawAnalysis.title : fallback,
    court: typeof rawAnalysis?.court === 'string' ? rawAnalysis.court : fallback,
    citation: typeof rawAnalysis?.citation === 'string' ? rawAnalysis.citation : fallback,
    date: typeof rawAnalysis?.date === 'string' ? rawAnalysis.date : fallback,
    jurisdiction: typeof rawAnalysis?.jurisdiction === 'string' ? rawAnalysis.jurisdiction : fallback,
    source_basis: ['explicit', 'incomplete', 'not_found'].includes(rawAnalysis?.source_basis) ? rawAnalysis.source_basis : 'incomplete',
    facts: typeof rawAnalysis?.facts === 'string' ? rawAnalysis.facts : fallback,
    procedure: typeof rawAnalysis?.procedure === 'string' ? rawAnalysis.procedure : fallback,
    claims_and_arguments: typeof rawAnalysis?.claims_and_arguments === 'string' ? rawAnalysis.claims_and_arguments : fallback,
    legal_issues: normalizeStringArray(rawAnalysis?.legal_issues),
    applicable_rules: normalizeStringArray(rawAnalysis?.applicable_rules),
    reasoning: typeof rawAnalysis?.reasoning === 'string' ? rawAnalysis.reasoning : fallback,
    holding: typeof rawAnalysis?.holding === 'string' ? rawAnalysis.holding : fallback,
    disposition: typeof rawAnalysis?.disposition === 'string' ? rawAnalysis.disposition : fallback,
    significance: typeof rawAnalysis?.significance === 'string' ? rawAnalysis.significance : fallback,
    uncertainties: normalizeStringArray(rawAnalysis?.uncertainties),
    source_pages: Array.isArray(rawAnalysis?.source_pages) ? rawAnalysis.source_pages.filter((p: any) => Number.isInteger(p) && p > 0) : [],
  };

  const legalIssuesStr = analysis.legal_issues.length > 0 ? analysis.legal_issues.join('\n') : fallback;
  const citationVal = analysis.citation;
  const reasoningVal = analysis.reasoning;
  const significanceVal = analysis.significance;

  return {
    title: analysis.title,
    atf_citation: citationVal,
    atfcitation: citationVal,
    citation: citationVal,
    court: analysis.court,
    date: analysis.date,
    jurisdiction: analysis.jurisdiction,
    facts: analysis.facts,
    procedure: analysis.procedure,
    claims_and_arguments: analysis.claims_and_arguments,
    legal_issues: legalIssuesStr,
    legalissues: legalIssuesStr,
    applicable_rules: analysis.applicable_rules,
    consideranda: reasoningVal,
    reasoning: reasoningVal,
    holding: analysis.holding,
    disposition: analysis.disposition,
    pedagogical_takeaway: significanceVal,
    pedagogicaltakeaway: significanceVal,
    significance: significanceVal,
    uncertainties: analysis.uncertainties,
    source_pages: analysis.source_pages,
  };
}

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

export async function generateMockExam(
  inputOrCourseTitle: string | { courseTitle: string; sourceText?: string; difficulty?: 'intermediate' | 'advanced'; durationMinutes?: number; mode?: 'source_based' | 'general'; }
): Promise<any> {
  const input = typeof inputOrCourseTitle === 'string' ? { courseTitle: inputOrCourseTitle, sourceText: '', mode: 'general' as const } : { mode: 'source_based' as const, ...inputOrCourseTitle };

  if (input.mode === 'source_based' && !input.sourceText?.trim()) {
    throw new Error('Un support est nécessaire pour générer un examen basé sur le cours.');
  }

  const examBasis = input.mode === 'source_based' 
    ? 'L’examen doit être strictement fondé sur la SOURCE fournie.' 
    : 'L’examen est général et fondé uniquement sur le nom du cours. Indique clairement qu’il ne provient pas d’un support importé.';

  const sourceContext = buildSourceContext({
    text: input.sourceText ?? '',
    courseTitle: input.courseTitle,
    sourceType: 'support d’examen',
  });

  const prompt = `Génère un examen blanc universitaire.
- Règle de conception : ${examBasis}
- Nom du cours : ${input.courseTitle}
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

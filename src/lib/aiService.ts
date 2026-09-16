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
 * Extraction PDF structurée par pages (permet la traçabilité des sources)
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
 * Prompt système universel et strict (Indépendant du droit suisse par défaut, interdiction d'inventer)
 */
const UNIVERSAL_LEGAL_SYSTEM_PROMPT = `Tu es un assistant académique juridique de niveau universitaire. 
Ta mission est d'analyser des supports de cours, textes doctrinaux, articles de loi et décisions judiciaires dans tous les domaines du droit.

RÈGLE ABSOLUE DE FIDÉLITÉ :
1. Utilise en priorité et explicitement le contenu de la SOURCE.
2. N'ajoute aucune règle, référence légale, jurisprudence ou doctrine absente de la SOURCE (ex: n'ajoute pas de droit suisse si le document traite de droit romain, français ou international).
3. Si une information n'est pas présente ou ne peut pas être déduite avec certitude, écris : "Non précisé dans le support".
4. Ne fabrique jamais un article, un arrêt, une date, une citation ou un auteur.
5. Distingue ce que le support affirme de ce qui relève d'une déduction logique.
6. Conserve les termes latins, les articles et les citations exactement tels qu'ils apparaissent dans la SOURCE.`;

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
 * Appel sécurisé via le proxy backend/Cloudflare (Évite d'exposer la clé au client)
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
        payload: {
          ...payload,
          systemInstruction: UNIVERSAL_LEGAL_SYSTEM_PROMPT,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? 'Erreur du service IA via le proxy.');
    }

    return data.result;
  } catch (err) {
    console.error("Erreur critique d'appel IA:", err);
    throw err;
  }
}

/**
 * Synthèse fidèle et structurée
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

  return callLawstudiesAI('generate_summary', { prompt, isJsonResponse: false });
}

/**
 * Génération de flashcards avec traçabilité par page et catégories
 */
export async function generateAIFlashcards(
  text: string,
  options: { count?: number; difficulty?: 'mixed' | 'basic' | 'intermediate' | 'advanced' } = {}
): Promise<GeneratedFlashcard[]> {
  const sourceContext = buildSourceContext({ text, sourceType: 'support de cours' });
  
  const prompt = `Génère des flashcards universitaires à partir de la SOURCE.
PARAMÈTRES :
- Nombre cible : ${options.count ?? 'adaptatif'}
- Difficulté : ${options.difficulty ?? 'mixed'}

RÈGLES :
1. Une carte = une seule idée vérifiable.
2. Ne crée aucune carte dont la réponse n'est pas soutenue par la SOURCE (pas d'extrapolation).
3. Indique les numéros de pages sources concernés ([PAGE X]) dans le tableau.

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
  return Array.isArray(rawResult) ? rawResult : [];
}

/**
 * Fiche d'arrêt universelle (Indépendante du droit suisse)
 */
export async function generateCaseLaw(text: string): Promise<CaseLawAnalysis> {
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

  return callLawstudiesAI('generate_case_law', { prompt, isJsonResponse: true });
}

/**
 * Subsomption juridique rigoureuse basée sur les faits et règles de la source
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
 * Examen blanc ancré dans le contenu réel du support
 */
export async function generateMockExam(input: {
  courseTitle: string;
  sourceText?: string;
  difficulty?: 'intermediate' | 'advanced';
  durationMinutes?: number;
}): Promise<any> {
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
  "title": "",
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

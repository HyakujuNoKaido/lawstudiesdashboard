import * as pdfjsLib from 'pdfjs-dist';

// Configuration du Worker PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Extraction améliorée et structurée du texte PDF avec repérage des pages
 */
export async function extractTextFromPDF(fileUrl: string, startPage = 1, endPage?: number): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      url: fileUrl,
      useWorkerFetch: true,
      isEvalSupported: true,
    });
    const pdf = await loadingTask.promise;
    const firstPage = Math.max(1, startPage);
    const lastPage = Math.min(endPage ?? pdf.numPages, pdf.numPages);
    
    let fullText = '';
    for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ');
      fullText += `[PAGE ${pageNumber}]\n${pageText}\n\n`;
    }
    return fullText.trim();
  } catch (error) {
    console.error("Erreur d'extraction PDF:", error);
    throw new Error("Impossible de lire le document PDF.");
  }
}

/**
 * Prompt système universel et strict (Empêche l'IA d'inventer ou de plaquer du droit suisse par défaut)
 */
const UNIVERSAL_LEGAL_SYSTEM_PROMPT = `Tu es un assistant académique juridique de niveau universitaire. 
Ta mission est d'analyser des supports de cours, textes doctrinaux et documents pédagogiques dans tous les domaines du droit.

RÈGLE ABSOLUE DE FIDÉLITÉ :
1. Utilise en priorité et explicitement le contenu de la SOURCE fournie.
2. N'ajoute aucune règle, référence légale, jurisprudence ou doctrine absente de la SOURCE (ex: n'ajoute pas d'articles du CO ou du CC s'ils ne figurent pas dans le texte).
3. Si une information n'est pas présente ou ne peut pas être déduite avec certitude, écris : "Non précisé dans le support".
4. Ne fabrique jamais un article, un arrêt, une date, une citation ou un auteur.
5. Distingue ce que le support affirme de ce qui relève d'une déduction logique.
6. Ne suppose pas par défaut qu'il s'agit du droit suisse si le document concerne un autre système (ex: droit romain).
7. Conserve les termes latins et les citations exactement tels qu'ils apparaissent dans la SOURCE.`;

/**
 * Construit un contexte structuré pour isoler les métadonnées du contenu brut
 */
function buildSourceContext(text: string, sourceType = 'support de cours') {
  return `[METADONNEES]
Type de source : ${sourceType}
[SOURCE À ANALYSER]
${text}
[FIN DE LA SOURCE]`;
}

/**
 * Cœur de l'appel API sécurisé par header (Clé AQ.)
 */
async function callLawstudiesAI(
  prompt: string, 
  isJsonResponse: boolean = false
): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API manquante.");

  const MODEL_NAME = 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: UNIVERSAL_LEGAL_SYSTEM_PROMPT }] },
    generationConfig: {
      temperature: 0.1, // Rigueur maximale pour éliminer les hallucinations
      responseMimeType: isJsonResponse ? "application/json" : "text/plain",
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey 
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Erreur Lawstudies AI (${response.status}): ${data.error?.message}`);
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error("Réponse vide de l'IA.");

    if (isJsonResponse) {
      let cleanResult = resultText.trim();
      if (cleanResult.startsWith("```json")) cleanResult = cleanResult.slice(7);
      if (cleanResult.startsWith("```")) cleanResult = cleanResult.slice(3);
      if (cleanResult.endsWith("```")) cleanResult = cleanResult.slice(0, -3);
      return JSON.parse(cleanResult.trim());
    }

    return resultText;
  } catch (err) {
    console.error("Erreur critique:", err);
    throw err;
  }
}

/**
 * Résumé fidèle et structuré sans ajouts externes non sollicités
 */
export async function generateAISummary(text: string): Promise<string> {
  const sourceContext = buildSourceContext(text);
  const prompt = `Analyse la SOURCE ci-dessous et rédige une synthèse structurée pour des révisions d'examen universitaire.

EXIGENCES :
1. Couvre toutes les parties substantielles de la SOURCE.
2. Restitue fidèlement les définitions, structures et notions présentes (ex: notions de structure patriarcale, statuts, esclavage, travail, etc., selon ce que contient le texte).
3. N’ajoute aucune référence légale ou jurisprudentielle (comme des articles de code moderne) si elles ne figurent pas explicitement dans la SOURCE.
4. Si une information importante manque, indique explicitement : "Non précisé dans le support."
5. Termine par une section "Points à retenir pour l’examen" strictement fondée sur le support.

${sourceContext}`;

  return callLawstudiesAI(prompt, false);
}

/**
 * Génération de flashcards strictement ancrées dans la source
 */
export async function generateAIFlashcards(text: string) {
  const sourceContext = buildSourceContext(text);
  const prompt = `Génère des flashcards universitaires rigoureuses basées EXCLUSIVEMENT sur la SOURCE.

RÈGLES :
1. Une carte = une seule idée vérifiable.
2. Ne crée aucune carte dont la réponse n'est pas soutenue par la SOURCE.
3. N'ajoute pas de connaissances externes ou d'articles de lois absents du texte.
4. Crée des cartes variées (définitions, distinctions, conditions, listes).

Retourne uniquement un tableau JSON valide au format strict :
[
  {
    "question": "...",
    "answer": "..."
  }
]

${sourceContext}`;

  return callLawstudiesAI(prompt, true);
}

export async function generateCaseLaw(text: string): Promise<any> {
  const sourceContext = buildSourceContext(text, 'arrêt ou décision judiciaire');
  const prompt = `Réalise une fiche d’arrêt à partir de la SOURCE uniquement. Si une information (juridiction, citation, faits) est absente, écris "Non précisé dans le support". Ne l'invente pas.

Retourne uniquement un objet JSON valide :
{
  "title": "",
  "atf_citation": "",
  "facts": "",
  "procedure": "",
  "legal_issues": "",
  "holding": ""
}

${sourceContext}`;

  return callLawstudiesAI(prompt, true);
}

export async function generateSubsumption(text: string): Promise<any> {
  const sourceContext = buildSourceContext(text, 'cas pratique');
  const prompt = `Effectue une subsomption juridique basée sur les règles et les faits présents dans la SOURCE. Ne forge pas de bases légales absentes.

Format JSON strict : 
{ 
  "legal_issue": "...", 
  "major_premise": "...", 
  "minor_premise": "...", 
  "conclusion": "..." 
}

${sourceContext}`;

  return callLawstudiesAI(prompt, true);
}

export async function generateMockExam(courseTitle: string): Promise<any> {
  const prompt = `Génère un cas pratique d'examen universitaire pour le cours : ${courseTitle}.
Format JSON strict : 
{ 
  "title": "...", 
  "facts": "...", 
  "questions": ["..."], 
  "solution_guidelines": "..." 
}`;

  return callLawstudiesAI(prompt, true);
}

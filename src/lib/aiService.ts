import * as pdfjsLib from 'pdfjs-dist';

// Configuration du Worker PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Extrait et nettoie le texte du PDF
 */
export async function extractTextFromPDF(fileUrl: string, startPage?: number, endPage?: number): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument(fileUrl);
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    const start = startPage && startPage > 0 ? startPage : 1;
    const end = endPage && endPage <= pdf.numPages ? endPage : pdf.numPages;

    for (let i = start; i <= end; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' '); // Nettoie les espaces multiples
      fullText += `[Page ${i}]\n${pageText}\n\n`;
    }
    return fullText.trim();
  } catch (error) {
    console.error("Erreur d'extraction PDF:", error);
    throw new Error("Erreur lors de la lecture du document juridique.");
  }
}

/**
 * Cœur de l'appel API avec authentification par Header et modèle récent
 */
async function callLawstudiesAI(
  prompt: string, 
  isJsonResponse: boolean = false,
  systemInstruction: string = "Tu es un expert en droit suisse (avocat/professeur). Réponds avec précision en utilisant la terminologie juridique suisse (CO, CC, CP, LTF, etc.)."): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API introuvable.");

  const MODEL_NAME = 'gemini-2.0-flash'; // Modèle moderne et supporté
  const API_VERSION = 'v1beta';

  // URL SANS la clé en paramètre (la clé passe dans les headers)
  const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${MODEL_NAME}:generateContent`;
  
  const payload: any = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.2, // Rigueur juridique accrue
      topP: 0.8,
    }
  };

  if (isJsonResponse) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey // Authentification par header pour les clés format AQ.
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Détails erreur API Google:", data);
      throw new Error(`Erreur API Gemini (${response.status}): ${data.error?.message || 'Inconnue'}`);
    }

    const result = data.candidates[0].content.parts[0].text;
    
    if (isJsonResponse) {
      let cleanResult = result.trim();
      if (cleanResult.startsWith("```json")) cleanResult = cleanResult.slice(7);
      if (cleanResult.startsWith("```")) cleanResult = cleanResult.slice(3);
      if (cleanResult.endsWith("```")) cleanResult = cleanResult.slice(0, -3);
      return JSON.parse(cleanResult.trim());
    }

    return result;
  } catch (err) {
    console.error("Erreur critique Lawstudies AI:", err);
    throw err;
  }
}

/**
 * Génère des Flashcards basées sur le droit suisse
 */
export async function generateAIFlashcards(text: string) {
  const prompt = `Génère des flashcards de révision à partir de ce texte juridique. 
Renvoie UNIQUEMENT un tableau JSON valide au format strict : [{"question": "...", "answer": "..."}]. Pas de texte additionnel, pas de markdown autour, juste le JSON brut.
Texte : ${text.substring(0, 35000)}`;

  return callLawstudiesAI(prompt, true);
}

/**
 * Résumé juridique structuré
 */
export async function generateAISummary(text: string): Promise<string> {
  const prompt = `Fais un résumé structuré en Markdown de ce texte juridique. 
Utilise les sections suivantes : 
- **En bref** (2 phrases)
- **Faits pertinents**
- **Points de droit analysés**
- **Conclusion/Décision**

Texte : ${text.substring(0, 35000)}`;

  return callLawstudiesAI(prompt, false);
}

/**
 * Analyse d'arrêt (Case Law) complète
 */
export async function generateCaseLaw(text: string): Promise<any> {
  const prompt = `Analyse cet arrêt de manière structurée.
Renvoie UNIQUEMENT un objet JSON valide au format strict avec ces clés : 
{
  "title": "Nom de l'affaire ou résumé court",
  "atf_citation": "Référence (ex: ATF 145 III 1)",
  "facts": "Résumé des faits",
  "procedure": "Historique procédural",
  "legal_issues": "Questions de droit soulevées",
  "consideranda": "Principaux considérants",
  "holding": "Décision finale"
}
Texte : ${text.substring(0, 30000)}`;

  return callLawstudiesAI(prompt, true);
}

/**
 * Méthode de la Subsomption (Syllogisme Juridique)
 */
export async function generateSubsumption(text: string): Promise<any> {
  const prompt = `Applique la méthode de la subsomption (syllogisme juridique) sur ce cas.
Renvoie UNIQUEMENT un objet JSON valide au format strict avec ces clés :
{
  "legal_issue": "La question litigieuse",
  "major_premise": "La règle de droit applicable (Majeure)",
  "minor_premise": "L'application aux faits (Mineure)",
  "conclusion": "La solution juridique"
}
Texte : ${text.substring(0, 30000)}`;

  return callLawstudiesAI(prompt, true, "Tu es un assistant spécialisé dans la méthodologie juridique suisse.");
}

/**
 * Génère un examen blanc basé sur un titre de cours
 */
export async function generateMockExam(courseTitle: string): Promise<any> {
  const prompt = `Génère un cas pratique d'examen pour le cours : ${courseTitle}.
Le cas doit inclure un état de fait complexe et une solution détaillée basée sur le droit suisse.
Renvoie UNIQUEMENT un objet JSON valide au format strict : { "title": "...", "facts": "...", "questions": ["..."], "solution_guidelines": "..." }`;

  return callLawstudiesAI(prompt, true);
}

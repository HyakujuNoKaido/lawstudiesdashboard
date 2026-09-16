import * as pdfjsLib from 'pdfjs-dist';

// Configuration du Worker PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Extraction du texte PDF
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
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `[Page ${i}] ${pageText}\n\n`;
    }
    return fullText.trim();
  } catch (error) {
    console.error("Erreur PDF:", error);
    throw new Error("Impossible de lire le document PDF.");
  }
}

/**
 * Appel à l'API Lawstudies (Gemini Flash)
 */
async function callLawstudiesAI(
  prompt: string, 
  isJsonResponse: boolean = false,
  systemInstruction: string = "Tu es un expert en droit suisse (juriste/avocat). Réponds avec une terminologie juridique précise (CO, CC, LTF, etc.)."): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API manquante.");

  const MODEL_NAME = 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.1, // Très bas pour la rigueur juridique
      responseMimeType: isJsonResponse ? "application/json" : "text/plain",
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey // Format requis pour les clés AQ...
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Erreur Lawstudies AI (${response.status}): ${data.error?.message}`);
    }

    const resultText = data.candidates[0].content.parts[0].text;
    return isJsonResponse ? JSON.parse(resultText) : resultText;
  } catch (err) {
    console.error("Erreur critique:", err);
    throw err;
  }
}

/**
 * Fonctions métiers pour Lawstudies
 */
export async function generateAISummary(text: string): Promise<string> {
  const prompt = `Résume ce texte juridique suisse de manière concise et structurée :\n\n${text.substring(0, 35000)}`;
  return callLawstudiesAI(prompt, false);
}

export async function generateAIFlashcards(text: string) {
  const prompt = `Génère des flashcards (Question/Réponse) sur les points clés de ce texte. 
Format JSON : [{"question": "...", "answer": "..."}]
Texte : ${text.substring(0, 30000)}`;
  return callLawstudiesAI(prompt, true);
}

export async function generateCaseLaw(text: string): Promise<any> {
  const prompt = `Analyse cet arrêt selon le format suivant (JSON) : 
{
  "title": "Titre",
  "atf_citation": "Référence ATF",
  "facts": "Faits résumés",
  "legal_issues": "Questions de droit",
  "holding": "Décision"
}
Texte : ${text.substring(0, 30000)}`;
  return callLawstudiesAI(prompt, true);
}

export async function generateSubsumption(text: string): Promise<any> {
  const prompt = `Effectue une subsomption juridique sur ce cas.
Format JSON : { "legal_issue": "...", "major_premise": "...", "minor_premise": "...", "conclusion": "..." }
Texte : ${text.substring(0, 30000)}`;
  return callLawstudiesAI(prompt, true, "Tu es un expert en méthodologie juridique suisse.");
}

export async function generateMockExam(courseTitle: string): Promise<any> {
  const prompt = `Génère un cas pratique d'examen pour le cours : ${courseTitle}.
Le cas doit inclure un état de fait complexe et une solution détaillée basée sur le droit suisse.
Format JSON : { "title": "...", "facts": "...", "questions": ["..."], "solution_guidelines": "..." }`;
  return callLawstudiesAI(prompt, true);
}

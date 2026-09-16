import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

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
      fullText += pageText + '\n\n';
    }
    return fullText;
  } catch (error) {
    console.error("Erreur d'extraction PDF:", error);
    throw new Error("Impossible d'extraire le texte du PDF.");
  }
}

async function callGeminiKeyAuthorized(payload: any, retries = 4, delay = 3000): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API Gemini introuvable.");
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        return await response.json();
      }
      const errText = await response.text();
      if (response.status === 503 && i < retries - 1) {
        console.warn(`Modèle surchargé (503). Nouvelle tentative (${i + 1}/${retries - 1}) dans ${(delay * (i + 1)) / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw new Error(`Erreur API Gemini (${response.status}): ${errText}`);
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("Le serveur Gemini est fortement sollicité. Veuillez patienter quelques secondes et relancer la génération.");
}

// NOUVEAU : Retourne uniquement les données JSON, sans les sauvegarder !
export async function generateAIFlashcards(text: string) {
  const prompt = `Tu es un assistant de faculté de droit en Suisse. Génère une liste de flashcards de révision basées sur le texte juridique ci-dessous. 
Renvoie UNIQUEMENT un tableau JSON valide au format strict : [{"question": "...", "answer": "..."}]. Pas de texte additionnel, pas de markdown autour, juste le JSON brut.
Texte :
${text.substring(0, 30000)}`;
  const data = await callGeminiKeyAuthorized({
    contents: [{ parts: [{ text: prompt }] }]
  });
  let rawText = data.candidates[0].content.parts[0].text.trim();
  if (rawText.startsWith('```json')) {
    rawText = rawText.replace(/^

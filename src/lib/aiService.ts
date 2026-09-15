import * as pdfjsLib from 'pdfjs-dist';
import { createFlashcard } from './supabaseService';
import { SOLO_USER_ID } from '../lib/constants';

// Configuration du Worker PDF.js pour lire les fichiers directement dans le navigateur
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Récupération de la clé depuis Cloudflare (Vite injecte le préfixe VITE_)
const getApiKey = () => import.meta.env.GEMINI_API_KEY;

/**
 * 1. EXTRACTION DU TEXTE D'UN PDF (Avec ciblage des pages)
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
      fullText += pageText + '\n\n';
    }

    return fullText;
  } catch (error) {
    console.error("Erreur d'extraction PDF:", error);
    throw new Error("Impossible d'extraire le texte du PDF.");
  }
}

/**
 * 2. GÉNÉRATION DE FLASHCARDS AVEC GEMINI (Sortie JSON garantie)
 */
export async function generateAIFlashcards(text: string, courseId: string, chapterId?: string) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API Gemini introuvable dans Cloudflare.");

  const systemPrompt = `Tu es un assistant de faculté de droit en Suisse. Ton but est de créer des flashcards de révision (Système Leitner/SM-2) à partir du texte fourni.
Règles strictes :
1. Identifie les concepts clés, les conditions cumulatives/alternatives d'un article, et la jurisprudence (ATF).
2. Les questions doivent être courtes et précises (ex: "Quelles sont les 4 conditions de la responsabilité aquilienne (art. 41 CO) ?").
3. Les réponses doivent être structurées et concises.`;

  // Utilisation de Gemini 1.5 Flash
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: `Génère une liste de flashcards à partir de ce texte :\n\n${text.substring(0, 60000)}` }] }],
      generationConfig: {
        temperature: 0.2,
        // On force Gemini à répondre uniquement avec un JSON valide
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              answer: { type: "STRING" }
            },
            required: ["question", "answer"]
          }
        }
      }
    })
  });

  if (!response.ok) throw new Error("Erreur lors de l'appel à Gemini.");

  const data = await response.json();
  const jsonString = data.candidates[0].content.parts[0].text;
  const flashcardsData = JSON.parse(jsonString);

  // Insertion en base via Supabase
  for (const card of flashcardsData) {
    await createFlashcard({
      course_id: courseId,
      chapter_id: chapterId || null,
      question: card.question,
      answer: card.answer
    });
  }

  return flashcardsData.length;
}

/**
 * 3. RÉSUMÉ ANALYTIQUE AVEC GEMINI
 */
export async function generateAISummary(text: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API Gemini introuvable.");

  const systemPrompt = `Tu es un juriste suisse. Résume le texte juridique fourni.
S'il s'agit d'un arrêt (ATF), structure ta réponse en : 1. Faits, 2. Droit (Majeure/Mineure), 3. Conclusion.
S'il s'agit d'un support de cours, fais une synthèse avec des bullet points.
Mets toujours les articles de lois et les numéros d'arrêts en **gras**. Utilise le format Markdown.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: `Voici le texte à résumer :\n\n${text.substring(0, 60000)}` }] }],
      generationConfig: { temperature: 0.3 }
    })
  });

  if (!response.ok) throw new Error("Erreur lors de l'appel à Gemini.");

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

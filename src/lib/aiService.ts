import * as pdfjsLib from 'pdfjs-dist';
import { createFlashcard } from '../services/supabaseService';

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

export async function generateAIFlashcards(text: string, courseId: string, chapterId?: string) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API Gemini introuvable.");

  const systemPrompt = `Tu es un assistant de faculté de droit en Suisse. Crée des flashcards de révision (SM-2).`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: `Génère une liste de flashcards JSON à partir de ce texte :\n\n${text.substring(0, 60000)}` }] }],
      generationConfig: {
        temperature: 0.2,
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
  const flashcardsData = JSON.parse(data.candidates[0].content.parts[0].text);

  for (const card of flashcardsData) {
    await createFlashcard({
      course_id: courseId,
      chapter_id: chapterId ? chapterId : undefined,
      front: card.question,
      back: card.answer
    });
  }
  return flashcardsData.length;
}

export async function generateAISummary(text: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API Gemini introuvable.");
  const systemPrompt = `Tu es un juriste suisse. Résume le texte juridique fourni en Markdown.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: text.substring(0, 60000) }] }],
      generationConfig: { temperature: 0.3 }
    })
  });
  if (!response.ok) throw new Error("Erreur lors de l'appel à Gemini.");
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

export async function generateCaseLaw(text: string): Promise<any> {
  const summary = await generateAISummary(text);
  return {
    title: "Arrêt analysé par l'IA",
    atf_citation: "ATF non spécifié",
    facts: summary,
    procedure: "Procédure standard",
    legal_issues: "Problématique juridique",
    consideranda: "Considérants clés",
    holding: "Dispositif"
  };
}

export async function generateSubsumption(text: string): Promise<any> {
  const summary = await generateAISummary(text);
  return {
    legal_issue: "Question juridique du cas",
    major_premise: "Base légale applicable",
    minor_premise: "Application aux faits",
    conclusion: "Solution juridique"
  };
}

export async function generateMockExam(courseTitle: string): Promise<any> {
  return {
    title: `Examen blanc : ${courseTitle}`,
    facts: "Faits de l'examen simulé...",
    legal_issue: "Questions à résoudre",
    major_premise: "Règles applicables",
    minor_premise: "Subsumption",
    conclusion: "Solution"
  };
}

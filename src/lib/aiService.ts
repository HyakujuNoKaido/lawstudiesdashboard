import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../lib/supabase';
import { createFlashcard } from './supabaseService';

// Configuration du Worker PDF.js pour lire les fichiers dans le navigateur
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// En production, il vaut mieux passer par une Edge Function (Supabase) pour cacher la clé API.
// Pour l'instant, on utilise une variable d'environnement ou le localStorage.
const getApiKey = () => import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('OPENAI_API_KEY');

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
 * 2. GÉNÉRATION DE FLASHCARDS (Prompt Droit Suisse -> JSON)
 */
export async function generateAIFlashcards(text: string, courseId: string, chapterId?: string) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API OpenAI introuvable.");

  // Prompt calibré pour les examens suisses
  const systemPrompt = `Tu es un assistant de faculté de droit en Suisse. Ton but est de créer des flashcards de révision (Système Leitner/SM-2) à partir du texte fourni.
  Règles strictes :
  1. Identifie les concepts clés, les conditions cumulatives/alternatives d'un article, et la jurisprudence (ATF).
  2. Les questions doivent être courtes et précises (ex: "Quelles sont les 4 conditions de la responsabilité aquilienne (art. 41 CO) ?").
  3. Les réponses doivent être structurées et concises.
  4. TU DOIS renvoyer UNIQUEMENT un tableau JSON valide avec ce format exact : [{"question": "...", "answer": "..."}]. Pas de markdown autour.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // GPT-4o-mini est parfait, rapide et pas cher pour ça
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Voici le texte à analyser (limité aux éléments essentiels) :\n\n${text.substring(0, 15000)}` }
      ],
      temperature: 0.3 // Faible température pour éviter les hallucinations juridiques
    })
  });

  if (!response.ok) throw new Error("Erreur lors de l'appel à l'IA.");

  const data = await response.json();
  let jsonString = data.choices[0].message.content.trim();
  
  // Nettoyage au cas où l'IA mettrait des balises markdown ```json
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
  }

  const flashcardsData = JSON.parse(jsonString);

  // Insérer chaque flashcard dans Supabase
  for (const card of flashcardsData) {
    await createFlashcard({
      course_id: courseId,
      chapter_id: chapterId || null,
      question: card.question,
      answer: card.answer
    });
  }

  return flashcardsData.length; // Retourne le nombre de cartes créées
}

/**
 * 3. RÉSUMÉ ANALYTIQUE DE TEXTE OU D'ARRÊT
 */
export async function generateAISummary(text: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API OpenAI introuvable.");

  const systemPrompt = `Tu es un juriste suisse. Résume le texte juridique fourni.
  S'il s'agit d'un arrêt (ATF), structure ta réponse en : 1. Faits, 2. Droit (Majeure/Mineure), 3. Conclusion.
  S'il s'agit d'un support de cours, fais une synthèse avec des bullet points.
  Mets toujours les articles de lois et les numéros d'arrêts en **gras**.
  Utilise le format Markdown.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text.substring(0, 15000) }
      ],
      temperature: 0.4
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

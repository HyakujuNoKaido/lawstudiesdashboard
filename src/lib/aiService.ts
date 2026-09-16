import * as pdfjsLib from 'pdfjs-dist';

// Configuration du Worker PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Extraction et nettoyage rigoureux du texte PDF
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
 * Cœur de l'appel API avec configuration avancée pour le droit suisse
 */
async function callLawstudiesAI(
  prompt: string, 
  isJsonResponse: boolean = false,
  systemInstruction: string = "Tu es un professeur de droit rigoureux et un expert en méthodologie juridique suisse. Tes synthèses et flashcards doivent être d'un niveau universitaire irréprochable, intégrant les bases légales (CO, CC, CP, etc.), la jurisprudence (ATF), la doctrine et des distinctions conceptuelles strictes."): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API manquante.");

  const MODEL_NAME = 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.1, // Rigueur maximale pour éviter toute approximation
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

    const resultText = data.candidates[0].content.parts[0].text;
    return isJsonResponse ? JSON.parse(resultText) : resultText;
  } catch (err) {
    console.error("Erreur critique:", err);
    throw err;
  }
}

/**
 * Génération d'un résumé exhaustif orienté examens (universel et rigoureux)
 */
export async function generateAISummary(text: string): Promise<string> {
  const prompt = `Rédige un résumé juridique extrêmement détaillé, structuré et rigoureux destiné à des révisions d'examen universitaire en droit. 

Exigences de fond obligatoires :
1. **Définitions et qualifications précises** : Définis rigoureusement les notions juridiques clés abordées dans le texte en utilisant la terminologie doctrinale et légale suisse exacte.
2. **Distinctions et conditions** : Mets en évidence les conditions d'application (cumulatives/alternatives), les distinctions dogmatiques importantes et les exceptions.
3. **Bases légales et jurisprudentielles** : Mets en valeur les articles de loi pertinents (ex: CO, CC, CP, etc.) et les arrêts de principe ou de référence mentionnés.
4. **Structure claire** : Organise la matière de manière logique (problématique, cadre légal, conditions, effets/conséquences, exceptions).

Texte source :
${text.substring(0, 35000)}`;

  return callLawstudiesAI(prompt, false);
}

/**
 * Génération de flashcards pointues axées sur les examens de droit (universel)
 */
export async function generateAIFlashcards(text: string) {
  const prompt = `Génère des flashcards de révision d'examen de droit extrêmement rigoureuses et précises à partir de ce texte. 
Chaque flashcard doit cibler un concept juridique pointu, une définition légale ou doctrinale exacte, une condition d'application d'une norme, ou une distinction institutionnelle/systémique importante (évite les questions trop vagues).

Format JSON strict requis : [{"question": "...", "answer": "..."}]
Texte source : ${text.substring(0, 30000)}`;

  return callLawstudiesAI(prompt, true);
}

export async function generateCaseLaw(text: string): Promise<any> {
  const prompt = `Analyse cet arrêt selon le format rigoureux exigé en faculté de droit (JSON) : 
{
  "title": "Titre de l'affaire",
  "atf_citation": "Référence ATF précise",
  "facts": "Résumé exhaustif des faits pertinents",
  "legal_issues": "Problématiques juridiques soulevées",
  "holding": "Solution et considérants clés de la décision"
}
Texte : ${text.substring(0, 30000)}`;

  return callLawstudiesAI(prompt, true);
}

export async function generateSubsumption(text: string): Promise<any> {
  const prompt = `Effectue une subsomption juridique rigoureuse (syllogisme) sur ce cas.
Format JSON strict : 
{ 
  "legal_issue": "Question de droit", 
  "major_premise": "Règle de droit applicable / Base légale (Majeure)", 
  "minor_premise": "Application des faits aux conditions légales (Mineure)", 
  "conclusion": "Solution juridique" 
}
Texte : ${text.substring(0, 30000)}`;

  return callLawstudiesAI(prompt, true, "Tu es un expert en méthodologie juridique suisse et en subsomption.");
}

export async function generateMockExam(courseTitle: string): Promise<any> {
  const prompt = `Génère un cas pratique d'examen stimulant pour le cours de droit : ${courseTitle}.
Le cas doit inclure un état de fait complexe comportant plusieurs qualifications juridiques délicates et une solution détaillée ancrée dans le droit suisse.
Format JSON : { "title": "...", "facts": "...", "questions": ["..."], "solution_guidelines": "..." }`;

  return callLawstudiesAI(prompt, true);
}

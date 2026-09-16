
const UNIVERSAL_LEGAL_SYSTEM_PROMPT = `Tu es un assistant académique juridique de niveau universitaire. 
Ta mission est d'analyser des supports de cours, textes doctrinaux, articles de loi et décisions judiciaires dans tous les domaines du droit.

RÈGLE ABSOLUE DE FIDÉLITÉ :
1. Utilise en priorité et explicitement le contenu de la SOURCE.
2. N'ajoute aucune règle, référence légale, jurisprudence ou doctrine absente de la SOURCE (ex: n'ajoute pas de droit suisse si le document traite de droit romain, français ou international).
3. Si une information n'est pas présente ou ne peut pas être déduite avec certitude, écris : "Non précisé dans le support".
4. Ne fabrique jamais un article, un arrêt, une date, une citation ou un auteur.
5. Distingue ce que le support affirme de ce qui relève d'une déduction logique.
6. Conserve les termes latins, les articles et les citations exactement tels qu'ils apparaissent dans la SOURCE.`;

const ALLOWED_ACTIONS = new Set([
  'generate_summary',
  'generate_flashcards',
  'generate_case_law',
  'generate_subsumption',
  'generate_mock_exam',
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Ou ton domaine de production si restreint
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-goog-api-key',
};

export async function onRequest(context: { request: Request; env: { GEMINI_API_KEY?: string } }) {
  // 1. Gestion des requêtes preflight CORS (OPTIONS)
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 2. Restriction de la méthode HTTP
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Clé API Gemini non configurée dans l'environnement serveur." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await context.request.json() as { 
      action?: string; 
      payload?: { prompt?: string; isJsonResponse?: boolean } 
    };
    
    const { action, payload } = body;

    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ error: "Action IA non reconnue." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payload?.prompt) {
      return new Response(JSON.stringify({ error: "Prompt manquant dans la charge utile." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Modèle principal stable (avec possibilité de repli si nécessaire)
    const MODEL_NAME = 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

    const geminiPayload = {
      contents: [{ parts: [{ text: payload.prompt }] }],
      systemInstruction: { parts: [{ text: UNIVERSAL_LEGAL_SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.1,
        responseMimeType: payload.isJsonResponse ? "application/json" : "text/plain",
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(geminiPayload),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message ?? "Erreur de l'API Gemini." }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText === undefined || rawText === null) {
      return new Response(JSON.stringify({ error: "Réponse vide de l'IA." }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: any = rawText;
    if (payload.isJsonResponse) {
      let clean = rawText.trim();
      if (clean.startsWith("```json")) clean = clean.slice(7);
      if (clean.startsWith("```")) clean = clean.slice(3);
      if (clean.endsWith("```")) clean = clean.slice(0, -3);
      try {
        result = JSON.parse(clean.trim());
      } catch (parseErr) {
        console.error("Erreur de parsing JSON de la réponse IA :", clean);
        throw new Error("L'IA a renvoyé un format JSON invalide.");
      }
    }

    // Contrat de réponse unifié attendu par le frontend
    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Erreur interne du proxy." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

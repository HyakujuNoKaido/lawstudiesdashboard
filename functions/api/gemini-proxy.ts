
export async function onRequest(context: { request: Request; env: { GEMINI_API_KEY: string } }) {
  // Gestion CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { action, payload } = await context.request.json();
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Clé API Gemini manquante dans les secrets Cloudflare.");

    let prompt = "";

    if (action === 'generate_case_law') {
      prompt = `
        Tu es un juriste suisse expert, assistant un étudiant en droit.
        Analyse et résume la jurisprudence suivante : ${payload.citation}.
        Renvoie une synthèse claire, académique et structurée.
        IMPORTANT : Tu dois renvoyer UNIQUEMENT un objet JSON valide avec ces clés exactes :
        {
          "title": "Intitulé officiel de l'arrêt (ex: ATF 143 III 416 - Nom usuel si existant)",
          "facts": "Résumé des faits pertinents",
          "procedure": "Historique de la procédure (instances cantonales et recours)",
          "consideranda": "Les considérants principaux et l'argumentation du Tribunal fédéral",
          "holding": "Le dispositif / La conclusion"
        }
      `;
    } else if (action === 'generate_subsumption') {
      prompt = `
        Tu es un juriste suisse. Résous ce cas pratique en appliquant la méthode du syllogisme juridique (Subsumption).
        Faits de l'espèce : ${payload.facts}
        IMPORTANT : Tu dois renvoyer UNIQUEMENT un objet JSON valide avec ces clés exactes :
        {
          "major_premise": "Règle de droit applicable (Majeure)",
          "minor_premise": "Application aux faits (Mineure)",
          "conclusion": "Conclusion juridique du cas"
        }
      `;
    } else if (action === 'generate_mock_exam') {
      prompt = `
        Tu es un professeur de droit en Suisse. Rédige un cas pratique d'examen de niveau universitaire sur le thème suivant : ${payload.topic}.
        IMPORTANT : Tu dois renvoyer UNIQUEMENT un objet JSON valide avec ces clés exactes :
        {
          "facts": "L'énoncé complet et détaillé des faits de l'espèce.",
          "legal_issue": "La question de droit précise à résoudre."
        }
      `;
    } else {
      throw new Error("Action non reconnue.");
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Erreur Gemini: ${errText}`);
    }

    const data = await geminiResponse.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    const jsonResult = JSON.parse(textResponse);

    return new Response(JSON.stringify(jsonResult), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 400,
    });
  }
}

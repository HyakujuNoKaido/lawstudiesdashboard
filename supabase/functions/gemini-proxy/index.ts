// supabase/functions/gemini-proxy/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer la requête CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json();
    
    // Récupération de la clé secrète depuis l'environnement Supabase
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("Clé API Gemini manquante côté serveur.");

    let prompt = "";

    // 1. Prompt pour les Fiches d'Arrêt (ATF)
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
    } 
    // 2. Prompt pour les Cas Pratiques / Subsumption
    else if (action === 'generate_subsumption') {
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
    } else {
      throw new Error("Action non reconnue.");
    }

    // Appel direct à l'API Gemini 1.5 Flash (rapide et excellent pour ce type de tâche)
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // On force Gemini à répondre exclusivement en JSON ! (Très puissant)
        generationConfig: {
          response_mime_type: "application/json",
        }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error("Erreur de l'API Gemini");
    }

    const data = await geminiResponse.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Le texte renvoyé est déjà garanti comme étant un JSON valide grâce au response_mime_type
    const jsonResult = JSON.parse(textResponse);

    return new Response(JSON.stringify(jsonResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})

export async function onRequest(context: { request: Request; env: { GEMINI_API_KEY: string } }) {
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
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Clé API Gemini manquante." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    let prompt = "";

    if (action === 'generate_case_law') {
      prompt = `
        Tu es un Docteur en droit suisse, Professeur ordinaire à l'Université et ancien greffier au Tribunal fédéral (TF). Ton niveau d'analyse est celui du plus grand expert juridique possible.
        Ta mission est de décortiquer l'arrêt suivant : ${payload.citation}.
        
        ATTENTES STRICTES :
        - Le vocabulaire doit être techniquement irréprochable (maxime des débats, arbitraire, cognition, griefs, effet dévolutif, etc.).
        - La "Partie en droit" doit restituer le raisonnement syllogistique complet du TF.
        - Tu dois citer avec une précision absolue les articles de loi (ex: art. 97 al. 1 LTF, art. 8 CC) et la jurisprudence antérieure (ATF de référence) mentionnés par le TF.
        
        Tu dois renvoyer UNIQUEMENT un objet JSON valide avec ces clés exactes :
        {
          "title": "Intitulé officiel et complet de l'arrêt (ex: ATF 145 III 365 ou 4A_123/2023) - avec un titre thématique très court.",
          "facts": "Faits (Sachverhalt) : Restitution factuelle exhaustive, pertinente pour le droit. Identifie les parties (sans les nommer explicitement si anonymisées) et le litige de base.",
          "procedure": "Historique procédural (Prozessgeschichte) : Résumé des instances cantonales, type de recours au TF (ex: Recours en matière civile, pénale, constitutionnelle) et conclusions du recourant.",
          "legal_issues": "Questions de droit (Rechtsfragen) : Énumération claire et numérotée des problèmes juridiques exacts (ex: 1. Violation de l'art. 9 Cst. par appréciation arbitraire des preuves. 2. Application de l'art. x CO).",
          "consideranda": "Partie en Droit / Considérants (Erwägungen) : C'EST LE CŒUR DE TON ANALYSE. Développe le raisonnement du TF avec une rigueur de thèse de doctorat. Sépare bien l'examen de la recevabilité (si pertinent), la règle de droit posée (Majeure avec rappel de la jurisprudence/doctrine) et l'application au cas d'espèce (Mineure). Inclus toutes les références légales et jurisprudentielles clés.",
          "holding": "Dispositif (Dispositiv) : Le prononcé exact du Tribunal fédéral (admission, rejet, irrecevabilité, renvoi, frais).",
          "pedagogical_takeaway": "Portée doctrinale et apprentissage (Bedeutung) : Une critique ou analyse de l'arrêt. Confirme-t-il une jurisprudence constante ? Constitue-t-il un revirement ? Quelle est la nuance dogmatique majeure que l'étudiant doit absolument retenir pour ses examens ?"
        }
      `;
    } else if (action === 'generate_subsumption') {
      prompt = `
        Tu es un Professeur de droit suisse, expert en méthodologie juridique.
        Résous ce cas pratique avec un syllogisme juridique d'une rigueur absolue : ${payload.facts}
        
        Tu dois renvoyer UNIQUEMENT un objet JSON valide avec ces clés exactes :
        {
          "major_premise": "Majeure (Règle de droit) : Expose exhaustivement les dispositions légales applicables, les conditions (cumulatives/alternatives) requises, ainsi que l'interprétation issue de la jurisprudence (ATF pertinents) et de la doctrine dominante.",
          "minor_premise": "Mineure (Subsomption) : Applique de manière chirurgicale, condition par condition, la règle aux faits de l'espèce. Discute les points tangents et les potentiels arguments contraires.",
          "conclusion": "Conclusion : Conséquence juridique définitive et univoque."
        }
      `;
    } else if (action === 'generate_mock_exam') {
      // Prompt pour les examens gardé intact mais élevé en standard
      prompt = `
        Tu es un professeur de droit dans une faculté suisse. Rédige un cas d'examen universitaire complexe sur : ${payload.topic}.
        IMPORTANT : Tu dois renvoyer UNIQUEMENT un objet JSON valide avec ces clés : {"facts": "...", "legal_issue": "..."}
      `;
    } else {
      throw new Error("Action non reconnue.");
    }

    const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let geminiResponse: Response | null = null;
    let lastErrorText = "";

    for (const model of modelsToTry) {
      try {
        geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" }
          })
        });
        if (geminiResponse.ok) break;
        else lastErrorText = await geminiResponse.text();
      } catch (err: any) {
        lastErrorText = err.message;
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      throw new Error(`Erreur API: ${lastErrorText}`);
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

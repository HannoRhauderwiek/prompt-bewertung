import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// CORS headers for Notion embedding
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-Frame-Options': 'ALLOWALL',
  'Content-Security-Policy': "frame-ancestors *"
};

// Master prompt for Claude Haiku
const SYSTEM_PROMPT = `Du bist ein Prompt-Gutachter für Schüler. Bewerte den gegebenen Schüler-Prompt nach der gewählten Strategie.

WICHTIG: Antworte NUR mit einem JSON-Objekt, keine weiteren Erklärungen oder Kommentare.

Strategien:
1. beginner_3w (Anfänger - Die 3 W-Fragen):
   - Was will ich? (Ziel muss klar sein)
   - Wie soll es sein? (mindestens 1 konkrete Vorgabe: Stil/Ton/Länge/Format)
   - Warum brauche ich es? (Anlass/Zweck in 1-2 Sätzen)
   Bewertung: Einfacher, fokussiert auf Grundlagen, vollständige Sätze und Höflichkeit

2. intermediate_kaf (Mittelstufe - Kontext + Aufgabe + Format):
   - Kontext: Wer/für wen/welche Situation
   - Aufgabe: präzise Handlungsanweisung mit überprüfbaren Erwartungen
   - Format: Struktur, Länge, Ton, ggf. Bulletpoints/Absätze
   Bewertung: Strenger, erwartet Zielgruppe, Längenangabe, klaren Ton

Allgemeine Kriterien:
- Klarheit & Präzision
- Ausreichende Details
- Ziel-/Adressatenbezug
- Messbare Erwartungen
- Struktur & Lesbarkeit
- Freundlicher Ton
- Keine Widersprüche

Labels für Segmente:
- GOOD: grün - Gut formuliert
- MISSING_DETAIL: rot - Fehlende wichtige Details
- UNCLEAR: gelb - Unklar formuliert
- TOO_VAGUE: orange - Zu vage/allgemein
- OFF_TOPIC: grau - Thema verfehlt
- TONE_ISSUE: lila - Ton-Problem

Ausgabeformat (JSON):
{
  "overall_score": [0-100],
  "segments": [
    {
      "text": "Originaler Textteil unverändert",
      "label": "LABEL_NAME"
    }
  ],
  "problems": ["Kurze Problembeschreibung 1", "Problem 2", ...],
  "tips": ["Imperativ-Tipp 1 (max 20 Wörter)", "Tipp 2", ...(3-5 Tipps)],
  "improved_prompt": "Kompletter verbesserter Prompt nach gewählter Strategie",
  "rubric_scores": {
    "clarity": [0-25],
    "structure": [0-25],
    "task_specificity": [0-25],
    "audience_tone": [0-25]
  }
}

Regeln:
1. Segmentiere den Originaltext in sinnvolle Teile (Sätze/Teilsätze)
2. Jedes Segment erhält genau ein Label
3. Text in Segmenten NIEMALS verändern, exakt wie im Original
4. Tipps kurz und konkret im Imperativ (z.B. "Gib eine Länge an, z.B. 120-150 Wörter")
5. Verbesserter Prompt sofort nutzbar, nach gewählter Strategie strukturiert
6. Bei Anfänger-Strategie: einfachere Bewertung, bei Mittelstufe: strengere Bewertung`;

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeaders(corsHeaders).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).setHeaders(corsHeaders).json({ 
      error: 'Nur POST-Anfragen erlaubt' 
    });
  }

  try {
    const { student_prompt, strategy } = req.body;

    // Validate input
    if (!student_prompt || typeof student_prompt !== 'string') {
      return res.status(400).setHeaders(corsHeaders).json({ 
        error: 'Kein gültiger Prompt angegeben' 
      });
    }

    if (!strategy || !['beginner_3w', 'intermediate_kaf'].includes(strategy)) {
      return res.status(400).setHeaders(corsHeaders).json({ 
        error: 'Ungültige Strategie gewählt' 
      });
    }

    if (student_prompt.length < 10) {
      return res.status(400).setHeaders(corsHeaders).json({ 
        error: 'Prompt ist zu kurz (mindestens 10 Zeichen)' 
      });
    }

    if (student_prompt.length > 2000) {
      return res.status(400).setHeaders(corsHeaders).json({ 
        error: 'Prompt ist zu lang (maximal 2000 Zeichen)' 
      });
    }

    // Create user message
    const userMessage = `
Bewerte folgenden Schüler-Prompt mit der Strategie "${strategy}":

"${student_prompt}"

Antworte NUR mit dem JSON-Objekt wie im System-Prompt beschrieben.`;

    // Call Claude API
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20250107',
      max_tokens: 1500,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    // Extract JSON from response
    let responseText = completion.content[0].text;
    
    // Try to extract JSON if wrapped in markdown
    if (responseText.includes('```json')) {
      responseText = responseText.split('```json')[1].split('```')[0];
    } else if (responseText.includes('```')) {
      responseText = responseText.split('```')[1].split('```')[0];
    }

    // Parse JSON response
    let evaluation;
    try {
      evaluation = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', responseText);
      
      // Fallback response
      evaluation = {
        overall_score: 50,
        segments: [{
          text: student_prompt,
          label: "UNCLEAR"
        }],
        problems: ["Die Bewertung konnte nicht vollständig durchgeführt werden"],
        tips: [
          "Formuliere deinen Prompt klarer",
          "Füge mehr Details hinzu",
          "Strukturiere deine Anfrage besser"
        ],
        improved_prompt: student_prompt + " [Bitte manuell verbessern]",
        rubric_scores: {
          clarity: 12,
          structure: 12,
          task_specificity: 13,
          audience_tone: 13
        }
      };
    }

    // Validate response structure
    if (!evaluation.overall_score || !evaluation.segments || !evaluation.tips) {
      throw new Error('Unvollständige Antwort von der KI');
    }

    // Send response
    return res.status(200).setHeaders(corsHeaders).json(evaluation);

  } catch (error) {
    console.error('API Error:', error);

    // Determine error message
    let errorMessage = 'Es ist ein Fehler aufgetreten';
    
    if (error.message?.includes('rate_limit')) {
      errorMessage = 'Zu viele Anfragen. Bitte warte einen Moment.';
    } else if (error.message?.includes('api_key')) {
      errorMessage = 'API-Konfigurationsfehler. Bitte Administrator kontaktieren.';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Zeitüberschreitung. Bitte versuche es erneut.';
    }

    return res.status(500).setHeaders(corsHeaders).json({ 
      error: errorMessage 
    });
  }
}

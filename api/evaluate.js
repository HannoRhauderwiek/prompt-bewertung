// api/evaluate.js
// Einfache, robuste Serverless-Function (Vercel/Node) für Prompt-Bewertung über die Anthropic Messages API.
// - Keine Imports nötig (nutzt globales fetch in Node >=18)
// - CORS & Preflight
// - Saubere Validierung + verständliche Fehlermeldungen
// - JSON-only Antwort-Parsing (auch wenn die KI Code-Fences zurückgibt)

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest'; // bei Bedarf per Env-Var ändern

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'X-Frame-Options': 'ALLOWALL',
  'Content-Security-Policy': 'frame-ancestors *',
  'Content-Type': 'application/json; charset=utf-8',
};

function setCors(res) {
  for (const [k, v] of Object.entries(corsHeaders)) {
    try { res.setHeader(k, v); } catch {}
  }
}

// --- Bewertungs-Logik für die KI ---
const SYSTEM_PROMPT = `
Du bist ein strenger, hilfreicher Bewerter für deutschsprachige Schüler-Prompts.
Antworte **AUSSCHLIESSLICH** mit einem **gültigen JSON-Objekt** (keine Code-Blöcke, keine erklärenden Sätze).

Schema (alle Schlüssel exakt verwenden):
{
  "overall_score": number 0..100,
  "segments": [{ "text": string, "label": "GOOD" | "OK" | "UNCLEAR" | "OFF_TOPIC" }],
  "problems": string[],   // kurze Problem-Liste
  "tips": string[],       // konkrete, umsetzbare Tipps
  "improved_prompt": string, // verbesserte deutsche Version
  "rubric_scores": { "clarity": 0..25, "structure": 0..25, "task_specificity": 0..25, "audience_tone": 0..25 }
}

Bewertungsregeln:
- "overall_score" ist Summe der rubric_scores (0..100).
- "segments": Teile den Prompt in sinnvolle Abschnitte (max. 8), bewerte jeden mit einem Label.
- "improved_prompt": präzise, kurz, aktiv formuliert, alle nötigen Details; auf Deutsch.
- Keine zusätzlichen Felder, keine Erklärtexte, keinerlei Code-Fences.
`.trim();

// optionale Strategie-Beschreibungen, die in die Nutzeranfrage einfließen
const STRATEGIES = {
  beginner_3w: 'Nutze die 3W-Prüfung: Wer? Was? Warum? Fehlende W-Fragen mindern clarity/structure.',
  intermediate_kaf: 'Nutze KAF: Kontext → Aufgabe → Format (Kontext liefert Rahmen; Aufgabe ist die konkrete Anweisung; Format legt Struktur/Länge/Output fest).'
};

// ---- Hilfsfunktionen ----
async function readJsonBody(req) {
  // 1) Falls Vercel bereits geparst hat:
  if (req.body && typeof req.body === 'object') return req.body;

  // 2) Falls Body als String vorliegt:
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }

  // 3) Rohdaten einlesen:
  const raw = await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

function cleanJsonFromText(text) {
  if (!text || typeof text !== 'string') return '';
  let out = text.trim();

  // Falls mit ```json ... ``` oder ``` ... ``` umschlossen:
  if (out.includes('```json')) {
    out = out.split('```json')[1].split('```')[0];
  } else if (out.includes('```')) {
    const parts = out.split('```');
    if (parts.length >= 2) out = parts[1];
  }

  return out.trim();
}

function buildUserMessage(student_prompt, strategy) {
  const strategyLine = STRATEGIES[strategy] ? `Strategie: ${strategy} — ${STRATEGIES[strategy]}` : `Strategie: ${strategy}`;
  return [
    `Bewerte den folgenden Schüler-Prompt anhand der vorgegebenen Regeln.`,
    strategy ? strategyLine : '',
    '',
    'Gib AUSSCHLIESSLICH das JSON gemäß Schema zurück.',
    '',
    `PROMPT:`,
    student_prompt
  ].join('\n');
}

// ---- Haupt-Handler ----
module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    setCors(res);
    return res.status(405).json({ error: 'Nur POST-Anfragen erlaubt' });
  }

  try {
    // CORS vorab setzen, damit Browser das JSON lesen können
    setCors(res);

    const body = await readJsonBody(req);
    const student_prompt = (body && body.student_prompt) || '';
    const strategy = (body && body.strategy) || 'beginner_3w';

    // --- Validierung ---
    if (typeof student_prompt !== 'string' || student_prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Kein gültiger Prompt angegeben' });
    }
    if (student_prompt.length < 10) {
      return res.status(400).json({ error: 'Prompt ist zu kurz (mindestens 10 Zeichen)' });
    }
    if (student_prompt.length > 2000) {
      return res.status(400).json({ error: 'Prompt ist zu lang (maximal 2000 Zeichen)' });
    }
    if (!['beginner_3w', 'intermediate_kaf'].includes(strategy)) {
      return res.status(400).json({ error: 'Ungültige Strategie. Erlaubt: beginner_3w | intermediate_kaf' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Server: ANTHROPIC_API_KEY ist nicht gesetzt.' });
    }

    const userMessage = buildUserMessage(student_prompt, strategy);

    // --- Request an Anthropic Messages API ---
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    // HTTP-Fehler der API abfangen
    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => '');
      let reason = `Anthropic-API-Fehler (${apiRes.status})`;
      if (errText) {
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) reason = parsed.error.message;
        } catch {}
      }
      // Häufige Spezialfälle
      if (/model/i.test(reason) && /unknown|invalid/i.test(reason)) {
        reason += ' — Setze ANTHROPIC_MODEL oder verwende ein gültiges Modell.';
      }
      if (/api.?key/i.test(reason)) {
        reason += ' — Prüfe ANTHROPIC_API_KEY.';
      }
      return res.status(502).json({ error: reason });
    }

    const data = await apiRes.json();
    const text = data?.content?.[0]?.text || '';
    let jsonStr = cleanJsonFromText(text);

    let evaluation;
    try {
      evaluation = JSON.parse(jsonStr);
    } catch {
      // Fallback: minimale sinnvolle Struktur zurückgeben
      evaluation = {
        overall_score: 50,
        segments: [{ text: student_prompt, label: 'UNCLEAR' }],
        problems: ['Die Bewertung konnte nicht vollständig analysiert werden.'],
        tips: [
          'Formuliere klarer, was genau du brauchst.',
          'Füge wichtige Details (Ziel, Länge, Format) hinzu.',
          'Nutze kurze, prägnante Sätze.'
        ],
        improved_prompt: `${student_prompt} [Bitte weiter präzisieren]`,
        rubric_scores: { clarity: 12, structure: 12, task_specificity: 13, audience_tone: 13 }
      };
    }

    // Struktur prüfen (ohne "falsy"-Fallstricke bei 0)
    const ok =
      typeof evaluation.overall_score === 'number' &&
      evaluation &&
      Array.isArray(evaluation.segments) &&
      Array.isArray(evaluation.tips) &&
      evaluation.rubric_scores &&
      typeof evaluation.rubric_scores.clarity === 'number' &&
      typeof evaluation.rubric_scores.structure === 'number' &&
      typeof evaluation.rubric_scores.task_specificity === 'number' &&
      typeof evaluation.rubric_scores.audience_tone === 'number';

    if (!ok) {
      return res.status(500).json({ error: 'Unvollständige Antwort von der KI' });
    }

    return res.status(200).json(evaluation);
  } catch (error) {
    let msg = 'Es ist ein Fehler aufgetreten.';
    const txt = (error && (error.message || String(error))) || '';
    if (/rate[_\s-]?limit/i.test(txt)) msg = 'Zu viele Anfragen. Bitte kurz warten.';
    else if (/timeout|aborted|network/i.test(txt)) msg = 'Zeitüberschreitung/Netzwerkfehler. Bitte erneut versuchen.';
    else if (/api.?key|unauthorized|forbidden/i.test(txt)) msg = 'API-Konfiguration fehlerhaft. Bitte ANTHROPIC_API_KEY prüfen.';

    return res.status(500).json({ error: msg });
  }
};

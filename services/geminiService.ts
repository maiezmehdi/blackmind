// Text generation with an automatic fallback chain:
//   Gemini key 1 → key 2 → key 3 → Qwen (OpenAI-compatible).
// The first key/provider that answers wins; a quota/auth/error moves to the
// next. Gemini is preferred for quality; Qwen is the last-resort backup.

import { GoogleGenAI } from '@google/genai';

const GEMINI_KEYS = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean) as string[];
const GEMINI_MODEL = 'gemini-2.5-flash';

const QWEN_KEY = process.env.QWEN_API_KEY || '';
const QWEN_BASE = (process.env.QWEN_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
const QWEN_MODEL = process.env.QWEN_MODEL || 'openrouter/free';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

// Robustly pull a JSON object/array out of a model reply — tolerates code
// fences, <think> reasoning blocks, and prose around the JSON. Lets any free
// model (even reasoning ones) be used without breaking parsing.
export const extractJson = (s: string): string => {
  const noThink = String(s || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
  const noFence = noThink.replace(/```json/gi, '').replace(/```/g, '');
  const start = noFence.indexOf('{');
  const end = noFence.lastIndexOf('}');
  if (start >= 0 && end > start) return noFence.slice(start, end + 1);
  return noFence.trim();
};

// Free, keyless image generation (Pollinations / Flux). Renders directly in an
// <img>, so no billing is needed for course covers / illustrations.
export const freeImageUrl = (prompt: string, w = 1280, h = 720): string => {
  const clean = (prompt || 'abstract').replace(/\s+/g, ' ').trim().slice(0, 320);
  let seed = 0;
  for (let i = 0; i < clean.length; i++) seed = (seed * 31 + clean.charCodeAt(i)) >>> 0;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(clean)}?width=${w}&height=${h}&nologo=true&model=flux&seed=${seed}`;
};

async function callWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorString = typeof error === 'string' ? error : (error?.message || JSON.stringify(error || {}));

    const isRateLimit = errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('rate') || error?.status === 429;
    const isInternalError = error?.status === 500 || errorString.includes('500') || errorString.includes('overloaded');
    const isHardQuota = errorString.includes('"limit":0') || errorString.includes('limit: 0') || errorString.includes('free_tier') || errorString.includes('insufficient');

    if (retries > 0 && !isHardQuota && (isRateLimit || isInternalError)) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2 + Math.floor(Math.random() * 500));
    }
    throw error;
  }
}

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }

// Core call: POST to the OpenAI-compatible /chat/completions endpoint.
const qwenChat = async (messages: ChatMessage[], opts: { json?: boolean; maxTokens?: number; temperature?: number } = {}): Promise<string> => {
  return callWithRetry(async () => {
    const res = await fetch(`${QWEN_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${QWEN_KEY}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 4096,
        // No strict response_format: many free/router models reject it. JSON is
        // requested in the prompt and extracted robustly via extractJson().
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${body.slice(0, 500)}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || '';
  });
};

// One Gemini attempt with a specific key (no retry — a failure means try the
// next key/provider instead of hammering an exhausted one).
const geminiOnce = async (key: string, system: string, user: string, json: boolean): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: key });
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: user,
    config: {
      systemInstruction: system,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  });
  const text = res.text?.trim() || '';
  if (!text) throw new Error('empty response');
  return text;
};

// Unified text generation: try each Gemini key in order, then Qwen.
const generateText = async (system: string, user: string, opts: { json?: boolean; maxTokens?: number } = {}): Promise<string> => {
  let lastErr: any = new Error('No AI provider configured');
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      return await geminiOnce(GEMINI_KEYS[i], system, user, !!opts.json);
    } catch (e: any) {
      lastErr = e;
      console.warn(`[ai] Gemini key ${i + 1} failed, trying next:`, e?.message || e);
    }
  }
  if (QWEN_KEY) {
    try {
      return await qwenChat(
        [system ? { role: 'system', content: system } : null, { role: 'user', content: user }].filter(Boolean) as ChatMessage[],
        { json: opts.json, maxTokens: opts.maxTokens },
      );
    } catch (e: any) {
      lastErr = e;
      console.warn('[ai] Qwen fallback failed:', e?.message || e);
    }
  }
  throw lastErr;
};

export const generateCourseStructure = async (prompt: string, thinking: boolean = false, language: string = 'fr'): Promise<string> => {
  const systemInstruction = `
    Rôle : Tu es "Blackmind Architect".
    Style : Minimaliste, intelligent, précis, direct, légèrement provocateur. "No fluff".
    MISSION : Génère une structure JSON pour un cours complet. TOUT le contenu généré (titres, modules, leçons, textes, quiz) DOIT ETRE redigé dans la langue spécifiée: ${language}.

    IMPORTANT : STRUCTURE PÉDAGOGIQUE OBLIGATOIRE
    Le TOUT PREMIER bloc de la TOUTE PREMIÈRE leçon du premier module DOIT être un bloc de type "overview" contenant les métadonnées pédagogiques.

    NOUVEAUTÉ : Ajoute occasionnellement (1 à 2 par module) des blocs de type "insight". Ce sont des "AI Insight Tips" : des conseils profonds, des réflexions méta ou des raccourcis cognitifs basés sur l'IA concernant le sujet.

    Format du bloc "overview":
    {
      "id": "overview-1",
      "type": "overview",
      "value": {
        "moduleTitle": "[Titre du premier module]",
        "objectives": ["[Objectif 1]", "[Objectif 2]", "[Objectif 3]"],
        "duration": "[X] min",
        "level": "[Débutant / Intermédiaire / Avancé]",
        "prerequisites": ["[Prérequis 1]", "[Prérequis 2]"],
        "accessibility": {
          "simplified": true,
          "audio": true,
          "subtitles": true,
          "ar": true
        }
      }
    }

    Format du bloc "insight":
    {
      "id": "insight-x",
      "type": "insight",
      "value": {
        "title": "Le Hack de l'Architecte",
        "content": "Texte Markdown court et percutant..."
      }
    }

    SCHEMA JSON STRICT (réponds UNIQUEMENT avec ce JSON, sans texte autour) :
    {
      "commentary": "...",
      "suggestions": ["...", "...", "..."],
      "course": {
        "title": "...",
        "description": "...",
        "category": "...",
        "modules": [
          {
            "id": "m1",
            "title": "...",
            "lessons": [
              {
                "id": "l1",
                "title": "Introduction",
                "content": [
                  { "id": "overview-1", "type": "overview", "value": { ... } },
                  { "id": "b1", "type": "text", "value": "..." },
                  { "id": "i1", "type": "insight", "value": { ... } }
                ]
              }
            ]
          }
        ]
      }
    }
  `;

  try {
    return await generateText(
      systemInstruction,
      `Génère une structure de cours complète sur le sujet : "${prompt}". Réponds en JSON.`,
      { json: true, maxTokens: 8000 },
    );
  } catch (e: any) {
    console.error('[ai] Structure generation failed', e?.message || e);
    return JSON.stringify({
      commentary: 'Erreur de génération.',
      suggestions: ['Réessayer'],
      course: { title: 'Erreur', description: '', category: 'Erreur', modules: [] },
    });
  }
};

export const refineContent = async (text: string, action: string, thinking: boolean = false): Promise<string> => {
  try {
    return (await generateText(
      'Tu es un éditeur expert. Retourne UNIQUEMENT le résultat en Markdown, sans commentaire.',
      `${action}\n\n---\n${text}\n---`,
      { maxTokens: 3000 },
    )) || text;
  } catch {
    return text;
  }
};

export const generateAiBlock = async (type: string, prompt: string, options: any = {}): Promise<any> => {
  try {
    if (type === 'image') {
      // Free keyless image generation (works without any billed image quota).
      return freeImageUrl(prompt);
    }

    if (type === 'video') {
      return `https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0`;
    }

    if (type === 'quiz') {
      const raw = await generateText(
        'Tu génères des quiz pédagogiques. Réponds UNIQUEMENT en JSON.',
        `Génère un quiz (une question, 3-4 options, l'index de la bonne réponse) sur : "${prompt}". Format JSON: {"question": string, "options": string[], "correctAnswer": number}.`,
        { json: true, maxTokens: 800 },
      );
      return JSON.parse(extractJson(raw) || '{}');
    }

    if (type === 'exercise') {
      return await generateText('', `Crée un exercice pratique en Markdown sur : "${prompt}".`, { maxTokens: 1500 });
    }

    // default: rich text block
    return await generateText('', `Rédige un contenu de cours expert et clair en Markdown sur : "${prompt}".`, { maxTokens: 2000 });
  } catch (error: any) {
    console.error(`[ai] ${type} generation failed:`, error?.message || error);
    if (type === 'image') return freeImageUrl(prompt);
    return 'Contenu indisponible.';
  }
};

export const generateStorytellingStructure = async (prompt: string, thinking: boolean = false, language: string = 'fr'): Promise<string> => {
  const systemInstruction = `
    Role: You are an expert screenwriter and director.
    Task: Create a storytelling structure based on the prompt, written in language: ${language}.
    Respond ONLY with JSON in this format:
    {
      "title": "Story Title",
      "logline": "One sentence summary",
      "scenes": [
        {
          "id": "scene1",
          "title": "Scene 1: Introduction",
          "setting": "INT. COFFEE SHOP - DAY",
          "action": "Description of what happens.",
          "characters": ["Alice", "Bob"]
        }
      ]
    }
  `;
  try {
    return await generateText(systemInstruction, `${prompt}. Respond in JSON.`, { json: true, maxTokens: 6000 });
  } catch (error) {
    console.error('[ai] Error generating storytelling:', error);
    throw error;
  }
};

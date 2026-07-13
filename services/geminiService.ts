// Text generation with an automatic fallback chain:
//   Gemini key 1 → key 2 → key 3 → Qwen (OpenAI-compatible).
// The first key/provider that answers wins; a quota/auth/error moves to the
// next. Gemini is preferred for quality; Qwen is the last-resort backup.

import { GoogleGenAI, Modality } from '@google/genai';
import { InferenceClient } from '@huggingface/inference';

const GEMINI_KEYS = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean) as string[];
// gemini-2.5-flash is no longer offered to new API keys; 2.0-flash is broadly
// available and has a higher free daily quota (~200/day vs ~20).
const GEMINI_MODEL = 'gemini-2.0-flash';

// A key's free-tier text quota doesn't imply image quota — gemini-2.5-flash-image
// is a separate, often zero-quota metric on a plain free-tier key (confirmed via
// production 429s: "limit: 0, model: gemini-2.5-flash-preview-image" on keys that
// generate text fine). GEMINI_IMAGE_KEY is a dedicated key/project actually
// provisioned for image generation, tried first; the text keys remain as a
// fallback after it in case it also runs out.
const GEMINI_IMAGE_KEY = process.env.GEMINI_IMAGE_KEY || '';
const GEMINI_IMAGE_KEYS = [GEMINI_IMAGE_KEY, ...GEMINI_KEYS].filter((k, i, arr) => k && arr.indexOf(k) === i) as string[];

const QWEN_KEY = process.env.QWEN_API_KEY || '';
const QWEN_BASE = (process.env.QWEN_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
const QWEN_MODEL = process.env.QWEN_MODEL || 'openrouter/free';

const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY || '';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

// Fixes a couple of narrow, specifically-identified malformed-JSON patterns
// seen in real model output — never touches otherwise-valid JSON, so it's
// safe to always run before JSON.parse.
const repairJson = (s: string): string => s
  // Observed artifact: the key gets echoed as a string before its real
  // value, e.g. `"type": "type": "quiz"` — collapses to `"type": "quiz"`.
  .replace(/"(\w+)"\s*:\s*"\1"\s*:/g, '"$1":')
  // Trailing commas before a closing brace/bracket, which JSON.parse rejects
  // but which models produce constantly.
  .replace(/,(\s*[}\]])/g, '$1');

// Robustly pull a JSON object/array out of a model reply — tolerates code
// fences, <think> reasoning blocks, and prose around the JSON. Lets any free
// model (even reasoning ones) be used without breaking parsing.
export const extractJson = (s: string): string => {
  const noThink = String(s || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
  const noFence = noThink.replace(/```json/gi, '').replace(/```/g, '');
  const start = noFence.indexOf('{');
  const end = noFence.lastIndexOf('}');
  const sliced = start >= 0 && end > start ? noFence.slice(start, end + 1) : noFence.trim();
  return repairJson(sliced);
};

// Free, keyless image generation (Pollinations / Flux). Renders directly in an
// <img>, so no billing is needed for course covers / illustrations.
// negative: things Flux should avoid — Pollinations supports this natively,
// which is far more reliable than "no text" prose alone at keeping generated
// gibberish text/letters/watermarks out of the image.
const DEFAULT_NEGATIVE = 'text, words, letters, writing, caption, subtitle, watermark, logo, signature, typography, infographic, diagram, poster, book cover, labels, chart';
// Optional — Pollinations is called via a plain <img src>, not fetch(), so
// there's no way to send an Authorization header; the key is passed as a
// query param instead. Without it, requests are anonymous: rate-limited to
// 1/15s and nologo is silently ignored (watermark stays). With it, they're
// attributed to the account (higher limits, watermark actually removed).
const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY || '';
export const freeImageUrl = (prompt: string, w = 1280, h = 720, negative: string = DEFAULT_NEGATIVE): string => {
  const clean = (prompt || 'abstract').replace(/\s+/g, ' ').trim().slice(0, 320);
  let seed = 0;
  for (let i = 0; i < clean.length; i++) seed = (seed * 31 + clean.charCodeAt(i)) >>> 0;
  const params = new URLSearchParams({ width: String(w), height: String(h), nologo: 'true', model: 'flux', seed: String(seed) });
  if (negative) params.set('negative', negative);
  if (POLLINATIONS_KEY) params.set('key', POLLINATIONS_KEY);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(clean)}?${params.toString()}`;
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

// One Gemini image attempt with a specific key → data URL, or throws.
//
// "No text" alone is a weak instruction — models still reach for it when the
// SUBJECT implies a designed, labeled artifact (a "course cover" reads like a
// book cover; "marketing", "cognitive architecture" etc. read like diagrams
// with captions). Naming and ruling out those specific visual genres, and
// leading with the constraint instead of appending it as an afterthought,
// holds up meaningfully better than a single trailing "no text" clause.
const geminiImageOnce = async (key: string, prompt: string, aspectRatio: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: key });
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: `Generate a photographic or illustrative scene with ZERO text, letters, numbers, words, writing, captions, labels, watermark, logo, or typography of any kind, anywhere in the frame — not even stylized or partial lettering. This is NOT a poster, NOT a book/course cover, NOT an infographic, NOT a diagram or chart with labels. It is a plain visual scene, like a stock photo. Subject: ${prompt}. Professional, minimalist, modern aesthetic, clean composition, soft depth, cinematic lighting.`,
    config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio } },
  });
  for (const part of res.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  throw new Error('no image data');
};

// width/height pairs matching each Gemini-supported aspect ratio string, used
// for the Pollinations fallback (which takes pixels, not a ratio).
const ASPECT_DIMENSIONS: Record<string, [number, number]> = {
  '16:9': [1280, 720],
  '9:16': [720, 1280],
  '4:3': [1024, 768],
  '3:4': [768, 1024],
  '1:1': [1024, 1024],
};

const HF_KEY = process.env.HUGGINGFACE_API_KEY || '';
const HF_IMAGE_MODEL = 'black-forest-labs/FLUX.1-dev';
// hf-inference (HF's own CPU-oriented endpoint) no longer serves GPU
// text-to-image models — routing through it 410s. fal-ai runs FLUX.1-dev via
// an async queue (submit → poll → fetch result), which the official
// @huggingface/inference SDK handles for us; hand-rolling a single POST like
// the Gemini/HF-inference calls above doesn't work against a queue-based
// provider.
const hfClient = HF_KEY ? new InferenceClient(HF_KEY) : null;

// One Hugging Face Inference Providers (fal-ai) FLUX.1-dev attempt → data
// URL, or throws. outputType: 'dataUrl' makes the SDK return a self-contained
// data: URL directly (not a blob: URL) — courses persist block.value as a
// plain string in localStorage, and a blob: URL goes dead the moment the
// page reloads.
const hfFluxImageOnce = async (prompt: string, aspectRatio: string): Promise<string> => {
  const [width, height] = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['4:3'];
  return await hfClient!.textToImage(
    {
      model: HF_IMAGE_MODEL,
      provider: 'fal-ai',
      inputs: prompt,
      parameters: { width, height, negative_prompt: DEFAULT_NEGATIVE },
    },
    { outputType: 'dataUrl' },
  );
};

// Image: try the dedicated image key (if set) then each text key, then
// Hugging Face FLUX.1-dev if configured, then fall back to Pollinations.
// Forcing every image to the same aspect ratio regardless of context (a
// cover vs. a small in-lesson illustration) not only looks wrong once
// placed, it can visibly warp/compress the model's own generated content
// when the subject doesn't naturally suit that shape — so callers pass what
// they actually need.
export const generateImage = async (prompt: string, aspectRatio: string = '4:3'): Promise<string> => {
  for (let i = 0; i < GEMINI_IMAGE_KEYS.length; i++) {
    try {
      return await geminiImageOnce(GEMINI_IMAGE_KEYS[i], prompt, aspectRatio);
    } catch (e: any) {
      console.warn(`[ai] Gemini image key ${i + 1} failed, trying next:`, e?.message || e);
    }
  }
  if (HF_KEY) {
    try {
      return await hfFluxImageOnce(prompt, aspectRatio);
    } catch (e: any) {
      console.warn('[ai] Hugging Face FLUX.1-dev failed, falling back to Pollinations:', e?.message || e);
    }
  }
  const [w, h] = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['4:3'];
  return freeImageUrl(prompt, w, h);
};

// Finds a real, relevant YouTube video for a topic via the YouTube Data API v3
// (free daily quota). Returns an embeddable URL, or null if no key is set /
// the search fails / no results — callers fall back to a manual search link.
export const findYoutubeVideo = async (query: string): Promise<string | null> => {
  if (!YOUTUBE_KEY) return null;
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults: '1',
      safeSearch: 'strict',
      relevanceLanguage: 'fr',
      q: query,
      key: YOUTUBE_KEY,
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const videoId = data?.items?.[0]?.id?.videoId;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch (e: any) {
    console.warn('[ai] YouTube search failed:', e?.message || e);
    return null;
  }
};

// Some free-tier fallback models occasionally answer with a moderation /
// classification label instead of real content (e.g. "User Safety: safe")
// when they don't follow the system prompt well. Treat that as a failed
// attempt so the next provider in the chain gets tried, instead of
// surfacing that junk straight to the user.
const isUsableResponse = (text: string, expectJson: boolean): boolean => {
  const t = (text || '').trim();
  if (!t) return false;
  if (expectJson && !t.includes('{')) return false;
  if (/^(user safety|safety rating|content flagged|i cannot assist|i can't assist)/i.test(t)) return false;
  if (expectJson && t.length < 20) return false;
  return true;
};

// Unified text generation: try each Gemini key in order, then Qwen.
const generateText = async (system: string, user: string, opts: { json?: boolean; maxTokens?: number } = {}): Promise<string> => {
  let lastErr: any = new Error('No AI provider configured');
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const text = await geminiOnce(GEMINI_KEYS[i], system, user, !!opts.json);
      if (!isUsableResponse(text, !!opts.json)) throw new Error(`unusable response: ${text.slice(0, 80)}`);
      return text;
    } catch (e: any) {
      lastErr = e;
      console.warn(`[ai] Gemini key ${i + 1} failed, trying next:`, e?.message || e);
    }
  }
  if (QWEN_KEY) {
    try {
      const text = await qwenChat(
        [system ? { role: 'system', content: system } : null, { role: 'user', content: user }].filter(Boolean) as ChatMessage[],
        { json: opts.json, maxTokens: opts.maxTokens },
      );
      if (!isUsableResponse(text, !!opts.json)) throw new Error(`unusable response: ${text.slice(0, 80)}`);
      return text;
    } catch (e: any) {
      lastErr = e;
      console.warn('[ai] Qwen fallback failed:', e?.message || e);
    }
  }
  throw lastErr;
};

export const generateCourseStructure = async (
  prompt: string,
  history: ChatTurn[] = [],
  thinking: boolean = false,
  language: string = 'fr',
): Promise<string> => {
  const systemInstruction = `
    Rôle : Tu es "Blackmind Architect", l'assistant conversationnel qui aide l'auteur à concevoir son cours.
    Style : Minimaliste, intelligent, précis, direct, légèrement provocateur. "No fluff". Tu parles comme dans une vraie conversation qui continue, pas comme si chaque message repartait de zéro.
    Aucun cours n'existe encore : c'est la phase de conception, avant la génération.

    MISSION — décide d'abord si tu as assez d'informations pour générer un bon cours, ou s'il vaut mieux d'abord clarifier avec l'auteur :

    1. NE GÉNÈRE PAS ENCORE si le sujet n'est pas clair (salutation comme "salut"/"hi", message vague) OU si c'est le tout début d'une conversation sur un sujet réel mais sans précision sur le niveau, l'angle ou la profondeur souhaités. Dans ce cas :
       - Réponds avec chaleur et naturel dans "commentary" : accueille l'auteur / confirme le sujet, et pose 1 à 2 questions courtes et utiles (niveau visé, nombre de modules souhaité, angle particulier).
       - Propose 2 à 4 réponses rapides pertinentes dans "suggestions" (inclus toujours une option du type "Génère directement, choisis pour moi").
       - Renvoie "course": { "title": "Erreur", "description": "", "category": "Erreur", "modules": [] } (aucun cours n'est créé à cette étape).
    2. GÉNÈRE la structure complète si : l'auteur a déjà répondu à tes questions dans l'historique, OU a donné assez de détails dès le départ, OU demande explicitement de générer maintenant ("vas-y", "génère", "oui", "lance", "direct", "choisis pour moi", etc.).
    3. Ne repose jamais deux fois la même question : si l'historique montre que tu as déjà demandé des précisions, le prochain message doit déclencher la génération (sauf si l'auteur pose lui-même une nouvelle question).

    Quand tu génères : TOUT le contenu (titres, modules, leçons, textes, quiz) DOIT ETRE redigé dans la langue spécifiée: ${language}.

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

  const historyText = history
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Auteur' : 'Toi'} : ${m.content}`)
    .join('\n');

  const userPrompt = [
    historyText ? `Historique récent de la conversation :\n${historyText}` : null,
    `Dernier message de l'auteur : "${prompt}"`,
    `Réponds en JSON (structure complète si tu génères, ou question de clarification si tu préfères d'abord clarifier).`,
  ].filter(Boolean).join('\n\n');

  try {
    return await generateText(systemInstruction, userPrompt, { json: true, maxTokens: 8000 });
  } catch (e: any) {
    console.error('[ai] Structure generation failed', e?.message || e);
    return JSON.stringify({
      commentary: 'Erreur de génération.',
      suggestions: ['Réessayer'],
      course: { title: 'Erreur', description: '', category: 'Erreur', modules: [] },
    });
  }
};

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export const editCourseStructure = async (
  existingCourse: { title: string; description: string; category: string; modules: any[] },
  instruction: string,
  history: ChatTurn[] = [],
  thinking: boolean = false,
  language: string = 'fr',
): Promise<string> => {
  const systemInstruction = `
    Rôle : Tu es "Blackmind Architect", l'assistant conversationnel qui aide l'auteur à concevoir et faire évoluer son cours.
    Style : Minimaliste, intelligent, précis, direct, légèrement provocateur. "No fluff". Tu réponds comme dans une vraie conversation qui continue, pas comme si chaque message repartait de zéro.
    CONTEXTE : Tu reçois le cours EXISTANT (JSON), l'historique récent de la conversation, et le dernier message de l'auteur. Utilise l'historique pour comprendre les références implicites ("ça", "le module précédent", "plus court", "non plutôt...", "comme avant mais...").

    MISSION — décide d'abord ce que veut l'auteur avec son dernier message :
    1. S'il demande une modification du cours (ajouter/retirer/réécrire/réorganiser du contenu, changer le titre, ajuster le ton ou la longueur, etc.) → applique-la et renvoie le cours COMPLET mis à jour.
    2. S'il pose une question, fait un commentaire, ou discute sans demander de changement → réponds simplement dans "commentary" et renvoie le cours EXACTEMENT identique (aucune modification, mêmes "id").

    RÈGLES STRICTES (quand tu modifies) :
    - Ceci est une ÉDITION, pas une nouvelle création : ne repars jamais de zéro sur un autre sujet, sauf si l'auteur le demande explicitement.
    - Conserve tel quel tout le contenu existant qui n'est pas concerné par la demande (ne réécris pas des modules/leçons non mentionnés).
    - Conserve les "id" des modules/leçons/blocs existants inchangés.
    - Si la demande implique d'ajouter du contenu, ajoute-le à la suite avec de nouveaux "id" uniques (n'écrase pas l'existant).
    - Ne duplique jamais le bloc "overview" : il ne doit rester que dans la première leçon du premier module.
    - TOUT le contenu DOIT être rédigé dans la langue : ${language}.
    - "commentary" doit être une réponse conversationnelle courte et naturelle qui tient compte de l'historique (pas une phrase générique répétée à chaque fois).

    SCHEMA JSON STRICT (réponds UNIQUEMENT avec ce JSON, sans texte autour) :
    {
      "commentary": "Réponse conversationnelle courte, naturelle, qui tient compte du contexte.",
      "suggestions": ["...", "...", "..."],
      "course": {
        "title": "...",
        "description": "...",
        "category": "...",
        "modules": [ /* structure identique à celle du cours existant, mise à jour si besoin */ ]
      }
    }
  `;

  const historyText = history
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Auteur' : 'Toi'} : ${m.content}`)
    .join('\n');

  const userPrompt = [
    `Cours actuel (JSON) :\n${JSON.stringify(existingCourse)}`,
    historyText ? `Historique récent de la conversation :\n${historyText}` : null,
    `Dernier message de l'auteur : "${instruction}"`,
    `Réponds en JSON avec le cours complet (modifié si nécessaire, identique sinon).`,
  ].filter(Boolean).join('\n\n');

  try {
    return await generateText(systemInstruction, userPrompt, { json: true, maxTokens: 8000 });
  } catch (e: any) {
    console.error('[ai] Course edit failed', e?.message || e);
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
      // Gemini image (across the keys) → Hugging Face FLUX.1-dev if configured → free Pollinations fallback.
      return await generateImage(prompt, options.aspectRatio);
    }

    if (type === 'video') {
      const embedUrl = await findYoutubeVideo(prompt);
      // No key / no result → an honest fallback the UI renders as a
      // "search on YouTube" link, instead of a fake/unrelated embed.
      return embedUrl || { type: 'search-fallback', query: prompt };
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
    if (type === 'image') {
      const [w, h] = ASPECT_DIMENSIONS[options.aspectRatio] || ASPECT_DIMENSIONS['4:3'];
      return freeImageUrl(prompt, w, h);
    }
    if (type === 'video') return { type: 'search-fallback', query: prompt };
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

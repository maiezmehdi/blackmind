
import { GoogleGenAI, Type, Modality } from "@google/genai";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

async function callWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    let errorString = '';
    
    if (typeof error === 'string') {
      errorString = error;
    } else if (error instanceof Error) {
      errorString = error.message;
      try {
         const parsed = JSON.parse(error.message);
         if (parsed && typeof parsed === 'object') {
            errorString += JSON.stringify(parsed);
         }
      } catch (e) {}
    } else {
      errorString = JSON.stringify(error);
    }

    if (error?.error) {
      errorString += JSON.stringify(error.error);
    }

    const isRateLimit = 
      errorString.includes('429') || 
      errorString.includes('RESOURCE_EXHAUSTED') || 
      errorString.includes('quota') ||
      error?.status === 429 ||
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.error?.code === 429 ||
      error?.error?.status === 'RESOURCE_EXHAUSTED';

    const isInternalError =
      error?.status === 500 ||
      errorString.includes('500') ||
      errorString.includes('INTERNAL') ||
      errorString.includes('overloaded');

    // A hard quota (free tier has limit: 0 for a model) will never recover on
    // retry — fail fast instead of hammering the API and spamming the console.
    const isHardQuota =
      errorString.includes('"limit":0') ||
      errorString.includes('limit: 0') ||
      errorString.includes('free_tier');

    if (retries > 0 && !isHardQuota && (isRateLimit || isInternalError)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      const nextDelay = delay * 2 + Math.floor(Math.random() * 500);
      return callWithRetry(fn, retries - 1, nextDelay);
    }
    throw error;
  }
}

export const generateCourseStructure = async (prompt: string, thinking: boolean = false, language: string = "fr"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = thinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const config: any = {
    responseMimeType: "application/json",
  };

  if (thinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

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

    SCHEMA JSON STRICT :
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
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Génère une structure de cours complète sur le sujet : "${prompt}".`,
        config: {
          ...config,
          systemInstruction,
        },
      });
      return response.text || '';
    });
  } catch (e: any) {
    console.error("Structure generation failed", e);
    return JSON.stringify({ 
      commentary: "Erreur de génération.", 
      suggestions: ["Réessayer"], 
      course: { title: "Erreur", description: "", category: "Erreur", modules: [] } 
    });
  }
};

export const refineContent = async (text: string, action: string, thinking: boolean = false): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = thinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const fullPrompt = `${action}\n\n---\n${text}\n---\nRetourne uniquement le résultat en Markdown.`;
  const config: any = {};
  if (thinking) config.thinkingConfig = { thinkingBudget: 32768 };

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config
      });
      return response.text || text;
    });
  } catch (e) {
    return text;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    });
  } catch (error) {
    throw error;
  }
};

export const generateAiBlock = async (type: string, prompt: string, options: any = {}): Promise<any> => {
  const thinking = options.thinking || false;
  const textModel = thinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const textConfig: any = {};
  if (thinking) textConfig.thinkingConfig = { thinkingBudget: 32768 };

  try {
    return await callWithRetry(async () => {
      if (type === 'image') {
        const isHighRes = options.imageSize === '2K' || options.imageSize === '4K';
        const imageModel = isHighRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        // imageConfig only carries fields the model supports; imageSize is a
        // Pro-only option (sending it to the flash model 400s the request).
        const imageConfig: any = { aspectRatio: options.aspectRatio || '16:9' };
        if (isHighRes) imageConfig.imageSize = options.imageSize;

        const response = await ai.models.generateContent({
          model: imageModel,
          contents: `Professional educational illustration: ${prompt}. Minimalist, modern aesthetic. No text.`,
          config: {
            // Required for native image generation — without it the model
            // returns only text and no image data is produced.
            responseModalities: [Modality.IMAGE],
            imageConfig,
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        throw new Error('No image data');
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      if (type === 'video') {
        return `https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0`; 
      }

      if (type === 'quiz') {
        const response = await ai.models.generateContent({
          model: textModel,
          contents: `Génère un quiz sur : "${prompt}". JSON format strictly.`,
          config: {
            ...textConfig,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER }
              },
              required: ["question", "options", "correctAnswer"]
            }
          }
        });
        return JSON.parse(response.text || '{}');
      }

      if (type === 'exercise') {
        const response = await ai.models.generateContent({
          model: textModel,
          contents: `Crée un exercice pratique en Markdown sur : "${prompt}".`,
          config: textConfig
        });
        return response.text?.trim() || "";
      }

      const response = await ai.models.generateContent({
        model: textModel,
        contents: `Rédige un cours expert en Markdown sur : "${prompt}".`,
        config: textConfig
      });
      return response.text?.trim() || "";
    });
  } catch (error: any) {
    console.error(`[geminiService] ${type} generation failed:`, error?.message || error);
    if (type === 'image') return "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800";
    return "Contenu indisponible.";
  }
};

export const generateStorytellingStructure = async (prompt: string, thinking: boolean = false, language: string = "fr"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = thinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  const config: any = {
    responseMimeType: "application/json",
  };
  if (thinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const systemInstruction = `
    Role: You are an expert screenwriter and director.
    Task: Create a storytelling structure based on the prompt.
    Output JSON format:
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
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        ...config,
        systemInstruction,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating storytelling:", error);
    throw error;
  }
};

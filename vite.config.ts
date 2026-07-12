import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Text: 3 Gemini keys tried in order, then Qwen as last resort.
        // Accepts either clean names (GEMINI_API_KEY_1..3) or the short names
        // Gemini / Geminii / Geminiii.
        'process.env.GEMINI_KEY_1': JSON.stringify(env.GEMINI_API_KEY_1 || env.Gemini || ''),
        'process.env.GEMINI_KEY_2': JSON.stringify(env.GEMINI_API_KEY_2 || env.Geminii || ''),
        'process.env.GEMINI_KEY_3': JSON.stringify(env.GEMINI_API_KEY_3 || env.Geminiii || ''),
        // Qwen (OpenAI-compatible) — endpoint & model configurable.
        'process.env.QWEN_API_KEY': JSON.stringify(env.QWEN_API_KEY || ''),
        'process.env.QWEN_BASE_URL': JSON.stringify(env.QWEN_BASE_URL || 'https://openrouter.ai/api/v1'),
        'process.env.QWEN_MODEL': JSON.stringify(env.QWEN_MODEL || 'openrouter/free'),
        // Optional — enables real video search for the "Générer une Vidéo" block
        // (YouTube Data API v3, free quota). Without it, the video block falls
        // back to a manual "search on YouTube" link.
        'process.env.YOUTUBE_API_KEY': JSON.stringify(env.YOUTUBE_API_KEY || ''),
        // Optional — adds a second, higher-quality free image tier (Hugging Face
        // FLUX.1-dev via Inference Providers) between Gemini and the Pollinations
        // fallback. Without it, images skip straight from Gemini to Pollinations.
        'process.env.HUGGINGFACE_API_KEY': JSON.stringify(env.HUGGINGFACE_API_KEY || ''),
        // Optional — attributes the free keyless Pollinations fallback to a
        // Pollinations account (higher rate limit, watermark actually
        // removed). Sent as a URL query param, not a header, since
        // Pollinations is hit via <img src> to avoid needing a backend.
        'process.env.POLLINATIONS_API_KEY': JSON.stringify(env.POLLINATIONS_API_KEY || ''),
        // Optional — enables real Google Drive/Docs publishing (OAuth Client ID,
        // not a secret: safe to inline client-side). Without it, the Google
        // integration UI shows an honest "not configured" state.
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

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
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

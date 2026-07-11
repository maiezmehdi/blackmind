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
        // Qwen (OpenAI-compatible) — endpoint & model configurable so the same
        // code works with DashScope, OpenRouter or SiliconFlow.
        'process.env.QWEN_API_KEY': JSON.stringify(env.QWEN_API_KEY),
        'process.env.QWEN_BASE_URL': JSON.stringify(env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'),
        'process.env.QWEN_MODEL': JSON.stringify(env.QWEN_MODEL || 'qwen-plus'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

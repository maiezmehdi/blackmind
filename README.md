# Blackmind — AI Course Creator

Blackmind is an AI-powered online course creation platform with a modern
interface, built with React 19, TypeScript and Vite. It uses the Google
Gemini API to generate course content, supports French/English, and includes
a marketplace, workspaces, progress tracking and a live AI assistant.

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file (see `.env.example`) and set your Qwen API key:
   ```bash
   QWEN_API_KEY=your_qwen_api_key_here
   # optional: QWEN_BASE_URL / QWEN_MODEL to target OpenRouter or SiliconFlow
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs at http://localhost:3000

## Build

```bash
npm run build     # outputs static site to ./dist
npm run preview   # preview the production build locally
```

## Deploy to Vercel

The app is a static Vite SPA using `HashRouter`, so no server-side rewrites
are required.

1. Import the repository into Vercel. The Vite framework preset is detected
   automatically:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
2. Under **Project Settings → Environment Variables**, add:
   - `QWEN_API_KEY` = your Qwen API key
   - *(optional)* `QWEN_BASE_URL` / `QWEN_MODEL` to use OpenRouter or SiliconFlow
     instead of the default DashScope endpoint (see `.env.example`).
3. Deploy.

> Note: text generation uses Qwen (OpenAI-compatible API); images use the free
> Pollinations service; voice input and read-aloud use the browser's built-in
> Web Speech APIs — so the app runs with no billing.
>
> The Qwen key is inlined into the client bundle at build time, so it is visible
> to anyone who inspects the shipped JavaScript. Use a key that is
> restricted/limited accordingly, or move the calls behind a server function if
> you need to keep the key private.

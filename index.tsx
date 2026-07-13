
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// After a new deploy, a tab left open from before still holds JS that
// references the *previous* build's content-hashed chunk filenames (e.g.
// jspdf.es.min-<hash>.js). Those files no longer exist once Vercel serves
// the new deployment, so any dynamic import() for that chunk 404s with
// "Failed to fetch dynamically imported module". Vite's generated preload
// helper dispatches this event in exactly that case — reload once to pick
// up the current build's chunk map. Guarded by sessionStorage so a genuine
// network failure doesn't reload-loop forever.
window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('blackmind_reloaded_after_chunk_error')) {
    sessionStorage.setItem('blackmind_reloaded_after_chunk_error', '1');
    window.location.reload();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

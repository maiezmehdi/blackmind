// Generates an on-brand gradient cover as a data URL, unique per course title.
// Used as a fallback when AI image generation isn't available (e.g. Gemini
// free tier, which has a 0 quota for image models).

const PALETTES: string[][] = [
  ['#4f46e5', '#7c3aed', '#db2777'],
  ['#2563eb', '#4f46e5', '#7c3aed'],
  ['#0ea5e9', '#6366f1', '#a855f7'],
  ['#f59e0b', '#ec4899', '#8b5cf6'],
  ['#10b981', '#0ea5e9', '#6366f1'],
  ['#0f172a', '#4f46e5', '#7c3aed'],
  ['#e11d48', '#7c3aed', '#2563eb'],
];

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const makeGradientCover = (title: string): string => {
  const W = 1200, H = 675;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const h = hash(title || 'blackmind');
  const pal = PALETTES[h % PALETTES.length];
  const angle = (h % 360) * (Math.PI / 180);

  // base diagonal gradient
  const x2 = W * Math.cos(angle), y2 = H * Math.sin(angle);
  const g = ctx.createLinearGradient(0, 0, x2 || W, y2 || H);
  g.addColorStop(0, pal[0]);
  g.addColorStop(0.5, pal[1]);
  g.addColorStop(1, pal[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // soft light blobs for depth
  for (let i = 0; i < 3; i++) {
    const bx = (h >> (i * 5)) % W;
    const by = (h >> (i * 3)) % H;
    const r = 320 + ((h >> (i * 2)) % 260);
    const rg = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    rg.addColorStop(0, `rgba(255,255,255,${0.16 - i * 0.04})`);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }

  // subtle darken at the bottom for text legibility on cards
  const shade = ctx.createLinearGradient(0, H * 0.55, 0, H);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  return canvas.toDataURL('image/jpeg', 0.9);
};

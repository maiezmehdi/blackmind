import { slugify } from './exportService';

// Downloads a media URL (image, 3D model...) to the user's device.
// - data: URLs download directly.
// - Remote URLs are fetched as a blob so the browser saves a real file
//   instead of just navigating to it; on failure (CORS, network) we fall
//   back to opening the URL in a new tab so the user can save it manually.
export const downloadMedia = async (url: string, filename: string): Promise<void> => {
  if (!url) return;

  if (url.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// Builds a safe filename from a course/block label and extension.
export const mediaFilename = (label: string, ext: string): string => `${slugify(label)}.${ext}`;

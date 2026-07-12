// Client-only Google OAuth via Google Identity Services (GIS). This app has
// no backend, so a confidential-client / refresh-token flow isn't possible —
// access tokens are short-lived and held in memory only. A lightweight
// "was connected" flag + cached email are persisted so the UI can show a
// connected state across reloads and silently re-request a token on demand.
//
// Scope is deliberately minimal: drive.file (the app can only see files it
// creates/opens itself, never the user's whole Drive) + userinfo.email (just
// to show "connecté en tant que ..."). This keeps the app exempt from
// Google's stricter security review required for broader scopes.

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const CONNECTED_KEY = 'blackmind_google_connected';
const EMAIL_KEY = 'blackmind_google_email';

export const isGoogleConfigured = (): boolean => !!CLIENT_ID;

let gisLoadPromise: Promise<void> | null = null;
const loadGis = (): Promise<void> => {
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
};

let currentToken: { value: string; expiresAt: number } | null = null;

const requestToken = (prompt: '' | 'consent'): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) { resolve(null); return; }
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        prompt,
        callback: (resp: any) => {
          if (!resp || resp.error) {
            if (prompt === '') resolve(null); // silent renewal failing isn't fatal
            else reject(new Error(resp?.error || 'consent_failed'));
            return;
          }
          currentToken = { value: resp.access_token, expiresAt: Date.now() + (Number(resp.expires_in) || 3600) * 1000 - 30_000 };
          resolve(resp.access_token);
        },
      });
      client.requestAccessToken({ prompt });
    } catch (e) {
      reject(e);
    }
  });
};

export const isGoogleConnected = (): boolean => localStorage.getItem(CONNECTED_KEY) === 'true';
export const getGoogleEmail = (): string | null => localStorage.getItem(EMAIL_KEY);

// Interactive consent — must be called from a user gesture (click handler).
export const connectGoogle = async (): Promise<{ email: string | null }> => {
  if (!CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID not configured');
  await loadGis();
  const token = await requestToken('consent');
  if (!token) throw new Error('consent_denied');
  localStorage.setItem(CONNECTED_KEY, 'true');

  let email: string | null = null;
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      email = data.email || null;
      if (email) localStorage.setItem(EMAIL_KEY, email);
    }
  } catch {
    // Non-fatal — the Drive connection itself still succeeded.
  }
  return { email };
};

export const disconnectGoogle = (): void => {
  const token = currentToken?.value;
  currentToken = null;
  localStorage.removeItem(CONNECTED_KEY);
  localStorage.removeItem(EMAIL_KEY);
  if (token && (window as any).google?.accounts?.oauth2?.revoke) {
    (window as any).google.accounts.oauth2.revoke(token, () => {});
  }
};

// Returns a valid access token for an already-connected account, silently
// renewing it if expired. Returns null if never connected, not configured,
// or silent renewal needs a fresh interactive consent (caller should then
// prompt the user to reconnect via connectGoogle()).
export const getAccessToken = async (): Promise<string | null> => {
  if (!CLIENT_ID || !isGoogleConnected()) return null;
  if (currentToken && currentToken.expiresAt > Date.now()) return currentToken.value;
  await loadGis();
  try {
    return await requestToken('');
  } catch {
    return null;
  }
};

// Spotify OAuth PKCE flow — no backend needed
// Replace this with your Spotify Developer App Client ID
const CLIENT_ID = "6e241e6b6295492ca14cbbb054952e0e";
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = "streaming user-read-email user-read-playback-state user-modify-playback-state";

const TOKEN_KEY = "spotify_token";
const VERIFIER_KEY = "spotify_pkce_verifier";
const RETURN_PATH_KEY = "spotify_return_path";

export interface SpotifyToken {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix ms
}

// ─── Helpers ───

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
}

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ─── Public API ───

export async function loginWithSpotify(returnPath = "/") {
  const verifier = generateRandomString(64);
  localStorage.setItem(VERIFIER_KEY, verifier);
  localStorage.setItem(RETURN_PATH_KEY, returnPath);

  const challenge = base64url(await sha256(verifier));

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function handleCallback(code: string): Promise<string> {
  const verifier = localStorage.getItem(VERIFIER_KEY) || "";
  localStorage.removeItem(VERIFIER_KEY);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) throw new Error("Token exchange failed");

  const data = await res.json();
  const token: SpotifyToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));

  const returnPath = localStorage.getItem(RETURN_PATH_KEY) || "/";
  localStorage.removeItem(RETURN_PATH_KEY);
  return returnPath;
}

export function getToken(): SpotifyToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

export async function getAccessToken(): Promise<string | null> {
  let token = getToken();
  if (!token) return null;

  // Refresh if expiring within 60 s
  if (token.expires_at - Date.now() < 60_000) {
    token = await refreshToken(token);
    if (!token) return null;
  }
  return token.access_token;
}

async function refreshToken(token: SpotifyToken): Promise<SpotifyToken | null> {
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: token.refresh_token,
      }),
    });
    if (!res.ok) {
      logout();
      return null;
    }
    const data = await res.json();
    const updated: SpotifyToken = {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? token.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    logout();
    return null;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchSpotifyProfile(): Promise<{ display_name: string; product: string } | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;
  try {
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

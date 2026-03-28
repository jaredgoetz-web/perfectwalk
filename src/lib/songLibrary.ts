export interface Song {
  id: string;
  title: string;
  phaseId: number;
  audioSrc: string;
  duration?: string; // e.g. "4:32"
  spotifyTrackId?: string; // Spotify embed track ID
}

/** Extract Spotify track ID from a URL like https://open.spotify.com/track/XXXX?si=... */
export function parseSpotifyUrl(url: string): string | null {
  const match = url.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

const USER_SONGS_KEY = "perfectwalk_user_songs";

export function loadUserSongs(): Song[] {
  try {
    return JSON.parse(localStorage.getItem(USER_SONGS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveUserSong(song: Song) {
  const all = loadUserSongs();
  all.push(song);
  localStorage.setItem(USER_SONGS_KEY, JSON.stringify(all));
}

export function deleteUserSong(id: string) {
  const all = loadUserSongs().filter((s) => s.id !== id);
  localStorage.setItem(USER_SONGS_KEY, JSON.stringify(all));
}

export const songLibrary: Song[] = [
  // Phase 1 – Opening Your Heart
  { id: "p1-awaken-your-heart", title: "Awaken Your Heart", phaseId: 1, audioSrc: "/audio/phase-1-heart.mp3", duration: "5:00" },

  // Phase 2 – Feeling Your Power
  { id: "p2-twenty-feet-tall", title: "Twenty Feet Tall", phaseId: 2, audioSrc: "/audio/phase-2-twenty-feet-tall.mp3", duration: "5:00" },

  // Phase 3 – Letting Go
  { id: "p3-transformational-walk", title: "Transformational Walk", phaseId: 3, audioSrc: "/audio/phase-3-transformational-walk.mp3", duration: "5:00" },

  // Phase 4 – Connecting with Source
  { id: "p4-celestial-temple-path", title: "Celestial Temple Path", phaseId: 4, audioSrc: "/audio/phase-4-celestial-temple-path.mp3", duration: "5:00" },

  // Phase 5 – Celebration
  { id: "p5-path-of-quiet-glory", title: "Path of Quiet Glory", phaseId: 5, audioSrc: "/audio/phase-5-celebrate.mp3", duration: "5:00" },
  { id: "p5-sky-full-of-thank-you", title: "Sky Full of Thank You", phaseId: 5, audioSrc: "/audio/phase-5-sky-full-of-thank-you.mp3", duration: "5:00" },
];

export function getSongsByPhase(phaseId: number): Song[] {
  return songLibrary.filter((s) => s.phaseId === phaseId);
}

export interface CustomPlaylist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
}

const PLAYLISTS_KEY = "perfectwalk_playlists";

export function loadPlaylists(): CustomPlaylist[] {
  try {
    return JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function savePlaylist(playlist: CustomPlaylist) {
  const all = loadPlaylists();
  const idx = all.findIndex((p) => p.id === playlist.id);
  if (idx >= 0) all[idx] = playlist;
  else all.push(playlist);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(all));
}

export function deletePlaylist(id: string) {
  const all = loadPlaylists().filter((p) => p.id !== id);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(all));
}

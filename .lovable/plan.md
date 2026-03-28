

# Full Spotify Integration — OAuth + Web Playback SDK

## Overview
Add Spotify login so Premium users can play full tracks during walks, replacing the 30-second preview limitation. Free-tier users will see a message directing them to upgrade or use the embed fallback.

## What You'll Need
- A **Spotify Developer account** (free) at [developer.spotify.com](https://developer.spotify.com)
- Create an app to get a **Client ID** (public key, safe to store in code)
- Add your app's URL as a redirect URI in the Spotify dashboard (e.g. `https://perfectwalk.lovable.app/callback`)
- **No backend required** — uses PKCE auth flow (all client-side)

## Plan

### 1. Create Spotify auth service (`src/lib/spotifyAuth.ts`)
- PKCE OAuth flow: login, token storage in localStorage, token refresh, logout
- Scopes: `streaming`, `user-read-email`, `user-read-playback-state`
- Redirect URI handling

### 2. Create Spotify playback hook (`src/hooks/useSpotifyPlayer.ts`)
- Load Web Playback SDK script
- Initialize player, handle ready/not-ready events
- Expose `play(trackUri)`, `pause()`, `resume()`, `isReady` state
- Requires Premium — detect and surface error if free-tier

### 3. Create callback page (`src/pages/SpotifyCallback.tsx`)
- Exchange auth code for token after redirect
- Store token, redirect back to previous page

### 4. Add "Connect Spotify" UI to playlist/walk screens
- Button on the playlist picker screen to connect Spotify account
- Show connected state with user's Spotify display name
- Disconnect option

### 5. Update Walk page to use Web Playback SDK
- When Spotify is connected + Premium: play full tracks via SDK instead of embed iframe
- When not connected: keep current embed behavior (30s preview)
- Handle playback ended event for auto-advance to next phase

### 6. Update routing (`src/App.tsx`)
- Add `/callback` route for Spotify OAuth redirect

### Technical Details

**Auth flow**: Authorization Code with PKCE (no client secret needed). Token stored in localStorage with expiry tracking and automatic refresh.

**Playback**: The Web Playback SDK creates a virtual Spotify Connect device in the browser. We call the Spotify Web API `PUT /me/player/play` to start playback on that device. Track end is detected via the SDK's `player_state_changed` event.

**Fallback**: If user isn't logged into Spotify or isn't Premium, the current embed/preview behavior remains unchanged.

**Files created**: `src/lib/spotifyAuth.ts`, `src/hooks/useSpotifyPlayer.ts`, `src/pages/SpotifyCallback.tsx`
**Files modified**: `src/App.tsx`, `src/pages/Walk.tsx`, `src/pages/Playlists.tsx` (or walk picker)


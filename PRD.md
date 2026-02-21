# egert_amp — PRD

> Personal FLAC music player powered by Google Drive.
> Winamp soul, modern body.

## Problem

Spotify and Tidal subscriptions keep getting more expensive. You already own thousands of high-quality FLAC files on Google Drive. There's no lightweight, good-looking player that connects directly to Drive and lets you stream your own music — and share it with friends.

## Solution

**egert_amp** — a web-based FLAC player that reads directly from Google Drive. Dark, neon-accented Winamp-inspired UI with modern UX. Installable as a phone app (PWA). Friends can access your shared library with their Google account.

## Target Users

- **Primary:** You. Personal music library, daily driver.
- **Secondary:** 2-10 friends you share a Google Drive folder with.

## Core Concepts

- **Mobile-first** — the phone is the primary device. Every screen, every interaction is designed for one-handed thumb use first, then scaled up to tablet/desktop. Not "responsive" as an afterthought — mobile IS the design.
- **Google Drive IS the backend** — no database, no file uploads, no storage costs. Your Drive folders are your library.
- **FLAC-first** — lossless audio, native browser playback. (MP3/OGG/WAV support comes free with the `<audio>` element.)
- **Winamp x Modern** — dark interface, neon accents, spectrum visualizer, monospace type. But smooth, responsive, and mobile-friendly.
- **Zero cost** — free Google Drive API tier, free Vercel hosting, no subscriptions.

## Features

### Playback
- Play / pause / stop
- Next / previous track (swipe gesture on mobile, buttons on desktop)
- Seek bar (scrub through track — fat touch target on mobile)
- Volume control with mute toggle (hardware volume on mobile)
- Shuffle mode (random track order)
- Repeat modes (off / one track / entire playlist)
- Gapless or near-gapless playback (preload next track)
- Keyboard shortcuts on desktop (Space = play/pause, Arrow keys = skip/seek)
- Swipe gestures on mobile (swipe up = queue, swipe left/right = skip track)

### Library
- Browse Google Drive folders as albums/playlists
- Album grid view with cover art thumbnails (parsed from FLAC metadata)
- Track list view with artist, title, album, duration
- Search across all tracks (title, artist, album)
- Sort by name, artist, album, date added
- Folder-based organization (your Drive structure = your library structure)

### Metadata & Art
- Parse FLAC Vorbis comments: title, artist, album, track number, genre, year
- Extract embedded album art from FLAC files
- Display album art in library grid, now-playing view, and playlist
- Fallback placeholder for tracks without embedded art

### Audio Visualizer
- Real-time spectrum analyzer (Web Audio API)
- Classic bar-style frequency visualization
- Rendered in the now-playing view
- Neon glow aesthetic matching the UI theme

### Now Playing View
- Large album art (center stage)
- Track title, artist, album
- Seek bar with elapsed / remaining time
- Playback controls
- Spectrum visualizer
- Background: subtle blurred album art gradient or dark ambient

### Queue & Playlists
- "Up Next" queue — see what's coming, reorder tracks
- Play an album / folder as a playlist
- "Play All + Shuffle" for the entire library
- Persistent queue (survives page refresh via localStorage)

### Sharing (Friend Access)
- You share a Google Drive folder with friends' Gmail addresses
- Friends sign into egert_amp with their own Google account
- They see the shared folder contents, full player experience
- You control access from Google Drive sharing settings (add/remove anytime)

### PWA (Installable App)
- "Add to Home Screen" on Android / iOS
- Full-screen app experience, no browser chrome
- Background audio playback (keeps playing when app is minimized)
- Media Session API: lock screen controls, notification with album art
- Offline cache for recently played tracks (IndexedDB)

## UI / Visual Identity

**Theme:** Dark, neon-on-black, Winamp DNA with modern execution.

**Design approach:** Mobile-first. Design for a 390px-wide phone screen first, then enhance for larger screens. The phone experience is not a scaled-down desktop — it's the primary product.

- **Background:** Near-black (#0a0a0f) or very dark charcoal
- **Accent colors:** Neon green (#39ff14) as primary, with amber/cyan as secondary touches
- **Typography:** Monospace or semi-monospace for track info, timers, metadata. Clean sans-serif for navigation and labels.
- **Album art:** Prominent, with subtle neon border glow on hover/active
- **Progress bar / seek bar:** Neon-colored, glowing, animated. Tall touch target on mobile (min 44px).
- **Visualizer:** Green/cyan bars on dark background, classic Winamp bar style
- **Buttons/controls:** Minimal, icon-based. Min 44x44px touch targets on mobile. Glow-on-hover on desktop.
- **Layout:** Information-dense, compact — no wasted whitespace
- **Navigation (mobile):** Bottom tab bar (Library / Now Playing / Queue) — thumb-reachable, always visible. No hamburger menus.
- **Navigation (desktop):** Sidebar + persistent bottom player bar (Spotify-style layout).
- **Now Playing (mobile):** Full-screen takeover — large album art, controls at bottom within thumb reach, visualizer behind the art. Swipe down to minimize to mini-player.
- **Mini-player (mobile):** Sticky bar at bottom when browsing library — shows track name, play/pause, skip. Tap to expand to full Now Playing.
- **Gestures:** Swipe left/right to skip tracks, swipe up on mini-player to expand, pull-to-refresh on library.

**Vibe reference:** "If a DJ's dark cockpit had a baby with Winamp in 2026 — and you used it on the bus."

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS 4 |
| Auth | Google OAuth2 (Drive API scope) |
| Storage backend | Google Drive API v3 |
| Audio playback | Native `<audio>` element |
| Visualizer | Web Audio API (AnalyserNode) |
| Metadata parsing | `music-metadata-browser` (or similar, client-side) |
| PWA | Web app manifest + service worker |
| Media controls | Media Session API |
| Local persistence | localStorage (queue, settings), IndexedDB (offline cache) |
| Hosting | Vercel (free tier) |
| Database | None |

## Architecture

```
Google Drive (your FLAC files)
       |
       | Google Drive API v3 (OAuth2)
       |
  egert_amp Web App (Next.js on Vercel)
       |
       +-- Client-side: browse folders, parse metadata, play audio
       +-- Web Audio API: real-time visualizer
       +-- Service Worker: PWA, offline cache
       +-- localStorage: queue, playlists, settings
```

No server-side audio processing. Everything streams client-side. The Next.js backend only handles OAuth token exchange and serves the app shell.

## File Format Support

| Format | Support | Notes |
|--------|---------|-------|
| FLAC | Primary | Native browser support, lossless |
| MP3 | Automatic | `<audio>` handles it, no extra work |
| OGG | Automatic | Same |
| WAV | Automatic | Same |
| AAC/M4A | Automatic | Same |

FLAC is the first-class citizen. Others work because the browser handles them.

## Google Cloud Setup Required

- Google Cloud Console project (free)
- Drive API v3 enabled
- OAuth2 consent screen configured
- OAuth2 client ID (web application type)
- Scopes: `drive.readonly` (read files and folders)

This is a one-time 5-minute setup. I'll guide you through it.

## Milestones

### M1 — Play Music
> Goal: Open the app on your phone, sign in with Google, browse your Drive, play a FLAC file with full controls.

- Google OAuth2 sign-in flow
- Browse Drive folders, list audio files
- Play FLAC via `<audio>` element
- Core controls: play/pause, next/previous, seek, volume
- Shuffle and repeat modes
- Mobile-first dark UI: bottom tab nav, mini-player bar, full-screen now-playing
- Touch-friendly controls (44px+ targets, swipe gestures)
- Keyboard shortcuts (desktop)
- Queue (up next, reorder)
- Deploy to Vercel

### M2 — Look & Feel
> Goal: The app looks and feels like egert_amp — not a prototype. Phone experience is polished.

- Parse FLAC metadata (artist, album, title, track number, year)
- Extract and display embedded album art
- Album grid view with cover art thumbnails (2-column grid on phone, 4+ on desktop)
- Track list view with metadata columns
- Search across library (title, artist, album)
- Sort options (name, artist, album)
- Spectrum analyzer visualizer (Web Audio API)
- Full Winamp x Modern aesthetic: neon accents, dark theme, glowing elements
- Now-playing view: full-screen on mobile with large art, visualizer, thumb-zone controls
- Mini-player bar: persistent when browsing, tap to expand
- Swipe gestures: left/right skip, down to minimize now-playing
- Smooth transitions and animations between views
- Desktop layout: sidebar + persistent bottom player bar

### M3 — Go Mobile & Share
> Goal: Installable on phone, friends can use it.

- PWA manifest + service worker
- Background audio playback
- Media Session API (lock screen controls, notification art)
- Offline cache for recently played tracks
- Friend access via Google Drive shared folders
- Friends sign in with their Google account, see shared library
- Polish and edge cases

## Non-Goals (Out of Scope)

- Music discovery / recommendations
- Uploading music through the app (use Google Drive directly)
- Lyrics display
- Social features beyond sharing (no comments, likes, follows)
- Transcoding / format conversion
- Equalizer (maybe future)
- Multi-user playlists / collaborative queues (maybe future)
- App store distribution (PWA is sufficient)

## Success Criteria

- You use it daily instead of Spotify
- Friends can access and play music within 2 minutes of receiving access
- FLAC playback is smooth with no buffering on normal internet
- The visualizer makes people say "that's cool"
- Works as an installed app on your phone

---

**Working title:** egert_amp
**Status:** PRD — awaiting approval
**Date:** 2026-02-21

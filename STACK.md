# egert_amp — STACK.md

> Personal FLAC player powered by Google Drive.
> Last updated: 2026-02-21

## Services & URLs

| Service | URL / Endpoint |
|---------|---------------|
| GitHub | https://github.com/keeltekool/egert-amp |
| Dev server | http://localhost:3000 (use `--webpack` flag) |
| Neon DB | Project `egert-amp`, eu-central-1 |
| Google Cloud | Drive API v3, OAuth2 consent screen |

## Env Vars (.env.local)

| Var | Purpose |
|-----|---------|
| GOOGLE_CLIENT_ID | OAuth2 client ID |
| GOOGLE_CLIENT_SECRET | OAuth2 client secret |
| NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID | Root Drive folder to browse |
| DATABASE_URL | Neon PostgreSQL connection string |
| NEXTAUTH_URL | http://localhost:3000 (dev) |
| NEXTAUTH_SECRET | NextAuth JWT secret |

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth v4, Google OAuth2 (JWT strategy, drive.readonly scope) |
| Storage | Google Drive API v3 (streaming proxy) |
| DB | Neon PostgreSQL + Drizzle ORM (likes only) |
| Audio | Native `<audio>` element, blob caching for instant seek |
| Metadata | music-metadata (server-side, first 512KB of each file) |
| Hosting | Vercel (planned) |

## Brand

- Dark: neon green #39ff14 on #0a0a0f
- Light: #168000 on #f4f4f0
- Font: monospace accents, system sans body

## DB Schema

### likes
| Column | Type | Notes |
|--------|------|-------|
| user_email | text | PK part 1 |
| file_id | text | PK part 2 |
| created_at | timestamp | default now() |

Composite PK on (user_email, file_id). Per-Gmail, syncs across devices.

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| /api/auth/[...nextauth] | * | NextAuth Google OAuth |
| /api/drive/files | GET | List audio files + folders from Drive |
| /api/drive/stream | GET | Stream audio with Range request support |
| /api/drive/art | GET | Extract embedded album art from FLAC |
| /api/drive/metadata | POST | Parse title/artist/album from FLAC Vorbis comments |
| /api/likes | GET/POST/DELETE | Per-user liked tracks (Neon DB) |

## Project Structure

```
src/
  app/
    page.tsx              — Main app shell (tabs, state, metadata effect)
    api/drive/            — Drive proxy routes (files, stream, art, metadata)
    api/likes/            — Likes CRUD
  components/
    player/
      track-list.tsx      — Library tab (folders + tracks)
      now-playing.tsx     — Full-screen now-playing view
      mini-player.tsx     — Bottom bar player with seek + all controls
      queue-view.tsx      — Queue tab
      liked-view.tsx      — Liked songs tab
      player-controls.tsx — Seek bar + transport buttons (used by now-playing)
      album-art.tsx       — Album art component with fallback
    ui/icons.tsx          — All SVG icons
    theme-provider.tsx    — Dark/light theme context
  hooks/
    use-player.ts         — Audio playback engine (blob cache, seek, preload)
    use-likes.ts          — Liked tracks state (optimistic UI + API sync)
  lib/
    drive.ts              — Drive API helpers + URL generators
    auth.ts               — NextAuth config
    db/
      index.ts            — Drizzle + Neon connection
      schema.ts           — DB schema (likes table)
  types/
    player.ts             — Track, PlayerState, RepeatMode types
```

## Architecture

```
Google Drive (FLAC files)
    |
    | Google Drive API v3 (OAuth2, Range requests)
    |
  Next.js API Routes (stream proxy, metadata parser, art extractor)
    |
    +-- Client: browse folders, play audio, seek, queue
    +-- Blob caching: background-fetch full file for instant seeking
    +-- Neon DB: per-user liked tracks
```

## Gotchas

- Next.js 16 Turbopack has Google Fonts bug — always use `--webpack` flag
- FLAC files with large embedded art push Vorbis comments past 64KB — metadata route reads 512KB
- Metadata fetch marks IDs as "in-flight" — failed IDs are un-marked for retry
- Blob cache keeps only current ± 1 track to limit memory usage (~30-50MB per FLAC)
- Stream proxy passes Range headers through to Google for seekable audio
- Google OAuth via Chrome DevTools is blocked (can't test via automated browser)

---

## FEATURE CHECKLIST (Regression Guard)

Every feature below is BUILT AND WORKING. After ANY code change, verify these
still work. If modifying a file, check which features it touches and test those.

### Library Tab
- [ ] Folders display and are navigable (breadcrumb back-button)
- [ ] Audio tracks list with album art thumbnails
- [ ] **Track metadata: title + artist name displayed** (not just filename + FLAC)
- [ ] File size shown (XX MB)
- [ ] Play All / Shuffle buttons in sticky header
- [ ] Track count in header
- [ ] Heart button on each track (outline on hover, filled when liked)
- [ ] Clicking track starts playback and switches to Playing tab on mobile

### Liked Tab
- [ ] Shows only liked tracks (derived from all cached folders)
- [ ] Empty state when no likes
- [ ] Play All / Shuffle buttons
- [ ] Un-heart button (always visible, removes from list)
- [ ] Dot indicator on tab when likes exist

### Now Playing Tab
- [ ] Large album art with glow shadow
- [ ] Track title + artist
- [ ] Heart button next to title
- [ ] Seek bar with elapsed/remaining time
- [ ] All transport controls (shuffle, prev, play/pause, next, repeat)
- [ ] Queue position indicator (X / Y)
- [ ] Back button returns to Library

### Mini Player (bottom bar, visible when not on Playing tab)
- [ ] Album art (medium size)
- [ ] Track title + artist
- [ ] Seek bar with time labels (interactive)
- [ ] All 5 transport buttons (shuffle, prev, play/pause, next, repeat)
- [ ] Expand chevron opens Now Playing

### Queue Tab
- [ ] Shows queued tracks in order
- [ ] Current track highlighted
- [ ] Click to jump to track

### Playback Engine
- [ ] Audio plays via stream proxy with Range request support
- [ ] Blob caching: current track downloaded in background for instant seeking
- [ ] Next track pre-fetched as blob for instant start
- [ ] Seek bar doesn't snap back during/after seeking
- [ ] Shuffle mode (Fisher-Yates, current track stays at index 0)
- [ ] Repeat modes: off → all → one (cycle)
- [ ] Previous: restart if >3s in, else go back
- [ ] Auto-advance to next track on end

### Metadata System
- [ ] POST /api/drive/metadata reads first 512KB (covers large embedded art)
- [ ] Failed IDs are un-marked for retry (not permanently blacklisted)
- [ ] Errors logged server-side (not silently swallowed)
- [ ] Metadata enriches tracks in state, folder cache, AND player queue

### Likes System
- [ ] GET /api/likes returns liked fileIds for current user
- [ ] POST/DELETE toggle likes in Neon DB
- [ ] Optimistic UI in useLikes hook (instant toggle, revert on failure)
- [ ] Hearts use accent color (var(--accent)), not red

### Theme
- [ ] Dark mode (neon green on near-black)
- [ ] Light mode (dark green on warm white)
- [ ] Toggle button in header
- [ ] Persisted in localStorage

### Auth
- [ ] Google OAuth sign-in
- [ ] Sign-out button in header
- [ ] Session-aware: library loads on auth, likes load on auth

### Keyboard Shortcuts (Desktop)
- [ ] Space = play/pause
- [ ] Arrow Right/Left = seek ±10s
- [ ] Shift+Arrow = next/prev track
- [ ] Arrow Up/Down = volume
- [ ] M = mute, S = shuffle, R = repeat cycle

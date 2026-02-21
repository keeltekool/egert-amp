"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayer } from "@/hooks/use-player";
import { useTheme } from "@/components/theme-provider";
import { TrackList } from "@/components/player/track-list";
import { NowPlaying } from "@/components/player/now-playing";
import { QueueView } from "@/components/player/queue-view";
import { MiniPlayer } from "@/components/player/mini-player";
import { PlayIcon, MusicNoteIcon, QueueIcon, SignOutIcon, SunIcon, MoonIcon } from "@/components/ui/icons";
import { Track } from "@/types/player";
import { DriveFile, DriveFolder } from "@/lib/drive";

type Tab = "library" | "playing" | "queue";

interface FolderBreadcrumb {
  id: string;
  name: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const player = usePlayer();
  const { theme, toggleTheme } = useTheme();

  const [tab, setTab] = useState<Tab>("library");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderBreadcrumb[]>([]);
  const folderCacheRef = useRef<Map<string, { tracks: Track[]; folders: DriveFolder[] }>>(new Map());
  const metadataFetchedRef = useRef<Set<string>>(new Set());

  // Fetch files from Drive (with client-side cache)
  const fetchFiles = useCallback(
    async (folderId?: string) => {
      const cacheKey = folderId || "__root__";

      // Instant return from cache
      const cached = folderCacheRef.current.get(cacheKey);
      if (cached) {
        setTracks(cached.tracks);
        setFolders(cached.folders);
        return;
      }

      setLoading(true);
      try {
        const params = folderId ? `?folderId=${folderId}` : "";
        const res = await fetch(`/api/drive/files${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        const audioTracks: Track[] = (data.files || []).map(
          (f: DriveFile) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size,
          })
        );

        // Cache for instant back-navigation
        folderCacheRef.current.set(cacheKey, { tracks: audioTracks, folders: data.folders || [] });

        setTracks(audioTracks);
        setFolders(data.folders || []);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load library on sign in
  useEffect(() => {
    if (session?.accessToken) {
      fetchFiles();
    }
  }, [session?.accessToken, fetchFiles]);

  // Fetch metadata (title, artist, album) for tracks that don't have it yet
  useEffect(() => {
    const needMeta = tracks.filter(
      (t) => !t.artist && !t.title && !metadataFetchedRef.current.has(t.id)
    );
    if (needMeta.length === 0) return;

    const fileIds = needMeta.map((t) => t.id);
    fileIds.forEach((id) => metadataFetchedRef.current.add(id));

    fetch("/api/drive/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          meta: Record<
            string,
            { title?: string; artist?: string; album?: string }
          > | null
        ) => {
          if (!meta || Object.keys(meta).length === 0) return;

          setTracks((prev) => {
            const updated = prev.map((t) => {
              const m = meta[t.id];
              return m ? { ...t, ...m } : t;
            });

            // Update folder cache with enriched tracks
            const cacheKey =
              breadcrumbs.length > 0
                ? breadcrumbs[breadcrumbs.length - 1].id
                : "__root__";
            const cached = folderCacheRef.current.get(cacheKey);
            if (cached) {
              folderCacheRef.current.set(cacheKey, {
                ...cached,
                tracks: updated,
              });
            }

            return updated;
          });

          // Also update the player queue/currentTrack
          player.updateMetadata(meta);
        }
      )
      .catch(() => {
        /* metadata is non-critical */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, breadcrumbs]);

  const handleOpenFolder = useCallback(
    (folder: DriveFolder) => {
      setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
      fetchFiles(folder.id);
    },
    [fetchFiles]
  );

  const handleGoBack = useCallback(() => {
    setBreadcrumbs((prev) => {
      const next = prev.slice(0, -1);
      const parentId = next.length > 0 ? next[next.length - 1].id : undefined;
      fetchFiles(parentId);
      return next;
    });
  }, [fetchFiles]);

  const handlePlayTrack = useCallback(
    (track: Track, index: number) => {
      player.playTrack(track, tracks, index);
      if (window.innerWidth < 768) {
        setTab("playing");
      }
    },
    [player, tracks]
  );

  const handlePlayAll = useCallback(
    (shuffled = false) => {
      player.playAll(tracks, shuffled);
    },
    [player, tracks]
  );

  const handleQueuePlayTrack = useCallback(
    (track: Track, index: number) => {
      player.playTrack(track, player.queue, index);
    },
    [player]
  );

  // Loading screen
  if (status === "loading") {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="font-mono text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Sign in screen
  if (!session) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-mono tracking-tight">
            <span className="text-[var(--accent)]">egert</span>
            <span className="text-[var(--text-secondary)]">_amp</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2 font-mono">
            Personal FLAC player
          </p>
        </div>

        <button
          onClick={() => signIn("google")}
          className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-accent)] rounded-lg hover:bg-[var(--bg-hover)] transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-sm font-medium">Sign in with Google</span>
        </button>

        <p className="text-[var(--text-faint)] text-xs font-mono text-center max-w-xs">
          Connect your Google Drive to stream your FLAC collection
        </p>
      </div>
    );
  }

  const currentFolderName =
    breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].name
      : undefined;

  return (
    <div className="h-dvh flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-2">
          {breadcrumbs.length > 0 && (
            <button
              onClick={handleGoBack}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              ←
            </button>
          )}
          <h1 className="font-mono text-sm font-bold">
            <span className="text-[var(--accent)]">egert</span>
            <span className="text-[var(--text-muted)]">_amp</span>
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => signOut()}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            title="Sign out"
          >
            <SignOutIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {tab === "library" && (
          <TrackList
            tracks={tracks}
            folders={folders}
            currentTrack={player.currentTrack}
            isPlaying={player.isPlaying}
            loading={loading}
            currentFolderName={currentFolderName}
            onPlayTrack={handlePlayTrack}
            onOpenFolder={handleOpenFolder}
            onPlayAll={handlePlayAll}
          />
        )}
        {tab === "playing" && (
          <NowPlaying
            track={player.currentTrack}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            shuffle={player.shuffle}
            repeat={player.repeat}
            queueIndex={player.queueIndex}
            queueLength={player.queue.length}
            onTogglePlay={player.togglePlay}
            onNext={player.nextTrack}
            onPrev={player.prevTrack}
            onSeek={player.seek}
            onToggleShuffle={player.toggleShuffle}
            onCycleRepeat={player.cycleRepeat}
            onClose={() => setTab("library")}
          />
        )}
        {tab === "queue" && (
          <QueueView
            queue={player.queue}
            queueIndex={player.queueIndex}
            currentTrack={player.currentTrack}
            isPlaying={player.isPlaying}
            onPlayTrack={handleQueuePlayTrack}
          />
        )}
      </main>

      {/* Mini player */}
      {tab !== "playing" && player.currentTrack && (
        <MiniPlayer
          track={player.currentTrack}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          shuffle={player.shuffle}
          repeat={player.repeat}
          onTogglePlay={player.togglePlay}
          onNext={player.nextTrack}
          onPrev={player.prevTrack}
          onSeek={player.seek}
          onToggleShuffle={player.toggleShuffle}
          onCycleRepeat={player.cycleRepeat}
          onExpand={() => setTab("playing")}
        />
      )}

      {/* Bottom tab bar */}
      <nav className="flex-shrink-0 flex items-center justify-around border-t border-[var(--border)] bg-[var(--bg-primary)] px-2 pb-safe">
        <button
          onClick={() => setTab("library")}
          className={`flex flex-col items-center gap-1 py-3 px-6 transition-colors ${
            tab === "library" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          <MusicNoteIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Library</span>
        </button>
        <button
          onClick={() => setTab("playing")}
          className={`flex flex-col items-center gap-1 py-3 px-6 transition-colors ${
            tab === "playing" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          <PlayIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Playing</span>
        </button>
        <button
          onClick={() => setTab("queue")}
          className={`flex flex-col items-center gap-1 py-3 px-6 transition-colors ${
            tab === "queue" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          <QueueIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Queue</span>
        </button>
      </nav>
    </div>
  );
}

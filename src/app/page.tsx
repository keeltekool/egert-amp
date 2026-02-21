"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayer } from "@/hooks/use-player";
import { useLikes } from "@/hooks/use-likes";
import { useTheme } from "@/components/theme-provider";
import { TrackList } from "@/components/player/track-list";
import { NowPlaying } from "@/components/player/now-playing";
import { QueueView } from "@/components/player/queue-view";
import { LikedView } from "@/components/player/liked-view";
import { MiniPlayer } from "@/components/player/mini-player";
import { PlayIcon, MusicNoteIcon, QueueIcon, SignOutIcon, SunIcon, MoonIcon, HeartFilledIcon } from "@/components/ui/icons";
import { Track } from "@/types/player";
import { DriveFile, DriveFolder } from "@/lib/drive";

type Tab = "library" | "liked" | "playing" | "queue";

interface FolderBreadcrumb {
  id: string;
  name: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const player = usePlayer();
  const { theme, toggleTheme } = useTheme();
  const { likedIds, isLiked, toggleLike } = useLikes(status === "authenticated");

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

  // Apply metadata results to tracks, folder cache, and player queue
  const applyMetadata = useCallback(
    (meta: Record<string, { title?: string; artist?: string; album?: string }>) => {
      if (Object.keys(meta).length === 0) return;

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

      player.updateMetadata(meta);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [breadcrumbs]
  );

  // Fetch metadata in small batches (20 IDs per request) for progressive loading
  useEffect(() => {
    const needMeta = tracks.filter(
      (t) => !t.artist && !t.title && !metadataFetchedRef.current.has(t.id)
    );
    if (needMeta.length === 0) return;

    const allIds = needMeta.map((t) => t.id);
    allIds.forEach((id) => metadataFetchedRef.current.add(id));

    // Split into batches of 20 — each batch fires independently and updates UI on arrival
    const BATCH_SIZE = 20;
    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
      const batchIds = allIds.slice(i, i + BATCH_SIZE);

      fetch("/api/drive/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: batchIds }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { results?: Record<string, { title?: string; artist?: string; album?: string }>; failed?: string[] } | null) => {
          if (!data) {
            batchIds.forEach((id) => metadataFetchedRef.current.delete(id));
            return;
          }

          // Handle both old flat format and new { results, failed } format
          const meta = data.results || (data as Record<string, { title?: string; artist?: string; album?: string }>);
          const failed: string[] = data.failed || [];

          if (failed.length > 0) {
            failed.forEach((id) => metadataFetchedRef.current.delete(id));
          }

          applyMetadata(meta);
        })
        .catch(() => {
          batchIds.forEach((id) => metadataFetchedRef.current.delete(id));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, breadcrumbs, applyMetadata]);

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

  const handlePlayFromQueue = useCallback(
    (index: number) => {
      player.playFromQueue(index);
    },
    [player]
  );

  // Build liked tracks list from all cached folders
  const allCachedTracks = Array.from(folderCacheRef.current.values()).flatMap((c) => c.tracks);
  const likedTracks = allCachedTracks.filter((t) => likedIds.has(t.id));

  const handleLikedPlayTrack = useCallback(
    (track: Track, index: number) => {
      const liked = allCachedTracks.filter((t) => likedIds.has(t.id));
      player.playTrack(track, liked, index);
      if (window.innerWidth < 768) {
        setTab("playing");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player, likedIds]
  );

  const handleLikedPlayAll = useCallback(
    (shuffled = false) => {
      const liked = allCachedTracks.filter((t) => likedIds.has(t.id));
      player.playAll(liked, shuffled);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player, likedIds]
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
          <h1 className="text-4xl font-bold font-mono tracking-tight">
            <span className="text-[var(--accent)]">egert</span>
            <span className="text-[var(--text-secondary)]">_amp</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-base mt-3 font-mono leading-relaxed max-w-sm">
            Your FLAC collection, straight from Drive.<br />
            No compression. No compromise.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex flex-wrap justify-center gap-2 max-w-xs">
            {["lossless streaming", "album art", "queue", "likes", "dark mode"].map((tag) => (
              <span key={tag} className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--accent-muted)] bg-[var(--accent-soft)] rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => signIn("google")}
          className="flex items-center gap-3 px-6 py-3 bg-[var(--accent)] text-[var(--play-btn-text)] rounded-full hover:shadow-[0_0_20px_var(--glow-btn)] transition-all font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-sm">Sign in with Google</span>
        </button>

        <p className="text-[var(--text-faint)] text-[11px] font-mono text-center max-w-xs">
          500+ tracks &middot; FLAC &middot; powered by Google Drive
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
            likedIds={likedIds}
            onPlayTrack={handlePlayTrack}
            onOpenFolder={handleOpenFolder}
            onToggleLike={toggleLike}
            onAddToQueue={player.addToQueue}
          />
        )}
        {tab === "liked" && (
          <LikedView
            tracks={likedTracks}
            currentTrack={player.currentTrack}
            isPlaying={player.isPlaying}
            onPlayTrack={handleLikedPlayTrack}
            onUnlike={toggleLike}
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
            isLiked={player.currentTrack ? isLiked(player.currentTrack.id) : false}
            onTogglePlay={player.togglePlay}
            onNext={player.nextTrack}
            onPrev={player.prevTrack}
            onSeek={player.seek}
            onToggleShuffle={player.toggleShuffle}
            onCycleRepeat={player.cycleRepeat}
            onClose={() => setTab("library")}
            onToggleLike={() => player.currentTrack && toggleLike(player.currentTrack.id)}
          />
        )}
        {tab === "queue" && (
          <QueueView
            userQueue={player.userQueue}
            currentTrack={player.currentTrack}
            onPlayFromQueue={handlePlayFromQueue}
            onRemoveFromQueue={player.removeFromQueue}
            onClearQueue={player.clearQueue}
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
          volume={player.volume}
          isMuted={player.isMuted}
          onTogglePlay={player.togglePlay}
          onNext={player.nextTrack}
          onPrev={player.prevTrack}
          onSeek={player.seek}
          onToggleShuffle={player.toggleShuffle}
          onCycleRepeat={player.cycleRepeat}
          onSetVolume={player.setVolume}
          onToggleMute={player.toggleMute}
          onExpand={() => setTab("playing")}
        />
      )}

      {/* Bottom tab bar */}
      <nav className="flex-shrink-0 flex items-center justify-around border-t border-[var(--border)] bg-[var(--bg-primary)] px-2 pb-safe">
        <button
          onClick={() => setTab("library")}
          className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
            tab === "library" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          <MusicNoteIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Library</span>
        </button>
        <button
          onClick={() => setTab("liked")}
          className={`relative flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
            tab === "liked" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          <HeartFilledIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Liked</span>
          {likedIds.size > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--accent)] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setTab("playing")}
          className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
            tab === "playing" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          <PlayIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Playing</span>
        </button>
        <button
          onClick={() => setTab("queue")}
          className={`relative flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
            tab === "queue" ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          <QueueIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Queue</span>
          {player.userQueue.length > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 text-[8px] font-mono font-bold bg-[var(--accent)] text-[var(--play-btn-text)] rounded-full flex items-center justify-center">
              {player.userQueue.length > 9 ? "9+" : player.userQueue.length}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
}

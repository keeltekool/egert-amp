"use client";

import { HeartFilledIcon, MusicNoteIcon, PlayIcon, PauseIcon } from "@/components/ui/icons";
import { AlbumArt } from "./album-art";
import { Track } from "@/types/player";

interface LikedViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, index: number) => void;
  onUnlike: (fileId: string) => void;
}

export function LikedView({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onUnlike,
}: LikedViewProps) {
  if (tracks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <HeartFilledIcon className="w-12 h-12 text-[var(--text-icon)] mb-3" />
        <p className="text-[var(--text-muted)] text-sm">No liked songs yet</p>
        <p className="text-[var(--text-faint)] text-xs mt-1">
          Tap the heart on any track to add it here
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur-sm px-4 py-3 border-b border-[var(--border)]">
        <h2 className="font-semibold text-sm">Liked Songs</h2>
        <p className="text-xs text-[var(--text-muted)] font-mono">
          {tracks.length} track{tracks.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Liked tracks */}
      {tracks.map((track, index) => {
        const isCurrent = currentTrack?.id === track.id;
        const displayName = track.title || track.name.replace(/\.[^/.]+$/, "");

        return (
          <div
            key={track.id}
            className={`group/row flex items-center gap-3 px-4 py-3 transition-colors ${
              isCurrent
                ? "bg-[var(--bg-active)] border-l-2 border-[var(--accent)]"
                : "hover:bg-[var(--bg-hover)] border-l-2 border-transparent"
            }`}
          >
            {/* Clickable track area */}
            <button
              onClick={() => onPlayTrack(track, index)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
            >
              <div className="relative flex-shrink-0">
                <AlbumArt fileId={track.id} size="sm" />
                {isCurrent && (
                  <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center group-hover/row:bg-black/50">
                    {isPlaying ? (
                      <PauseIcon className="w-4 h-4 text-white" />
                    ) : (
                      <PlayIcon className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}
                {!isCurrent && (
                  <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <PlayIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isCurrent ? "text-[var(--accent)] font-medium" : ""}`}>
                  {displayName}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate font-mono">
                  {track.artist || "Unknown artist"}
                </p>
              </div>
            </button>

            {/* Un-heart button — always visible, prominent */}
            <button
              onClick={() => onUnlike(track.id)}
              className="flex-shrink-0 p-2 transition-all hover:scale-110 active:scale-95"
              title="Remove from liked"
            >
              <HeartFilledIcon className="w-5 h-5 text-[var(--accent)]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { MusicNoteIcon, PlayIcon, PauseIcon } from "@/components/ui/icons";
import { AlbumArt } from "./album-art";
import { Track } from "@/types/player";

interface QueueViewProps {
  queue: Track[];
  queueIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, index: number) => void;
}

export function QueueView({
  queue,
  queueIndex,
  currentTrack,
  isPlaying,
  onPlayTrack,
}: QueueViewProps) {
  if (queue.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
        <MusicNoteIcon className="w-12 h-12 text-[var(--text-icon)]" />
        <p className="text-[var(--text-muted)] text-sm">Queue is empty</p>
        <p className="text-[var(--text-faint)] text-xs">Play a track to build your queue</p>
      </div>
    );
  }

  const upNext = queue.slice(queueIndex + 1);
  const played = queue.slice(0, queueIndex);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Now Playing */}
      {currentTrack && (
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <p className="text-xs font-mono text-[var(--accent-muted)] uppercase tracking-widest mb-2">
            Now Playing
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <AlbumArt fileId={currentTrack.id} size="sm" />
              <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
                {isPlaying ? (
                  <PauseIcon className="w-4 h-4 text-white" />
                ) : (
                  <PlayIcon className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--accent)] truncate">
                {currentTrack.title ||
                  currentTrack.name.replace(/\.[^/.]+$/, "")}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {currentTrack.artist || "Unknown artist"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Up Next */}
      {upNext.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">
            Up Next · {upNext.length} track{upNext.length !== 1 ? "s" : ""}
          </p>
          {upNext.map((track, i) => {
            const displayName =
              track.title || track.name.replace(/\.[^/.]+$/, "");
            const actualIndex = queueIndex + 1 + i;

            return (
              <button
                key={`${track.id}-${actualIndex}`}
                onClick={() => onPlayTrack(track, actualIndex)}
                className="w-full flex items-center gap-3 py-2.5 hover:bg-[var(--bg-hover)] rounded transition-colors text-left"
              >
                <AlbumArt fileId={track.id} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-secondary)] truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {track.artist || "Unknown artist"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Already Played */}
      {played.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <p className="text-xs font-mono text-[var(--text-faint)] uppercase tracking-widest mb-2">
            Played
          </p>
          {played.map((track, i) => {
            const displayName =
              track.title || track.name.replace(/\.[^/.]+$/, "");

            return (
              <button
                key={`${track.id}-played-${i}`}
                onClick={() => onPlayTrack(track, i)}
                className="w-full flex items-center gap-3 py-2 hover:bg-[var(--bg-hover)] rounded transition-colors text-left opacity-50"
              >
                <span className="text-xs font-mono text-[var(--text-faint)] w-6 text-right">
                  {i + 1}
                </span>
                <p className="text-sm text-[var(--text-secondary)] truncate">{displayName}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

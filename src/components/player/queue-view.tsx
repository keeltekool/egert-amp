"use client";

import { MusicNoteIcon, PlayIcon, CloseIcon } from "@/components/ui/icons";
import { AlbumArt } from "./album-art";
import { Track } from "@/types/player";

interface QueueViewProps {
  userQueue: Track[];
  currentTrack: Track | null;
  onPlayFromQueue: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
}

export function QueueView({
  userQueue,
  currentTrack,
  onPlayFromQueue,
  onRemoveFromQueue,
  onClearQueue,
}: QueueViewProps) {
  if (userQueue.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
        <MusicNoteIcon className="w-12 h-12 text-[var(--text-icon)]" />
        <p className="text-[var(--text-muted)] text-sm">Queue is empty</p>
        <p className="text-[var(--text-faint)] text-xs text-center">
          Tap the queue button on any track to add it here
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header with Clear All */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
        <div>
          <h2 className="font-semibold text-sm">Queue</h2>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            {userQueue.length} track{userQueue.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onClearQueue}
          className="px-3 py-1.5 text-xs font-mono bg-[var(--bg-card)] text-[var(--text-secondary)] rounded-full hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Up Next — only user-added tracks */}
      <div className="px-4 py-3">
        <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">
          Up Next
        </p>
        {userQueue.map((track, index) => {
          const displayName = track.title || track.name.replace(/\.[^/.]+$/, "");
          const isCurrent = currentTrack?.id === track.id;

          return (
            <div
              key={`${track.id}-${index}`}
              className="group/qrow flex items-center gap-3 py-2.5 hover:bg-[var(--bg-hover)] rounded transition-colors"
            >
              <button
                onClick={() => onPlayFromQueue(index)}
                className="flex-1 flex items-center gap-3 min-w-0 text-left"
              >
                <div className="relative flex-shrink-0">
                  <AlbumArt fileId={track.id} size="sm" />
                  <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover/qrow:opacity-100 transition-opacity">
                    <PlayIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm truncate ${isCurrent ? "text-[var(--accent)] font-medium" : "text-[var(--text-secondary)]"}`}>
                    {displayName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {track.artist || "Unknown artist"}
                  </p>
                </div>
              </button>
              <button
                onClick={() => onRemoveFromQueue(index)}
                className="flex-shrink-0 p-2 text-[var(--text-muted)] opacity-0 group-hover/qrow:opacity-100 hover:text-[var(--accent)] transition-all"
                title="Remove from queue"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

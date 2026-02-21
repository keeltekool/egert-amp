"use client";

import { MusicNoteIcon, PlayIcon, PauseIcon, FolderIcon, HeartIcon, HeartFilledIcon, QueueAddIcon } from "@/components/ui/icons";
import { AlbumArt } from "./album-art";
import { Track } from "@/types/player";
import { DriveFolder } from "@/lib/drive";

interface TrackListProps {
  tracks: Track[];
  folders: DriveFolder[];
  currentTrack: Track | null;
  isPlaying: boolean;
  loading: boolean;
  currentFolderName?: string;
  likedIds: Set<string>;
  onPlayTrack: (track: Track, index: number) => void;
  onOpenFolder: (folder: DriveFolder) => void;
  onToggleLike: (fileId: string) => void;
  onAddToQueue: (track: Track) => void;
}

export function TrackList({
  tracks,
  folders,
  currentTrack,
  isPlaying,
  loading,
  currentFolderName,
  likedIds,
  onPlayTrack,
  onOpenFolder,
  onToggleLike,
  onAddToQueue,
}: TrackListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] font-mono text-sm">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header — compact single line */}
      {tracks.length > 0 && (
        <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur-sm px-4 py-2 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold text-sm">
            {currentFolderName || "Library"}
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {tracks.length} tracks
          </span>
        </div>
      )}

      {/* Folders */}
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onOpenFolder(folder)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0">
            <FolderIcon className="w-5 h-5 text-[var(--accent-muted)]" />
          </div>
          <span className="text-sm font-medium truncate">{folder.name}</span>
        </button>
      ))}

      {/* Tracks */}
      {tracks.map((track, index) => {
        const isCurrent = currentTrack?.id === track.id;
        const displayName = track.title || track.name.replace(/\.[^/.]+$/, "");

        return (
          <button
            key={track.id}
            onClick={() => onPlayTrack(track, index)}
            className={`group/row w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
              isCurrent
                ? "bg-[var(--bg-active)] border-l-2 border-[var(--accent)]"
                : "hover:bg-[var(--bg-hover)] border-l-2 border-transparent"
            }`}
          >
            <div className="relative flex-shrink-0">
              <AlbumArt fileId={track.id} size="sm" />
              {/* Always-visible overlay for current track */}
              {isCurrent && (
                <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center group-hover/row:bg-black/50">
                  {isPlaying ? (
                    <PauseIcon className="w-4 h-4 text-white" />
                  ) : (
                    <PlayIcon className="w-4 h-4 text-white" />
                  )}
                </div>
              )}
              {/* Hover-only overlay for non-current tracks */}
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

            {/* Add to Queue button — always visible on mobile */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue(track);
              }}
              className="flex-shrink-0 p-2 text-[var(--text-faint)] md:opacity-0 md:group-hover/row:opacity-100 transition-all hover:text-[var(--accent)] active:text-[var(--accent)] active:scale-95"
              title="Add to queue"
            >
              <QueueAddIcon className="w-4 h-4" />
            </button>

            {/* Heart button — always visible on mobile */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(track.id);
              }}
              className="flex-shrink-0 p-2 transition-all active:scale-95"
            >
              {likedIds.has(track.id) ? (
                <HeartFilledIcon className="w-4 h-4 text-[var(--accent)]" />
              ) : (
                <HeartIcon className="w-4 h-4 text-[var(--text-faint)] md:opacity-0 md:group-hover/row:opacity-100 transition-opacity" />
              )}
            </button>
          </button>
        );
      })}

      {tracks.length === 0 && folders.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <MusicNoteIcon className="w-12 h-12 text-[var(--text-icon)] mb-3" />
          <p className="text-[var(--text-muted)] text-sm">No audio files found</p>
          <p className="text-[var(--text-faint)] text-xs mt-1">
            Add FLAC files to your Google Drive folder
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { MusicNoteIcon, PlayIcon, PauseIcon, FolderIcon } from "@/components/ui/icons";
import { Track } from "@/types/player";
import { DriveFolder } from "@/lib/drive";

interface TrackListProps {
  tracks: Track[];
  folders: DriveFolder[];
  currentTrack: Track | null;
  isPlaying: boolean;
  loading: boolean;
  currentFolderName?: string;
  onPlayTrack: (track: Track, index: number) => void;
  onOpenFolder: (folder: DriveFolder) => void;
  onPlayAll: (shuffled?: boolean) => void;
}

export function TrackList({
  tracks,
  folders,
  currentTrack,
  isPlaying,
  loading,
  currentFolderName,
  onPlayTrack,
  onOpenFolder,
  onPlayAll,
}: TrackListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#39ff14]/30 border-t-[#39ff14] rounded-full animate-spin" />
          <p className="text-white/30 font-mono text-sm">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header with play all */}
      {tracks.length > 0 && (
        <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="font-semibold text-sm">
              {currentFolderName || "Library"}
            </h2>
            <p className="text-xs text-white/30 font-mono">
              {tracks.length} track{tracks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPlayAll(false)}
              className="px-3 py-1.5 text-xs font-mono bg-[#39ff14]/10 text-[#39ff14] rounded-full hover:bg-[#39ff14]/20 transition-colors"
            >
              Play All
            </button>
            <button
              onClick={() => onPlayAll(true)}
              className="px-3 py-1.5 text-xs font-mono bg-white/5 text-white/60 rounded-full hover:bg-white/10 transition-colors"
            >
              Shuffle
            </button>
          </div>
        </div>
      )}

      {/* Folders */}
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onOpenFolder(folder)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded bg-[#39ff14]/10 flex items-center justify-center flex-shrink-0">
            <FolderIcon className="w-5 h-5 text-[#39ff14]/60" />
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
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
              isCurrent
                ? "bg-[#39ff14]/5 border-l-2 border-[#39ff14]"
                : "hover:bg-white/5 border-l-2 border-transparent"
            }`}
          >
            {/* Track number / play indicator */}
            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
              {isCurrent && isPlaying ? (
                <PauseIcon className="w-4 h-4 text-[#39ff14]" />
              ) : isCurrent ? (
                <PlayIcon className="w-4 h-4 text-[#39ff14]" />
              ) : (
                <MusicNoteIcon className="w-4 h-4 text-white/20" />
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm truncate ${
                  isCurrent ? "text-[#39ff14] font-medium" : "text-white/80"
                }`}
              >
                {displayName}
              </p>
              <p className="text-xs text-white/30 truncate font-mono">
                {track.artist || track.mimeType.split("/")[1]?.toUpperCase() || "FLAC"}
                {track.size &&
                  ` · ${(parseInt(track.size, 10) / 1048576).toFixed(0)} MB`}
              </p>
            </div>
          </button>
        );
      })}

      {tracks.length === 0 && folders.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <MusicNoteIcon className="w-12 h-12 text-white/10 mb-3" />
          <p className="text-white/30 text-sm">No audio files found</p>
          <p className="text-white/20 text-xs mt-1">
            Add FLAC files to your Google Drive folder
          </p>
        </div>
      )}
    </div>
  );
}

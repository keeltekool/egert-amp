"use client";

import { MusicNoteIcon, ChevronLeftIcon } from "@/components/ui/icons";
import { AlbumArt } from "./album-art";
import { PlayerControls } from "./player-controls";
import { Track, RepeatMode } from "@/types/player";

interface NowPlayingProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  queueIndex: number;
  queueLength: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onClose: () => void;
}

export function NowPlaying({
  track,
  isPlaying,
  currentTime,
  duration,
  shuffle,
  repeat,
  queueIndex,
  queueLength,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
  onClose,
}: NowPlayingProps) {
  if (!track) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <MusicNoteIcon className="w-16 h-16 text-[var(--text-icon)]" />
        <p className="text-[var(--text-muted)] font-mono text-sm">No track selected</p>
        <p className="text-[var(--text-faint)] text-xs">Pick a track from your library</p>
      </div>
    );
  }

  const displayName = track.title || track.name.replace(/\.[^/.]+$/, "");

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 pb-4 max-w-lg mx-auto w-full">
      {/* Header with back button */}
      <div className="w-full flex items-center justify-between mb-4">
        <button onClick={onClose} className="flex items-center gap-1 p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ChevronLeftIcon className="w-5 h-5" />
          <span className="text-xs font-mono uppercase tracking-widest">Library</span>
        </button>
        <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">
          Now Playing
        </span>
        <div className="w-20" />
      </div>

      {/* Album art area */}
      <div className="flex-1 flex items-center justify-center w-full max-h-[50vh]">
        <AlbumArt fileId={track.id} size="lg" className="shadow-[0_0_40px_var(--glow-art)]" />
      </div>

      {/* Track info */}
      <div className="w-full text-center mt-6 mb-4">
        <h2 className="text-lg font-semibold truncate px-4">{displayName}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1 truncate">
          {track.artist || "Unknown artist"}
        </p>
        <p className="text-xs font-mono text-[var(--text-faint)] mt-2">
          {queueIndex + 1} / {queueLength}
        </p>
      </div>

      {/* Controls */}
      <div className="w-full">
        <PlayerControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          shuffle={shuffle}
          repeat={repeat}
          onTogglePlay={onTogglePlay}
          onNext={onNext}
          onPrev={onPrev}
          onSeek={onSeek}
          onToggleShuffle={onToggleShuffle}
          onCycleRepeat={onCycleRepeat}
        />
      </div>
    </div>
  );
}

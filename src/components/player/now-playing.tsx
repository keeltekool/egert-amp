"use client";

import { MusicNoteIcon, ChevronLeftIcon } from "@/components/ui/icons";
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
        <MusicNoteIcon className="w-16 h-16 text-white/10" />
        <p className="text-white/30 font-mono text-sm">No track selected</p>
        <p className="text-white/20 text-xs">Pick a track from your library</p>
      </div>
    );
  }

  const displayName = track.title || track.name.replace(/\.[^/.]+$/, "");

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 pb-4 max-w-lg mx-auto w-full">
      {/* Header with back button (mobile) */}
      <div className="w-full flex items-center justify-between mb-4 md:hidden">
        <button onClick={onClose} className="p-2 -ml-2 text-white/50">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <span className="text-xs font-mono text-white/30 uppercase tracking-widest">
          Now Playing
        </span>
        <div className="w-10" />
      </div>

      {/* Album art area */}
      <div className="flex-1 flex items-center justify-center w-full max-h-[50vh]">
        <div className="w-full aspect-square max-w-[300px] rounded-lg bg-white/5 flex items-center justify-center shadow-[0_0_40px_rgba(57,255,20,0.05)]">
          <MusicNoteIcon className="w-24 h-24 text-[#39ff14]/20" />
        </div>
      </div>

      {/* Track info */}
      <div className="w-full text-center mt-6 mb-4">
        <h2 className="text-lg font-semibold truncate px-4">{displayName}</h2>
        <p className="text-sm text-white/40 mt-1 truncate">
          {track.artist || "Unknown artist"}
        </p>
        <p className="text-xs font-mono text-white/20 mt-2">
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

"use client";

import { PlayIcon, PauseIcon, SkipNextIcon, MusicNoteIcon } from "@/components/ui/icons";
import { Track } from "@/types/player";

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onExpand: () => void;
}

export function MiniPlayer({
  track,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onExpand,
}: MiniPlayerProps) {
  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayName = track.title || track.name.replace(/\.[^/.]+$/, "");

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 bg-[#111118] border-t border-white/5">
      {/* Progress bar at top of mini player */}
      <div className="h-0.5 bg-white/5">
        <div
          className="h-full bg-[#39ff14] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="flex items-center gap-3 px-4 py-2 cursor-pointer"
        onClick={onExpand}
      >
        {/* Track art placeholder */}
        <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
          <MusicNoteIcon className="w-5 h-5 text-[#39ff14]/50" />
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-white/40 truncate">
            {track.artist || "Unknown artist"}
          </p>
        </div>

        {/* Controls */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          className="p-2 text-white"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <PauseIcon className="w-6 h-6" />
          ) : (
            <PlayIcon className="w-6 h-6" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="p-2 text-white/50"
          title="Next"
        >
          <SkipNextIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

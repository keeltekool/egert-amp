"use client";

import {
  PlayIcon,
  PauseIcon,
  SkipNextIcon,
  SkipPrevIcon,
  ShuffleIcon,
  RepeatIcon,
  RepeatOneIcon,
} from "@/components/ui/icons";
import { RepeatMode } from "@/types/player";

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
}

export function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  shuffle,
  repeat,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
}: PlayerControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Seek bar */}
      <div className="w-full flex items-center gap-2 px-2">
        <span className="text-xs font-mono text-[var(--text-secondary)] w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1 relative h-11 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 appearance-none rounded-full outline-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:border-0"
            style={{
              background: `linear-gradient(to right, var(--accent) ${progress}%, var(--track-bg) ${progress}%)`,
            }}
          />
        </div>
        <span className="text-xs font-mono text-[var(--text-secondary)] w-10">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onToggleShuffle}
          className={`p-3 rounded-full transition-colors ${
            shuffle
              ? "text-[var(--accent)] bg-[var(--accent-soft)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
          title="Shuffle"
        >
          <ShuffleIcon className="w-5 h-5" />
        </button>

        <button
          onClick={onPrev}
          className="p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Previous"
        >
          <SkipPrevIcon className="w-7 h-7" />
        </button>

        <button
          onClick={onTogglePlay}
          className="p-4 bg-[var(--accent)] text-[var(--play-btn-text)] rounded-full transition-all active:scale-95"
          style={{ boxShadow: `0 0 20px var(--glow-btn)` }}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <PauseIcon className="w-7 h-7" />
          ) : (
            <PlayIcon className="w-7 h-7" />
          )}
        </button>

        <button
          onClick={onNext}
          className="p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Next"
        >
          <SkipNextIcon className="w-7 h-7" />
        </button>

        <button
          onClick={onCycleRepeat}
          className={`p-3 rounded-full transition-colors ${
            repeat !== "off"
              ? "text-[var(--accent)] bg-[var(--accent-soft)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
          title={`Repeat: ${repeat}`}
        >
          {repeat === "one" ? (
            <RepeatOneIcon className="w-5 h-5" />
          ) : (
            <RepeatIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

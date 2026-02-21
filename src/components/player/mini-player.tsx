"use client";

import {
  PlayIcon,
  PauseIcon,
  SkipNextIcon,
  SkipPrevIcon,
  ShuffleIcon,
  RepeatIcon,
  RepeatOneIcon,
  ChevronUpIcon,
} from "@/components/ui/icons";
import { AlbumArt } from "./album-art";
import { Track, RepeatMode } from "@/types/player";

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface MiniPlayerProps {
  track: Track | null;
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
  onExpand: () => void;
}

export function MiniPlayer({
  track,
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
  onExpand,
}: MiniPlayerProps) {
  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayName = track.title || track.name.replace(/\.[^/.]+$/, "");

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 bg-[var(--bg-secondary)] border-t-2 border-[var(--border)] shadow-[0_-2px_10px_rgba(0,0,0,0.12)]">
      {/* Seek bar with times */}
      <div className="flex items-center gap-2 px-3 pt-2">
        <span className="text-[10px] font-mono text-[var(--text-muted)] w-8 text-right">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1 relative h-6 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1 appearance-none rounded-full outline-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]
              [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--accent)] [&::-moz-range-thumb]:border-0"
            style={{
              background: `linear-gradient(to right, var(--accent) ${progress}%, var(--track-bg) ${progress}%)`,
            }}
          />
        </div>
        <span className="text-[10px] font-mono text-[var(--text-muted)] w-8">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main row: art + info + controls + expand */}
      <div className="flex items-center gap-3 px-3 pb-2 pt-1">
        {/* Album art — bigger */}
        <AlbumArt fileId={track.id} size="md" />

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {track.artist || "Unknown artist"}
          </p>
        </div>

        {/* Transport controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onToggleShuffle}
            className={`p-1.5 rounded-full transition-colors ${
              shuffle
                ? "text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            title="Shuffle"
          >
            <ShuffleIcon className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Previous"
          >
            <SkipPrevIcon className="w-5 h-5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-2 bg-[var(--accent)] text-[var(--play-btn-text)] rounded-full transition-all active:scale-95 mx-0.5"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Next"
          >
            <SkipNextIcon className="w-5 h-5" />
          </button>

          <button
            onClick={onCycleRepeat}
            className={`p-1.5 rounded-full transition-colors ${
              repeat !== "off"
                ? "text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            title={`Repeat: ${repeat}`}
          >
            {repeat === "one" ? (
              <RepeatOneIcon className="w-4 h-4" />
            ) : (
              <RepeatIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Expand to full Now Playing */}
        <button
          onClick={onExpand}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors ml-1"
          title="Expand"
        >
          <ChevronUpIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

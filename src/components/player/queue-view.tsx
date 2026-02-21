"use client";

import { MusicNoteIcon, PlayIcon, PauseIcon } from "@/components/ui/icons";
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
        <MusicNoteIcon className="w-12 h-12 text-white/10" />
        <p className="text-white/30 text-sm">Queue is empty</p>
        <p className="text-white/20 text-xs">Play a track to build your queue</p>
      </div>
    );
  }

  const upNext = queue.slice(queueIndex + 1);
  const played = queue.slice(0, queueIndex);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Now Playing */}
      {currentTrack && (
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-xs font-mono text-[#39ff14]/60 uppercase tracking-widest mb-2">
            Now Playing
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#39ff14]/10 flex items-center justify-center flex-shrink-0">
              {isPlaying ? (
                <PauseIcon className="w-4 h-4 text-[#39ff14]" />
              ) : (
                <PlayIcon className="w-4 h-4 text-[#39ff14]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#39ff14] truncate">
                {currentTrack.title ||
                  currentTrack.name.replace(/\.[^/.]+$/, "")}
              </p>
              <p className="text-xs text-white/30 truncate">
                {currentTrack.artist || "Unknown artist"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Up Next */}
      {upNext.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-2">
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
                className="w-full flex items-center gap-3 py-2.5 hover:bg-white/5 rounded transition-colors text-left"
              >
                <span className="text-xs font-mono text-white/20 w-6 text-right">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-white/70 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-white/30 truncate">
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
        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-xs font-mono text-white/20 uppercase tracking-widest mb-2">
            Played
          </p>
          {played.map((track, i) => {
            const displayName =
              track.title || track.name.replace(/\.[^/.]+$/, "");

            return (
              <button
                key={`${track.id}-played-${i}`}
                onClick={() => onPlayTrack(track, i)}
                className="w-full flex items-center gap-3 py-2 hover:bg-white/5 rounded transition-colors text-left opacity-50"
              >
                <span className="text-xs font-mono text-white/20 w-6 text-right">
                  {i + 1}
                </span>
                <p className="text-sm text-white/50 truncate">{displayName}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface Track {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  // Metadata fields populated later (M2)
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  artUrl?: string;
}

export type RepeatMode = "off" | "one" | "all";

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
}

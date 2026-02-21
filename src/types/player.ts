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
  queue: Track[];          // Internal play order (library tracks)
  queueIndex: number;
  userQueue: Track[];      // User's manual queue (added one-by-one)
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
}

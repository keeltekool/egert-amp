"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Track, RepeatMode, PlayerState } from "@/types/player";
import { getStreamUrl } from "@/lib/drive";

const VOLUME_KEY = "egert_amp_volume";
const QUEUE_KEY = "egert_amp_queue";

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function usePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    userQueue: [],
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 0.8,
    isMuted: false,
    shuffle: false,
    repeat: "off",
  });

  // Seek debounce: suppress timeupdate for 300ms after a programmatic seek
  const lastSeekTimeRef = useRef(0);
  // Track the preloaded file ID to avoid redundant loads
  const preloadedIdRef = useRef<string | null>(null);

  // Initialize audio elements
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    // Hidden preload element for next track — only starts after current plays
    const preload = new Audio();
    preload.preload = "auto";
    preload.volume = 0;
    preloadRef.current = preload;

    // Restore volume
    const savedVolume = localStorage.getItem(VOLUME_KEY);
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      audio.volume = vol;
      setState((s) => ({ ...s, volume: vol }));
    }

    // Audio event handlers
    const onTimeUpdate = () => {
      // Suppress updates during/right after seeking to prevent snap-back
      if (Date.now() - lastSeekTimeRef.current < 300) return;
      if (audio.seeking) return;
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    };
    const onDurationChange = () =>
      setState((s) => ({ ...s, duration: audio.duration || 0 }));
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () => {
      handleTrackEnded();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
      preload.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preload next track ONLY after current track starts playing
  useEffect(() => {
    const audio = audioRef.current;
    const preload = preloadRef.current;
    if (!audio || !preload) return;

    // Preload priority: userQueue first, then library queue
    const { userQueue, queue, queueIndex } = state;
    let nextTrack: Track | undefined;
    if (userQueue.length > 0) {
      nextTrack = userQueue[0];
    } else {
      const nextIndex = queueIndex + 1;
      if (nextIndex < queue.length) {
        nextTrack = queue[nextIndex];
      }
    }

    if (!nextTrack) return;
    if (preloadedIdRef.current === nextTrack.id) return;

    const startPreload = () => {
      if (!nextTrack || preloadedIdRef.current === nextTrack.id) return;
      preloadedIdRef.current = nextTrack.id;
      preload.src = getStreamUrl(nextTrack.id);
      preload.load();
    };

    if (!audio.paused && audio.currentTime > 0) {
      startPreload();
    } else {
      audio.addEventListener("playing", startPreload, { once: true });
      return () => audio.removeEventListener("playing", startPreload);
    }
  }, [state.queueIndex, state.queue, state.userQueue]);

  // Handle track ended — userQueue first, then library play order
  const handleTrackEnded = useCallback(() => {
    setState((prev) => {
      const { repeat, queue, queueIndex, userQueue } = prev;

      if (repeat === "one") {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        return prev;
      }

      // If user queue has tracks, consume the first one
      if (userQueue.length > 0) {
        const nextTrack = userQueue[0];
        const remainingUserQueue = userQueue.slice(1);
        if (audioRef.current) {
          audioRef.current.src = getStreamUrl(nextTrack.id);
          audioRef.current.play();
        }
        return {
          ...prev,
          currentTrack: nextTrack,
          userQueue: remainingUserQueue,
        };
      }

      // Otherwise advance in library play order
      let nextIndex = queueIndex + 1;

      if (nextIndex >= queue.length) {
        if (repeat === "all") {
          nextIndex = 0;
        } else {
          return { ...prev, isPlaying: false, currentTime: 0 };
        }
      }

      const nextTrack = queue[nextIndex];
      if (nextTrack && audioRef.current) {
        audioRef.current.src = getStreamUrl(nextTrack.id);
        audioRef.current.play();
      }

      return {
        ...prev,
        currentTrack: nextTrack || null,
        queueIndex: nextIndex,
      };
    });
  }, []);

  // Play a specific track from a list
  const playTrack = useCallback((track: Track, tracks: Track[], index: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    preloadedIdRef.current = null;

    audio.src = getStreamUrl(track.id);
    audio.play();

    setState((s) => ({
      ...s,
      currentTrack: track,
      queue: s.shuffle ? shuffleArray(tracks) : tracks,
      queueIndex: index,
      isPlaying: true,
    }));

    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify({ tracks, index }));
    } catch {}
  }, []);

  // Play all tracks (optionally shuffled)
  const playAll = useCallback((tracks: Track[], shuffled = false) => {
    if (tracks.length === 0) return;
    const ordered = shuffled ? shuffleArray(tracks) : tracks;
    playTrack(ordered[0], ordered, 0);
    setState((s) => ({ ...s, shuffle: shuffled }));
  }, [playTrack]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    lastSeekTimeRef.current = Date.now();
    audio.currentTime = time;
    setState((s) => ({ ...s, currentTime: time }));
  }, []);

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = vol;
    audio.muted = false;
    setState((s) => ({ ...s, volume: vol, isMuted: false }));
    localStorage.setItem(VOLUME_KEY, vol.toString());
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setState((s) => ({ ...s, isMuted: !s.isMuted }));
  }, []);

  // Next track: userQueue first, then library order
  const nextTrack = useCallback(() => {
    setState((prev) => {
      const { queue, queueIndex, repeat, userQueue } = prev;

      // Consume from user queue first
      if (userQueue.length > 0) {
        const track = userQueue[0];
        const remainingUserQueue = userQueue.slice(1);
        if (audioRef.current) {
          preloadedIdRef.current = null;
          audioRef.current.src = getStreamUrl(track.id);
          audioRef.current.play();
        }
        return { ...prev, currentTrack: track, userQueue: remainingUserQueue };
      }

      // Otherwise advance in library
      let nextIndex = queueIndex + 1;

      if (nextIndex >= queue.length) {
        if (repeat === "all") nextIndex = 0;
        else return prev;
      }

      const track = queue[nextIndex];
      if (track && audioRef.current) {
        preloadedIdRef.current = null;
        audioRef.current.src = getStreamUrl(track.id);
        audioRef.current.play();
      }

      return { ...prev, currentTrack: track, queueIndex: nextIndex };
    });
  }, []);

  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // If more than 3 seconds in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    setState((prev) => {
      const { queue, queueIndex, repeat } = prev;
      let prevIndex = queueIndex - 1;

      if (prevIndex < 0) {
        if (repeat === "all") prevIndex = queue.length - 1;
        else return prev;
      }

      const track = queue[prevIndex];
      if (track && audioRef.current) {
        preloadedIdRef.current = null;
        audioRef.current.src = getStreamUrl(track.id);
        audioRef.current.play();
      }

      return { ...prev, currentTrack: track, queueIndex: prevIndex };
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((prev) => {
      const newShuffle = !prev.shuffle;
      if (newShuffle && prev.queue.length > 0) {
        const currentTrack = prev.currentTrack;
        const rest = prev.queue.filter((t) => t.id !== currentTrack?.id);
        const shuffled = currentTrack
          ? [currentTrack, ...shuffleArray(rest)]
          : shuffleArray(prev.queue);
        return { ...prev, shuffle: true, queue: shuffled, queueIndex: 0 };
      }
      return { ...prev, shuffle: newShuffle };
    });
  }, []);

  const setRepeat = useCallback((mode: RepeatMode) => {
    setState((s) => ({ ...s, repeat: mode }));
  }, []);

  const cycleRepeat = useCallback(() => {
    setState((s) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const current = modes.indexOf(s.repeat);
      const next = modes[(current + 1) % modes.length];
      return { ...s, repeat: next };
    });
  }, []);

  // Add a track to user queue (manually, one by one)
  const addToQueue = useCallback((track: Track) => {
    setState((prev) => ({
      ...prev,
      userQueue: [...prev.userQueue, track],
    }));
  }, []);

  // Remove a track from user queue by index
  const removeFromQueue = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      userQueue: prev.userQueue.filter((_, i) => i !== index),
    }));
  }, []);

  // Clear ALL user queue tracks — total wipe
  const clearQueue = useCallback(() => {
    setState((prev) => ({ ...prev, userQueue: [] }));
  }, []);

  // Play a specific track from user queue by index (removes it from queue)
  const playFromQueue = useCallback((index: number) => {
    setState((prev) => {
      const track = prev.userQueue[index];
      if (!track) return prev;
      if (audioRef.current) {
        preloadedIdRef.current = null;
        audioRef.current.src = getStreamUrl(track.id);
        audioRef.current.play();
      }
      return {
        ...prev,
        currentTrack: track,
        userQueue: prev.userQueue.filter((_, i) => i !== index),
      };
    });
  }, []);

  // Merge metadata into queue, userQueue, and current track
  const updateMetadata = useCallback(
    (meta: Record<string, { title?: string; artist?: string; album?: string }>) => {
      setState((prev) => {
        const queue = prev.queue.map((t) => {
          const m = meta[t.id];
          return m ? { ...t, ...m } : t;
        });
        const userQueue = prev.userQueue.map((t) => {
          const m = meta[t.id];
          return m ? { ...t, ...m } : t;
        });
        const currentTrack =
          prev.currentTrack && meta[prev.currentTrack.id]
            ? { ...prev.currentTrack, ...meta[prev.currentTrack.id] }
            : prev.currentTrack;
        return { ...prev, queue, userQueue, currentTrack };
      });
    },
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          if (e.shiftKey) nextTrack();
          else seek((audioRef.current?.currentTime ?? 0) + 10);
          break;
        case "ArrowLeft":
          if (e.shiftKey) prevTrack();
          else seek(Math.max(0, (audioRef.current?.currentTime ?? 0) - 10));
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(1, (audioRef.current?.volume ?? 0.8) + 0.05));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, (audioRef.current?.volume ?? 0.8) - 0.05));
          break;
        case "KeyM":
          toggleMute();
          break;
        case "KeyS":
          toggleShuffle();
          break;
        case "KeyR":
          cycleRepeat();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, nextTrack, prevTrack, seek, setVolume, toggleMute, toggleShuffle, cycleRepeat]);

  return {
    ...state,
    audioRef,
    playTrack,
    playAll,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    setRepeat,
    cycleRepeat,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playFromQueue,
    updateMetadata,
  };
}

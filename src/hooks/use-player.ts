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
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 0.8,
    isMuted: false,
    shuffle: false,
    repeat: "off",
  });

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    // Restore volume
    const savedVolume = localStorage.getItem(VOLUME_KEY);
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      audio.volume = vol;
      setState((s) => ({ ...s, volume: vol }));
    }

    // Audio event handlers
    const onTimeUpdate = () =>
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    const onDurationChange = () =>
      setState((s) => ({ ...s, duration: audio.duration || 0 }));
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () => {
      // Trigger next track logic
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle track ended — next track logic
  const handleTrackEnded = useCallback(() => {
    setState((prev) => {
      const { repeat, queue, queueIndex, shuffle } = prev;

      if (repeat === "one") {
        // Replay same track
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        return prev;
      }

      let nextIndex = queueIndex + 1;

      if (nextIndex >= queue.length) {
        if (repeat === "all") {
          nextIndex = 0;
        } else {
          // End of queue, stop playing
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

    audio.src = getStreamUrl(track.id);
    audio.play();

    setState((s) => ({
      ...s,
      currentTrack: track,
      queue: s.shuffle ? shuffleArray(tracks) : tracks,
      queueIndex: index,
      isPlaying: true,
    }));

    // Save queue to localStorage
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

  const nextTrack = useCallback(() => {
    setState((prev) => {
      const { queue, queueIndex, repeat } = prev;
      let nextIndex = queueIndex + 1;

      if (nextIndex >= queue.length) {
        if (repeat === "all") nextIndex = 0;
        else return prev;
      }

      const track = queue[nextIndex];
      if (track && audioRef.current) {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
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
  };
}

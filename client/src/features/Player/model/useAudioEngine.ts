"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePlaybackStore } from "@/entities/playback";
import { BASE_URL } from "@/shared/config/config";

const isUsableDuration = (value: number) => Number.isFinite(value) && value >= 0;

export function useAudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const active = usePlaybackStore((state) => state.active);
  const pause = usePlaybackStore((state) => state.pause);
  const volume = usePlaybackStore((state) => state.volume);
  const isRepeat = usePlaybackStore((state) => state.isRepeat);
  const playbackRequest = usePlaybackStore((state) => state.playbackRequest);
  const next = usePlaybackStore((state) => state.next);
  const pauseTrack = usePlaybackStore((state) => state.pauseTrack);
  const restart = usePlaybackStore((state) => state.restart);
  const setCurrentTime = usePlaybackStore((state) => state.setCurrentTime);
  const setDuration = usePlaybackStore((state) => state.setDuration);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => {
      if (isUsableDuration(audio.duration)) setDuration(audio.duration);
    };
    const updateCurrentTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      if (isRepeat) {
        restart();
        return;
      }
      next();
    };

    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("timeupdate", updateCurrentTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", pauseTrack);

    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("timeupdate", updateCurrentTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", pauseTrack);
    };
  }, [active, isRepeat, next, pauseTrack, restart, setCurrentTime, setDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !active) return;

    const source = `${BASE_URL}${active.audio}`;
    const isNewSource = audio.dataset.playbackSource !== source;

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);

    if (isNewSource) {
      audio.dataset.playbackSource = source;
      audio.src = source;
      audio.load();
      return;
    }

    if (!usePlaybackStore.getState().pause) {
      void audio.play().catch(() => pauseTrack());
    }
  }, [active, pauseTrack, playbackRequest, setCurrentTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !active) return;

    if (pause) {
      audio.pause();
      return;
    }

    void audio.play().catch(() => pauseTrack());
  }, [active, pause, pauseTrack]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio || !isUsableDuration(audio.duration)) return;

      const nextTime = Math.min(Math.max(0, time), audio.duration);
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [setCurrentTime]
  );

  return { audioRef, seek };
}

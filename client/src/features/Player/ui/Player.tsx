"use client";

import { Heart, Pause, Play, Repeat2, Shuffle, SkipBack, SkipForward } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePlaybackStore } from "@/entities/playback";
import useCollectionStore from "@/shared/store/collection";
import { Button } from "@/shared/ui/button";
import { Slider } from "@/shared/ui/slider";
import { useAudioEngine } from "../model/useAudioEngine";
import { VolumeControl } from "./VolumeControl";

const formatTime = (seconds: number) => {
  const value = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
  const minutes = Math.floor(value / 60);
  const sec = Math.floor(value % 60);
  return `${minutes}:${sec < 10 ? "0" : ""}${sec}`;
};

export default function Player() {
  const active = usePlaybackStore((state) => state.active);
  const currentTime = usePlaybackStore((state) => state.currentTime);
  const duration = usePlaybackStore((state) => state.duration);
  const pause = usePlaybackStore((state) => state.pause);
  const context = usePlaybackStore((state) => state.context);
  const isRepeat = usePlaybackStore((state) => state.isRepeat);
  const isShuffle = usePlaybackStore((state) => state.isShuffle);
  const playTrack = usePlaybackStore((state) => state.playTrack);
  const pauseTrack = usePlaybackStore((state) => state.pauseTrack);
  const next = usePlaybackStore((state) => state.next);
  const previous = usePlaybackStore((state) => state.previous);
  const replaceQueue = usePlaybackStore((state) => state.replaceQueue);
  const toggleRepeat = usePlaybackStore((state) => state.toggleRepeat);
  const toggleShuffle = usePlaybackStore((state) => state.toggleShuffle);
  const { userTracks, getUserTracks, addTrackToCollection, removeTrackFromCollection } = useCollectionStore();
  const { audioRef, seek } = useAudioEngine();
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [tempTime, setTempTime] = useState<number | null>(null);

  useEffect(() => {
    const value = Number(localStorage.getItem("collection"));
    setCollectionId(Number.isInteger(value) && value > 0 ? value : null);
  }, []);

  useEffect(() => {
    if (active && collectionId !== null) void getUserTracks(collectionId);
  }, [active, collectionId, getUserTracks]);

  useEffect(() => {
    if (context?.type === "favorites" && context.collectionId === collectionId) {
      replaceQueue(userTracks, context);
    }
  }, [collectionId, context, replaceQueue, userTracks]);

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const seekValue = safeDuration > 0 ? Math.min(currentTime, safeDuration) : 0;

  const handleSliderPointerUp = () => {
    if (tempTime === null || safeDuration === 0) return;
    seek(tempTime);
    setTempTime(null);
  };

  const handleLoveIconClick = () => {
    if (!active || collectionId === null) return;
    const isFilled = userTracks.some((track) => track.id === active.id);

    if (isFilled) {
      void removeTrackFromCollection(collectionId, active.id);
      return;
    }
    void addTrackToCollection(collectionId, active);
  };

  if (!active) return null;

  const isFilled = userTracks.some((track) => track.id === active.id);

  return (
    <section
      aria-label="Audio player"
      className="grid grid-cols-1 gap-3 rounded-b-[20px] bg-[#1E212A] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-5 sm:gap-y-3 sm:p-5 lg:grid-cols-[minmax(0,280px)_auto_minmax(0,439px)_auto] lg:items-center"
    >
      <audio ref={audioRef} aria-hidden="true" className="hidden" preload="metadata" />

      <div className="min-w-0 lg:max-w-[280px]">
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <Link href={`/album/${active.albumId}`} className="block w-full truncate text-sm text-white">
            {active.name}
          </Link>
          <Link href={`/author/${active.authorId}`} className="block w-full truncate text-xs text-[#ACB0B1]">
            {active.authorName}
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 sm:justify-self-center">
        <Button type="button" variant="ghost" size="icon" aria-label="Previous track" onClick={previous}>
          <SkipBack data-icon="inline-start" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={pause ? "Play" : "Pause"}
          onClick={pause ? playTrack : pauseTrack}
        >
          {pause ? <Play data-icon="inline-start" /> : <Pause data-icon="inline-start" />}
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Next track" onClick={next}>
          <SkipForward data-icon="inline-start" />
        </Button>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:col-span-2 lg:contents">
        <div className="flex min-w-0 flex-col gap-1.5 lg:self-end">
          <Slider
            aria-label="Playback position"
            variant="player"
            value={[tempTime ?? seekValue]}
            max={Math.max(safeDuration, 1)}
            step={1}
            disabled={safeDuration === 0}
            onChange={([value]) => setTempTime(value)}
            onPointerUp={handleSliderPointerUp}
          />
          <div className="flex justify-between text-xs tabular-nums text-white">
            <span>{formatTime(seekValue)}</span>
            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 lg:justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isFilled ? "Remove track from favorites" : "Add track to favorites"}
            aria-pressed={isFilled}
            className={isFilled ? "text-player-accent hover:text-player-accent" : undefined}
            onClick={handleLoveIconClick}
          >
            <Heart data-icon="inline-start" fill={isFilled ? "currentColor" : "none"} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Repeat playlist"
            aria-pressed={isRepeat}
            className={isRepeat ? "text-player-accent hover:text-player-accent" : undefined}
            onClick={toggleRepeat}
          >
            <Repeat2 data-icon="inline-start" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Shuffle playlist"
            aria-pressed={isShuffle}
            className={isShuffle ? "text-player-accent hover:text-player-accent" : undefined}
            onClick={toggleShuffle}
          >
            <Shuffle data-icon="inline-start" />
          </Button>
          <VolumeControl />
        </div>
      </div>
    </section>
  );
}

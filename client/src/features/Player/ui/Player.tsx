"use client";

import { Disc3, Heart, Menu, Pause, Play, Repeat2, Shuffle, SkipBack, SkipForward, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePlaybackStore } from "@/entities/playback";
import { useFavoriteTracksStore } from "@/entities/track";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
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
  const favoriteTracks = useFavoriteTracksStore((state) => state.items);
  const favoriteStatuses = useFavoriteTracksStore((state) => state.statusById);
  const checkingTrackId = useFavoriteTracksStore((state) => state.checkingTrackId);
  const mutatingTrackId = useFavoriteTracksStore((state) => state.mutatingTrackId);
  const favoriteError = useFavoriteTracksStore((state) => state.mutationError);
  const checkFavoriteStatus = useFavoriteTracksStore((state) => state.checkStatus);
  const addFavorite = useFavoriteTracksStore((state) => state.add);
  const removeFavorite = useFavoriteTracksStore((state) => state.remove);
  const clearFavoriteError = useFavoriteTracksStore((state) => state.clearMutationError);
  const { audioRef, seek } = useAudioEngine();
  const [tempTime, setTempTime] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!active) return;
    clearFavoriteError();
    void checkFavoriteStatus(active.id);
  }, [active, checkFavoriteStatus, clearFavoriteError]);

  useEffect(() => setDetailsOpen(false), [active?.id]);

  useEffect(() => {
    if (context?.type === "favorites") {
      replaceQueue(favoriteTracks, context);
    }
  }, [context, favoriteTracks, replaceQueue]);

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const seekValue = safeDuration > 0 ? Math.min(currentTime, safeDuration) : 0;

  const handleSliderPointerUp = () => {
    if (tempTime === null || safeDuration === 0) return;
    seek(tempTime);
    setTempTime(null);
  };

  const handleLoveIconClick = async () => {
    if (!active || favoriteStatuses[active.id] === undefined) return;
    if (favoriteStatuses[active.id]) {
      await removeFavorite(active.id);
    } else {
      await addFavorite(active);
    }
  };

  if (!active) return null;

  const isFilled = favoriteStatuses[active.id] === true;
  const favoritePending =
    favoriteStatuses[active.id] === undefined ||
    checkingTrackId === active.id ||
    mutatingTrackId === active.id;
  const authors = [
    ...(active.authorId ? [{ id: active.authorId, name: active.authorName }] : []),
    ...(active.featuredAuthors ?? []),
  ].filter((author, index, list) => list.findIndex((item) => item.id === author.id) === index);
  const albums = (active.albums?.length
    ? active.albums
    : []
  ).filter((album, index, list) => list.findIndex((item) => item.id === album.id) === index);

  return (
    <section
      aria-label="Audio player"
      className="grid grid-cols-1 gap-3 rounded-b-[20px] bg-[#1E212A] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-5 sm:gap-y-3 sm:p-5 lg:grid-cols-[minmax(0,280px)_auto_minmax(0,439px)_auto] lg:items-center"
    >
      <audio ref={audioRef} aria-hidden="true" className="hidden" preload="metadata" />

      <div className="min-w-0 lg:max-w-[280px]">
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          {albums[0] ? (
            <Link href={`/album/${albums[0].id}`} className="block w-full truncate text-sm text-white">{active.name}</Link>
          ) : <p className="w-full truncate text-sm text-white">{active.name}</p>}
          {active.authorId ? (
            <Link href={`/authors/${active.authorId}`} className="block w-full truncate text-xs text-[#ACB0B1]">{active.authorName}</Link>
          ) : <p className="w-full truncate text-xs text-[#ACB0B1]">{active.authorName}</p>}
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
            aria-busy={favoritePending}
            disabled={favoritePending}
            className={isFilled ? "text-player-accent hover:text-player-accent" : undefined}
            onClick={() => void handleLoveIconClick()}
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
          <DropdownMenu open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Сведения о треке"
                aria-expanded={detailsOpen}
              >
                <Menu data-icon="inline-start" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="bnr-scrollbar bnr-scrollbar-compact min-w-64 border-bnr-line bg-bnr-surface text-bnr-bone"
            >
              <DropdownMenuLabel className="font-cinzel text-[10px] tracking-[.16em] text-bnr-lilac">
                АВТОРЫ
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {authors.map((author) => (
                  <DropdownMenuItem key={author.id} asChild>
                    <Link href={`/authors/${author.id}`} aria-label={`Открыть автора ${author.name}`}>
                      <UserRound aria-hidden="true" />
                      <span className="truncate">{author.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-bnr-line" />
              <DropdownMenuLabel className="font-cinzel text-[10px] tracking-[.16em] text-bnr-lilac">
                АЛЬБОМЫ
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {albums.length ? albums.map((album) => (
                  <DropdownMenuItem key={album.id} asChild>
                    <Link href={`/album/${album.id}`} aria-label={`Открыть альбом ${album.name}`}>
                      <Disc3 aria-hidden="true" />
                      <span className="truncate">{album.name}</span>
                    </Link>
                  </DropdownMenuItem>
                )) : (
                  <DropdownMenuItem disabled>
                    <Disc3 aria-hidden="true" />
                    <span>Сингл</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <VolumeControl />
        </div>
      </div>
      {favoriteError ? (
        <p role="alert" className="text-xs text-destructive sm:col-span-2 lg:col-span-4">
          {favoriteError}
        </p>
      ) : null}
    </section>
  );
}

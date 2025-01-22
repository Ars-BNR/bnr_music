"use client";

import React, { useEffect, useRef, useState } from "react";
import NextIcon from "../../../public/assets/icons/Next";
import BackIcon from "../../../public/assets/icons/Back";
import PlayIcon from "../../../public/assets/icons/Play";
import { Slider } from "@/shared/components/ui/slider";
import LoveIcon from "../../../public/assets/icons/Love";
import RepeatIcon from "../../../public/assets/icons/Repeat";
import ShakeIcon from "../../../public/assets/icons/Shake";
import VolumeIcon from "../../../public/assets/icons/Volume";
import PauseIcon from "../../../public/assets/icons/Pause";
import usePlayerStore from "@/shared/store/player";
import useTrackStore from "@/shared/store/track";
import Link from "next/link";
import useCollectionStore from "@/shared/store/collection";
import { BASE_URL } from "@/shared/config/config";

const Player = () => {
  const {
    active,
    currentTime,
    duration,
    pause,
    volume,
    pauseTrack,
    setCurrentTime,
    setDuration,
    setVolume,
    playTrack,
    setActiveTrack,
  } = usePlayerStore();

  const [collectionId, setCollectionId] = useState<number>(0);

  const {
    userTracks,
    getUserTracks,
    addTrackToCollection,
    removeTrackFromCollection,
  } = useCollectionStore();
  const { tracks } = useTrackStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = Number(localStorage.getItem("collection"));
      setCollectionId(id);
    }
  }, []);
  useEffect(() => {
    if (collectionId !== null) {
      if (active !== null) {
        getUserTracks(collectionId);
      }
    }
  }, [active, collectionId]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [tempTime, setTempTime] = useState<number | null>(null);

  const handleSliderPointerUp = () => {
    if (audioRef.current && tempTime !== null) {
      audioRef.current.currentTime = tempTime;
      setCurrentTime(tempTime);
      setTempTime(null);
    }
  };
  const handleSliderChange = (value: number[]) => {
    setTempTime(value[0]);
  };

  const [isFilled, setIsFilled] = useState(false);

  const [isRepeat, setIsRepeat] = useState(false);

  const [isShuffle, setIsShuffle] = useState(false);

  const [shuffledTracks, setShuffledTracks] = useState<any[]>([]);

  useEffect(() => {
    if (active) {
      setIsFilled(userTracks.some((track) => track.id === active.id));
    }
  }, [active, userTracks]);

  const shuffleTracks = (tracks: any[]) => {
    const shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleShakeClick = () => {
    if (isShuffle) {
      setShuffledTracks([]);
    } else {
      const shuffled = shuffleTracks(tracks);
      setShuffledTracks(shuffled);
    }
    setIsShuffle(!isShuffle);
  };

  const handleLoveIconClick = async () => {
    if (!active) return;

    if (isFilled) {
      try {
        await removeTrackFromCollection(collectionId, active.id);
        setIsFilled(false);
      } catch (error) {
        console.error("Ошибка при удалении трека из коллекции:", error);
      }
    } else {
      try {
        await addTrackToCollection(collectionId, active.id);
        setIsFilled(true);
      } catch (error) {
        console.error("Ошибка при добавлении трека в коллекцию:", error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${minutes}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const setAudio = async () => {
    if (active && audioRef.current) {
      try {
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
        audioRef.current.currentTime = 0;

        audioRef.current.src = BASE_URL + active.audio;
        audioRef.current.volume = volume / 100;

        audioRef.current.onloadedmetadata = () => {
          setDuration(Math.ceil(audioRef.current!.duration));
        };

        audioRef.current.ontimeupdate = () => {
          setCurrentTime(Math.ceil(audioRef.current!.currentTime));
        };

        audioRef.current.onended = handleEnded;

        audioRef.current.oncanplay = async () => {
          try {
            if (pause === false) {
              await audioRef.current!.play();
            }
          } catch (error) {
            console.error("Error playing audio:", error);
          }
        };
      } catch (error) {
        console.error("Error setting audio:", error);
      }
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    setAudio();
  }, [active]);

  const play = async () => {
    if (audioRef.current && audioRef.current.paused) {
      try {
        await audioRef.current.play();
        playTrack();
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    } else {
      audioRef.current?.pause();
      pauseTrack();
    }
  };

  const handleVolumeChangeSlider = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
      setVolume(value[0]);
    }
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (isShuffle && shuffledTracks.length > 0) {
      const currentIndex = shuffledTracks.findIndex(
        (track) => track.id === active?.id
      );
      const nextIndex = (currentIndex + 1) % shuffledTracks.length;
      const nextTrack = shuffledTracks[nextIndex];
      setActiveTrack(nextTrack);
      playTrack();
    } else {
      if (tracks.length > 0 && active) {
        const currentIndex = tracks.findIndex(
          (track) => track.id === active.id
        );
        const nextIndex = (currentIndex + 1) % tracks.length;
        const nextTrack = tracks[nextIndex];
        setActiveTrack(nextTrack);
        playTrack();
      }
    }
  };

  const handleRepeatClick = () => {
    setIsRepeat((prev) => !prev);
  };
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = handleEnded;
    }
  }, [isRepeat]);

  useEffect(() => {
    if (isShuffle) {
      const shuffled = shuffleTracks(tracks);
      setShuffledTracks(shuffled);
    }
  }, [tracks, isShuffle]);

  const handlePreviousTrack = () => {
    if (tracks.length > 0 && active) {
      const currentIndex = tracks.findIndex((track) => track.id === active.id);
      const previousIndex =
        currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
      const previousTrack = tracks[previousIndex];
      setActiveTrack(previousTrack);
      playTrack();
    }
  };

  if (!active) {
    return null;
  }

  return (
    <div className="bg-[#1E212A] flex p-5 grow items-center rounded-b-[20px] justify-between">
      <div className="flex gap-[20px] items-center max-w-[280px] grow">
        <div className="flex flex-col gap-[7px] items-start max-w-[280px] grow">
          <Link
            href={`/album/${active.albumId}`}
            className="text-[14px] text-white"
          >
            {active.name}
          </Link>
          <Link
            href={`/author/${active.authorId}`}
            className="text-[#ACB0B1] text-[12px]"
          >
            {active.authorName}
          </Link>
        </div>
      </div>
      <div className="flex gap-[24px]">
        <BackIcon
          onClick={() => {
            handlePreviousTrack();
          }}
        />
        {pause ? (
          <PlayIcon handlePlay={play} />
        ) : (
          <PauseIcon handlePlay={play} />
        )}

        <NextIcon
          onClick={() => {
            handleEnded();
          }}
        />
      </div>

      <div className="max-w-[439px] w-full flex flex-col gap-[5px] self-end">
        <Slider
          value={[tempTime !== null ? tempTime : currentTime]}
          max={duration}
          step={1}
          onChange={handleSliderChange}
          onPointerUp={handleSliderPointerUp}
        />
        <div className="flex justify-between">
          <span className="text-white">{formatTime(currentTime)}</span>
          <span className="text-white">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex gap-[20px]">
        <LoveIcon isFilled={isFilled} onClick={handleLoveIconClick} />
        <RepeatIcon onClick={handleRepeatClick} isActive={isRepeat} />
        <ShakeIcon onClick={handleShakeClick} isActive={isShuffle} />
        <VolumeIcon changeVolume={handleVolumeChangeSlider} />
      </div>
    </div>
  );
};

export default Player;

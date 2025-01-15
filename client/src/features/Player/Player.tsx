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

  const collectionId = Number(localStorage.getItem("collection"));
  const {
    userTracks,
    getUserTracks,
    addTrackToCollection,
    removeTrackFromCollection,
  } = useCollectionStore();
  const { tracks, setTracks } = useTrackStore();

  useEffect(() => {
    if (collectionId !== null) {
      if (active !== null) {
        getUserTracks(collectionId);
      }
    }
  }, []);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  const [isHoldingNext, setIsHoldingNext] = useState(false);
  const [isHoldingBack, setIsHoldingBack] = useState(false);

  const [isFilled, setIsFilled] = useState(false);

  const [isRepeat, setIsRepeat] = useState(false);

  useEffect(() => {
    if (active) {
      setIsFilled(userTracks.some((track) => track.id === active.id));
    }
  }, [active, userTracks]);

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

        audioRef.current.src = "http://localhost:8340/" + active.audio;
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

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

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

  const changeCurrentTime = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHoldingNext && audioRef.current) {
      interval = setInterval(() => {
        const newTime = Math.min(audioRef.current!.currentTime + 2, duration);
        audioRef.current!.currentTime = newTime;
        setCurrentTime(newTime);
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isHoldingNext, duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHoldingBack && audioRef.current) {
      interval = setInterval(() => {
        const newTime = Math.max(audioRef.current!.currentTime - 2, 0);
        audioRef.current!.currentTime = newTime;
        setCurrentTime(newTime);
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isHoldingBack]);

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
            href={`/album/${active.authorId}`}
            className="text-[#ACB0B1] text-[12px]"
          >
            {active.authorName}
          </Link>
        </div>
      </div>
      <div className="flex gap-[24px]">
        <BackIcon
          onClick={() => {
            if (isHoldingNext === false) {
              handlePreviousTrack();
            }
          }}
          onPointerDown={() => {
            setIsHoldingBack(true);
            pauseTrack();
          }}
          onPointerUp={() => {
            setIsHoldingBack(false);
            if (pause) {
              playTrack();
            }
          }}
        />
        {pause ? (
          <PlayIcon handlePlay={play} />
        ) : (
          <PauseIcon handlePlay={play} />
        )}

        <NextIcon
          onClick={() => {
            if (isHoldingNext === false) {
              handleEnded();
            }
          }}
          onPointerDown={() => {
            setIsHoldingNext(true);
            pauseTrack();
          }}
          onPointerUp={() => {
            setIsHoldingNext(false);
            if (pause) {
              playTrack();
            }
          }}
        />
      </div>

      <div className="max-w-[439px] w-full flex flex-col gap-[5px] self-end">
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onChange={changeCurrentTime}
          onPointerDown={() => {
            setIsSeeking(true);
            pauseTrack();
          }}
          onPointerUp={() => {
            setIsSeeking(false);
            if (pause) {
              playTrack();
            }
          }}
        />
        <div className="flex justify-between">
          <span className="text-white">{formatTime(currentTime)}</span>
          <span className="text-white">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex gap-[20px]">
        <LoveIcon isFilled={isFilled} onClick={handleLoveIconClick} />
        <RepeatIcon onClick={handleRepeatClick} isActive={isRepeat} />
        <ShakeIcon />
        <VolumeIcon changeVolume={handleVolumeChangeSlider} />
      </div>
    </div>
  );
};

export default Player;

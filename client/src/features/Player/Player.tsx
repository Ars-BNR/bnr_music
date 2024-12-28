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

  const { tracks } = useTrackStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  const [isHoldingNext, setIsHoldingNext] = useState(false); // Состояние для удержания кнопки "Вперед"
  const [isHoldingBack, setIsHoldingBack] = useState(false); // Состояние для удержания кнопки "Назад"

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${minutes}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const setAudio = () => {
    if (active && audioRef.current) {
      audioRef.current.src = "http://localhost:8340/" + active.audio;
      audioRef.current.volume = volume / 100;
      audioRef.current.onloadedmetadata = () => {
        setDuration(Math.ceil(audioRef.current!.duration));
      };
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(Math.ceil(audioRef.current!.currentTime));
      };
      audioRef.current.onended = handleEnded;
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    setAudio();
  }, [active]);

  useEffect(() => {
    if (audioRef.current) {
      if (pause) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    }
  }, [pause]);

  useEffect(() => {
    if (active && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  }, [active]);

  const play = () => {
    if (pause) {
      playTrack();
    } else {
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
    console.log("value", value);
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleEnded = () => {
    if (tracks.length > 0 && active) {
      const currentIndex = tracks.findIndex((track) => track.id === active.id);
      console.log("currentIndex", currentIndex);
      const nextIndex = (currentIndex + 1) % tracks.length;
      console.log("nextIndex", nextIndex);
      const nextTrack = tracks[nextIndex];
      setActiveTrack(nextTrack);
      playTrack();
    }
  };

  const handlePreviousTrack = () => {
    if (tracks.length > 0 && active) {
      const currentIndex = tracks.findIndex((track) => track.id === active.id);
      const previousIndex =
        currentIndex === 0 ? tracks.length - 1 : currentIndex - 1; // Переход на предыдущий трек
      const previousTrack = tracks[previousIndex];
      setActiveTrack(previousTrack);
      playTrack();
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHoldingNext && audioRef.current) {
      interval = setInterval(() => {
        const newTime = Math.min(audioRef.current!.currentTime + 2, duration); // Перемотка на 2 секунды вперед
        audioRef.current!.currentTime = newTime;
        setCurrentTime(newTime);
      }, 200); // Интервал перемотки
    }
    return () => clearInterval(interval);
  }, [isHoldingNext, duration]);

  // Перемотка назад, пока кнопка удерживается
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHoldingBack && audioRef.current) {
      interval = setInterval(() => {
        const newTime = Math.max(audioRef.current!.currentTime - 2, 0); // Перемотка на 2 секунды назад
        audioRef.current!.currentTime = newTime;
        setCurrentTime(newTime);
      }, 200); // Интервал перемотки
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
          <p className="text-[14px] text-white">{active.name}</p>
          <p className="text-[#ACB0B1] text-[12px]">{active.authorName}</p>
        </div>
      </div>
      <div className="flex gap-[24px]">
        <BackIcon
          onClick={handlePreviousTrack}
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
          onClick={handleEnded} // Обработчик клика
          onPointerDown={() => {
            setIsHoldingNext(true); // Начало перемотки вперед
            pauseTrack(); // Приостанавливаем воспроизведение
          }}
          onPointerUp={() => {
            setIsHoldingNext(false); // Окончание перемотки вперед
            if (!pause) {
              playTrack(); // Возобновляем воспроизведение, если оно не было приостановлено
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
        <LoveIcon />
        <RepeatIcon />
        <ShakeIcon />
        <VolumeIcon changeVolume={handleVolumeChangeSlider} />
      </div>
    </div>
  );
};

export default Player;

"use client";

import React, { useEffect } from "react";
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

let audio: HTMLAudioElement;

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
  } = usePlayerStore();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${minutes}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const setAudio = () => {
    if (active) {
      console.log("active", active);
      audio.src = "http://localhost:8340/" + active.audio;
      audio.volume = volume / 100;
      audio.onloadedmetadata = () => {
        setDuration(Math.ceil(audio.duration));
      };
      audio.ontimeupdate = () => {
        setCurrentTime(Math.ceil(audio.currentTime));
      };
    }
  };

  useEffect(() => {
    if (!audio) {
      audio = new Audio();
    } else {
      setAudio();
    }
  }, [active]);

  const play = () => {
    if (pause) {
      playTrack();
      audio.play();
    } else {
      pauseTrack();
      audio.pause();
    }
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    audio.volume = Number(e.target.value) / 100;
    setVolume(Number(e.target.value));
  };

  const changeCurrentTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    audio.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
  };

  // Обработка перемотки слайдера
  // const changeCurrentTime = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newTime = Number(e.target.value);
  //   audio.currentTime = newTime; // Устанавливаем новое время на аудио
  //   setCurrentTime(newTime); // Обновляем состояние
  // };

  if (!active) {
    return null;
  }

  return (
    <div className="bg-[#1E212A] flex p-5 grow items-center rounded-b-[20px] justify-between">
      <div className="flex gap-[20px] items-center max-w-[280px] grow">
        <div className="flex flex-col gap-[7px] items-start max-w-[280px] grow">
          <p className="text-[14px] text-white">{active.name}</p>
          <p className="text-[#ACB0B1] text-[12px]">{active.author}</p>
        </div>
      </div>
      <div className="flex gap-[24px]">
        <BackIcon />
        {pause ? (
          <PlayIcon handlePlay={play} />
        ) : (
          <PauseIcon handlePlay={play} />
        )}

        <NextIcon />
      </div>

      <div className="max-w-[439px] w-full flex flex-col gap-[5px] self-end">
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onChange={changeCurrentTime}
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
        <VolumeIcon />
      </div>
    </div>
  );
};

export default Player;

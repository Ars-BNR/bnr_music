"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import React, { useState } from "react";
import img from "../../../public/assets/img/17xauRu2mZN83yTqmM7cIZadC87eQVHQN1z9aj0yk8VUovgSx6QP1R3tgGAzywwUJuEaYXzxNzRFf41-USApp8Wl.png";
import NextIcon from "../../../public/assets/icons/Next";
import BackIcon from "../../../public/assets/icons/Back";
import PlayIcon from "../../../public/assets/icons/Play";
import { Slider } from "@/shared/components/ui/slider";
import LoveIcon from "../../../public/assets/icons/Love";
import RepeatIcon from "../../../public/assets/icons/Repeat";
import ShakeIcon from "../../../public/assets/icons/Shake";
import VolumeIcon from "../../../public/assets/icons/Volume";
import PauseIcon from "../../../public/assets/icons/Pause";

const Player = () => {
  const [play, setPlay] = useState(false);
  const handlePlay = () => {
    setPlay(!play);
  };
  return (
    <div className="bg-[#1E212A] flex p-5 grow items-center rounded-b-[20px] justify-between">
      <div className="flex gap-[20px] items-center mr-[82px]">
        <Avatar>
          <AvatarImage
            src={
              "https://i.pinimg.com/originals/46/6c/4d/466c4d0ec2824e15ff7def79f8ec2789.png"
            }
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-[7px] items-start">
          <p className="text-[14px] text-white">Echoes of Midnight</p>
          <p className="text-[#ACB0B1] text-[12px]">Jon Hickman</p>
        </div>
      </div>
      <div className="flex gap-[24px]">
        <BackIcon />

        {play ? (
          <PlayIcon handlePlay={handlePlay} />
        ) : (
          <PauseIcon handlePlay={handlePlay} />
        )}

        <NextIcon />
      </div>

      <div className="max-w-[439px] w-full flex flex-col gap-[5px] self-end">
        <Slider defaultValue={[33]} max={100} step={1} />
        <div className="flex justify-between">
          <span className="text-white">0:43</span>
          <span className="text-white">3:23</span>
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

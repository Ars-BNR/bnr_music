"use client";

import { Slider } from "@/shared/components/ui/slider";
import usePlayerStore from "@/shared/store/player";
import React, { useState } from "react";
interface VolumeIconProps {
  changeVolume: (value: number[]) => void; 
}
const VolumeIcon = ({ changeVolume }:VolumeIconProps) => {
  const { volume } = usePlayerStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      setIsHovered(false);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    changeVolume(value); // Используем переданную функцию
  };

  const handleSliderDragStart = () => {
    setIsDragging(true);
  };

  const handleSliderDragEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (event:React.WheelEvent<HTMLDivElement>) => { 
    const delta = event.deltaY > 0 ? -5 : 5;
    const newValue = Math.min(Math.max(volume + delta,0),100)
    console.log('newValue', newValue)
    changeVolume([newValue]);
   }

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={handleMouseEnter}
      
      onWheel={handleWheel}
    >
      {isHovered && (
        <div
        onMouseLeave={handleMouseLeave}
          style={{
            position: "absolute",
            bottom: "30px", // Позиция слайдера над иконкой
            left: "50%",
            transform: "translateX(-50%) rotate(-90deg)",
            height: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
         
        >
          <Slider
          orientation="horizontal"
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            style={{
              width: "100px", // Ширина слайдера (после поворота)
            }}
            onPointerDown={handleSliderDragStart}
            onPointerUp={handleSliderDragEnd}
          />
        </div>
      )}
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.9166 5.09395C11.9164 4.94305 11.8715 4.7956 11.7876 4.67021C11.7036 4.54481 11.5844 4.44709 11.445 4.38937C11.3056 4.33166 11.1522 4.31654 11.0042 4.34591C10.8562 4.37529 10.7202 4.44786 10.6134 4.55445L6.94738 8.21936C6.8059 8.36169 6.63758 8.47452 6.45218 8.55132C6.26677 8.62812 6.06797 8.66737 5.86729 8.66678H3.24996C2.96264 8.66678 2.68709 8.78092 2.48393 8.98408C2.28076 9.18724 2.16663 9.46279 2.16663 9.75011V16.2501C2.16663 16.5374 2.28076 16.813 2.48393 17.0161C2.68709 17.2193 2.96264 17.3334 3.24996 17.3334H5.86729C6.06797 17.3329 6.26677 17.3721 6.45218 17.4489C6.63758 17.5257 6.8059 17.6385 6.94738 17.7809L10.6123 21.4469C10.7191 21.5539 10.8553 21.6268 11.0036 21.6564C11.1519 21.6859 11.3056 21.6708 11.4453 21.6129C11.585 21.555 11.7043 21.4569 11.7882 21.3312C11.8722 21.2054 11.9168 21.0575 11.9166 20.9063V5.09395Z"
          stroke="#EAECEC"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.3334 9.75C18.0366 10.6876 18.4167 11.828 18.4167 13C18.4167 14.172 18.0366 15.3124 17.3334 16.25"
          stroke="#EAECEC"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20.9777 19.8944C21.883 18.989 22.6012 17.9142 23.0912 16.7312C23.5812 15.5483 23.8334 14.2804 23.8334 13C23.8334 11.7196 23.5812 10.4518 23.0912 9.26885C22.6012 8.08592 21.883 7.01109 20.9777 6.10571"
          stroke="#EAECEC"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default VolumeIcon;

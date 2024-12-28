import React from "react";
import { ITrack } from "@/shared/types/track";
import usePlayerStore from "@/shared/store/player";

interface TrackItemProps {
  track: ITrack;
  active?: boolean;
}
const CardSongs = ({ track, active = false }: TrackItemProps) => {
  const { playTrack, setActiveTrack } = usePlayerStore();

  const play = (e: any) => {
    e.stopPropagation();
    setActiveTrack(track);
    playTrack();
  };

  return (
    <div
      onClick={play}
      className={`
      cursor-pointer flex flex-col grow justify-between max-w-[172px]  p-[12px] bg-[#5801E1] rounded-[12px] gap-[10px] hover:bg-[#7A1FE3] hover:brightness-110 transition-all duration-300 relative 
      ${active ? "bg-red-900" : ""}
    `}
    >
      <div className="rounded-[4px]">
        <img
          src={"http://localhost:8340/" + track.picture}
          alt="picture"
          className="rounded-[4px]"
        />
      </div>
      <div className="flex flex-col justify-center items-center gap-[2px] text-center">
        <p className="text-white text-[14px]">{track.name}</p>
        <p className="text-[#B6A295] text-[12px] mb-[4px]">{track.authorName}</p>
      </div>
    </div>
  );
};

export default CardSongs;

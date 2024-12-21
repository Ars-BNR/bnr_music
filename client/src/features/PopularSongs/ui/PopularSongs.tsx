import React from "react";
import CardSongs from "@/features/CardSongs/CardSongs";
import { ITrack } from "@/shared/types/track";

interface props {
  tracks: ITrack[];
}

const PopularSongs = ({ tracks }: props) => {
  return (
    <div className="bg-[#09090B] pb-[24px]">
      <div className="mb-4 flex items-center max-w-[270px] justify-between">
        <span className="text-[16px] text-white">Популярные песни</span>
      </div>
      <div className="flex gap-[30px] flex-wrap">
        {tracks.map((track) => (
          <CardSongs key={track.id} track={track} />
        ))}
      </div>
    </div>
  );
};

export default PopularSongs;

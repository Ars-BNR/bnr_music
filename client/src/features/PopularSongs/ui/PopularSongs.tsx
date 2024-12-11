import React from "react";
import ArrowIcon from "../../../../public/assets/icons/Arrow";
import CardSongs from "@/features/CardSongs/CardSongs";

const PopularSongs = () => {
  return (
    <div className="bg-[#09090B]">
      <div className="mb-4 flex items-center gap-[42px]">
        <span className="text-[16px] text-white">Популярные песни</span>
        <div className="flex gap-[24px]">
          <ArrowIcon />
          <ArrowIcon reverse={true} />
        </div>
      </div>
      <div className="flex gap-[24px]">
        <CardSongs />
        <CardSongs />
        <CardSongs />
        <CardSongs />
        <CardSongs />
      </div>
    </div>
  );
};

export default PopularSongs;

import React from "react";
import CardSongs from "@/features/CardSongs/CardSongs";

const PopularSongs = () => {
  const data = [
    { id: 1, nameSong: "Golden Days", nameArt: "Golden Days" },
    { id: 2, nameSong: "Golden Days1", nameArt: "Golden Days" },
    { id: 3, nameSong: "Golden Days2", nameArt: "Golden Days" },
    { id: 4, nameSong: "Golden Days3", nameArt: "Golden Days" },
    { id: 5, nameSong: "Golden Days3", nameArt: "Golden Days" },
    { id: 6, nameSong: "Golden Days3", nameArt: "Golden Days" },
    { id: 7, nameSong: "Golden Days3", nameArt: "Golden Days" },
    { id: 8, nameSong: "Golden Days3", nameArt: "Golden Days" },
    { id: 9, nameSong: "Golden Days3", nameArt: "Golden Days" },
  ];
  return (
    <div className="bg-[#09090B]">
      <div className="mb-4 flex items-center max-w-[270px] justify-between">
        <span className="text-[16px] text-white">Популярные песни</span>
      </div>
      <div className="flex gap-[30px] flex-wrap">
        {data.map((el) => (
          <CardSongs key={el.id} nameSong={el.nameSong} nameArt={el.nameArt} />
        ))}
      </div>
    </div>
  );
};

export default PopularSongs;

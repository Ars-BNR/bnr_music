"use client"

import React, { useEffect } from "react";
import CardSongs from "@/features/CardSongs/CardSongs";
import useTrackStore from "@/shared/store/track";



const PopularSongs = () => {
  const { tracks, error, fetchTopTracks } = useTrackStore();

  useEffect(() => {
    fetchTopTracks({ count: 10, offset: 0 });
  }, [fetchTopTracks]);
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

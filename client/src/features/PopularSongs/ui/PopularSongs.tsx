"use client";

import React, { useEffect } from "react";
import CardSongs from "@/features/CardSongs/CardSongs";
import useTrackStore from "@/shared/store/track";
import { Skeleton } from "@/shared/components/ui/skeleton";

const PopularSongs = () => {
  const { tracks, error, fetchTopTracks, loading } = useTrackStore();

  useEffect(() => {
    fetchTopTracks({ count: 10, offset: 0 });
  }, [fetchTopTracks]);
  return (
    <div className="bg-[#09090B] pb-[24px] mb-16 min-h-[570px]">
      <div className="mb-4 flex items-center max-w-[270px] justify-between">
        <span className="text-[16px] text-white">Популярные песни</span>
      </div>
      <div className="flex gap-[30px] flex-wrap">
        {loading
          ? Array(8)
              .fill(0)
              .map((_, index) => (
                <Skeleton key={index} className="h-[250px] w-[172px]" />
              ))
          : tracks.map((track) => <CardSongs key={track.id} track={track} />)}
      </div>
    </div>
  );
};

export default PopularSongs;

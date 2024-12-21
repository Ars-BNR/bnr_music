"use client";

import Category from "@/features/Category/ui/Category";
import Player from "@/features/Player/Player";
import PopularSongs from "@/features/PopularSongs/ui/PopularSongs";
import Profiles from "@/features/Profiles/ui/Profiles";
import Search from "@/features/Search/ui/Search";
import Sidebar from "@/features/Sidebar/ui/Sidebar";
import Carousel from "@/features/TruthCarousel/ui/Carousel";
import useTrackStore from "@/shared/store/track";
import React, { useEffect } from "react";

const Home = () => {
  const { tracks, error, fetchTopTracks } = useTrackStore();

  useEffect(() => {
    fetchTopTracks({ count: 10, offset: 0 });
  }, [fetchTopTracks]);
  return (
    <>
      <div className="flex h-full mx-auto max-w-[1200px] gap-[24px] mt-[50px] pb-[200px]">
        <Sidebar />

        <div className="w-full flex flex-col max-w-[894px]">
          <div className="flex items-center mb-[52px] max-h-[58px] grow justify-between ">
            <Search />

            <Profiles />
          </div>

          <Carousel />

          <Category />

          <PopularSongs tracks={tracks} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full shadow-lg ">
        <div className="mx-auto max-w-[1200px]">
          <Player />
        </div>
      </div>
    </>
  );
};

export default Home;

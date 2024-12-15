import Carousel from "@/features/Carousel/ui/Carousel";
import Category from "@/features/Category/ui/Category";
import Player from "@/features/Player/Player";
import PopularAlbum from "@/features/Popular Album/ui/PopularAlbum";
import PopularSongs from "@/features/PopularSongs/ui/PopularSongs";
import Profiles from "@/features/Profiles/ui/Profiles";
import Search from "@/features/Search/ui/Search";
import Sidebar from "@/features/Sidebar/ui/Sidebar";
import React from "react";

const Home = () => {
  return (
    <>
      <div className="flex h-full mx-auto max-w-[1200px] gap-[24px] mt-[50px] pb-[200px]">
        <Sidebar />
        <div className="w-full flex flex-col max-w-[894px]">
          <div className=" flex items-center mb-[52px] max-h-[58px] grow justify-between ">
            <Search />
            <Profiles />
          </div>
          <Carousel />

          <Category />
          <PopularSongs />
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-full  shadow-lg ">
        <div className="mx-auto max-w-[1200px]">
          <Player />
        </div>
      </div>
    </>
  );
};

export default Home;

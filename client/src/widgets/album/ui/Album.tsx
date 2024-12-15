import Profiles from "@/features/Profiles/ui/Profiles";
import Search from "@/features/Search/ui/Search";
import Sidebar from "@/features/Sidebar/ui/Sidebar";
import Image from "next/image";
import React from "react";

import img from "../../../../public/assets/img/acAlbum.jpg";
const tracks = [
  {
    id: 1,
    name: "Eath",
  },
  {
    id: 2,
    name: "Eath",
  },
  {
    id: 3,
    name: "Eath",
  },
  {
    id: 4,
    name: "Eath",
  },
  {
    id: 5,
    name: "Eath",
  },
  {
    id: 6,
    name: "Eath",
  },
  {
    id: 7,
    name: "Eath",
  },
  {
    id: 8,
    name: "Eath",
  },
  {
    id: 9,
    name: "Eath",
  },
  {
    id: 10,
    name: "Eath",
  },
  {
    id: 11,
    name: "Eath",
  },
];
const Album = () => {
  return (
    <>
      <div className="flex h-full mx-auto max-w-[1200px] gap-[24px] mt-[50px] pb-[200px]">
        <Sidebar />
        <div className="w-full flex flex-col max-w-[894px]">
          <div className=" flex items-center mb-[52px] max-h-[58px] grow justify-between ">
            <Search />
            <Profiles />
          </div>
          <div className="bg-black flex justify-center items-center mb-[16px]">
            <div className="max-w-[636px] bg-black">
              <Image src={img} alt="img" className="rounded-[13px]" />
            </div>
          </div>
          <div className="flex justify-center flex-col items-center bg-black mb-[56px]">
            <h1 className="text-[24px] text-white font-bold">
              Assassin’s Creed II
            </h1>
            <p className="text-[24px] text-white">Jesper Kyd</p>
          </div>
          <div className="flex flex-col justify-center items-center gap-[8px]">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="max-w-[636px] px-[24px] py-[16px] bg-[#626368] rounded-[8px] grow flex w-full justify-between cursor-pointer hover:bg-[#6300FF]"
              >
                <div className="flex gap-[8px] font-medium">
                  <p className="text-[20px] text-white">{track.id}</p>
                  <p className="text-[20px] text-white">{track.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Album;

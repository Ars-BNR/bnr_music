"use client";

import Profiles from "@/features/Profiles/ui/Profiles";
import Search from "@/features/Search/ui/Search";
import Sidebar from "@/features/Sidebar/ui/Sidebar";
import React, { useEffect } from "react";

import { useParams } from "next/navigation";
import useAlbumStore from "@/shared/store/album";
import usePlayerStore from "@/shared/store/player";
import { ITrack } from "@/shared/types/track";
import Player from "@/features/Player/Player";
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
  const params = useParams();
  const id = params?.id as string;

  const { selectedAlbumTracks, getOneById } = useAlbumStore();
  useEffect(() => {
    if (id) {
      getOneById(Number(id));
      console.log("selectedAlbumTracks", selectedAlbumTracks);
    }
  }, [id, getOneById]);

  const { playTrack, setActiveTrack } = usePlayerStore();

  const play = (e: React.MouseEvent, track: ITrack) => {
    e.stopPropagation();
    setActiveTrack(track);
    playTrack();
    console.log("trackAlbumPersonal", track);
  };

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
              <img
                src={"http://localhost:8340/" + selectedAlbumTracks?.picture}
                alt="img"
                className="rounded-[13px]"
              />
            </div>
          </div>
          <div className="flex justify-center flex-col items-center bg-black mb-[56px]">
            <h1 className="text-[24px] text-white font-bold">
              {selectedAlbumTracks?.name}
            </h1>
            <p className="text-[24px] text-white">
              {selectedAlbumTracks?.authorName}
            </p>
          </div>
          <div className="flex flex-col justify-center items-center gap-[8px]">
            {selectedAlbumTracks?.tracks.map((track) => (
              <div
                onClick={(e) => play(e, track)}
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
        <div className="fixed bottom-0 left-0 w-full shadow-lg ">
          <div className="mx-auto max-w-[1200px]">
            <Player />
          </div>
        </div>
      </div>
    </>
  );
};

export default Album;

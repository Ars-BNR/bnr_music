"use client";

import React, { useEffect } from "react";

import { useParams } from "next/navigation";
import useAlbumStore from "@/shared/store/album";
import usePlayerStore from "@/shared/store/player";
import { ITrack } from "@/shared/types/track";
import useTrackStore from "@/shared/store/track";
import { BASE_URL } from "@/shared/config/config";

const Album = () => {
  const params = useParams();
  const id = params?.id as string;

  const { selectedAlbumTracks, getOneById } = useAlbumStore();
  const { setTracks } = useTrackStore();
  const { playTrack, setActiveTrack } = usePlayerStore();

  useEffect(() => {
    if (id) {
      getOneById(Number(id));
    }
  }, [id, getOneById]);

  useEffect(() => {
    if (selectedAlbumTracks) {
      setTracks(selectedAlbumTracks.tracks); // Обновляем треки в плеере
    }
  }, [selectedAlbumTracks, setTracks]);

  const play = (e: React.MouseEvent, track: ITrack) => {
    e.stopPropagation();
    setActiveTrack(track);
    playTrack();
    console.log("trackAlbumPersonal", track);
  };

  return (
    <>
      <div className="bg-black flex justify-center items-center mb-[16px]">
        <div className="max-w-[636px] bg-black">
          <img
            src={BASE_URL + selectedAlbumTracks?.picture}
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
    </>
  );
};

export default Album;

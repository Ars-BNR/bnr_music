"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { usePlaybackStore } from "@/entities/playback";
import { BASE_URL } from "@/shared/config/config";
import useAlbumStore from "@/shared/store/album";
import { ITrack } from "@/shared/types/track";

const Album = () => {
  const params = useParams();
  const id = params?.id as string;
  const { selectedAlbumTracks, getOneById } = useAlbumStore();
  const playFromQueue = usePlaybackStore((state) => state.playFromQueue);

  useEffect(() => {
    if (id) void getOneById(Number(id));
  }, [getOneById, id]);

  const play = (event: React.MouseEvent, track: ITrack) => {
    event.stopPropagation();
    if (!selectedAlbumTracks) return;

    playFromQueue(track, selectedAlbumTracks.tracks, {
      type: "album",
      id: selectedAlbumTracks.id,
    });
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-center bg-black">
        <div className="max-w-[636px] bg-black">
          {selectedAlbumTracks?.picture && (
            <Image
              src={BASE_URL + selectedAlbumTracks.picture}
              alt={selectedAlbumTracks.name ?? "Album cover"}
              width={636}
              height={636}
              unoptimized
              className="rounded-[13px]"
            />
          )}
        </div>
      </div>
      <div className="mb-14 flex flex-col items-center justify-center bg-black">
        <h1 className="text-[24px] font-bold text-white">{selectedAlbumTracks?.name}</h1>
        <p className="text-[24px] text-white">{selectedAlbumTracks?.authorName}</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        {selectedAlbumTracks?.tracks.map((track) => (
          <div
            onClick={(event) => play(event, track)}
            key={track.id}
            className="flex w-full max-w-[636px] grow cursor-pointer justify-between rounded-[8px] bg-[#626368] px-6 py-4 hover:bg-[#6300FF]"
          >
            <div className="flex gap-2 font-medium">
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

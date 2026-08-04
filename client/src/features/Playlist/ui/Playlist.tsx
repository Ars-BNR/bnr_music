"use client";

import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { usePlaybackStore } from "@/entities/playback";
import CardItem from "@/shared/components/common/CardItem/CardItem";
import { BASE_URL } from "@/shared/config/config";
import useCollectionStore from "@/shared/store/collection";
import { ITrack } from "@/shared/types/track";

const Playlist = () => {
  const params = useParams();
  const id = params?.id as string;
  const { getUserTracksFromPlaylist, userTracksFromPlaylist } = useCollectionStore();
  const playFromQueue = usePlaybackStore((state) => state.playFromQueue);

  useEffect(() => {
    if (id) void getUserTracksFromPlaylist(Number(id));
  }, [getUserTracksFromPlaylist, id]);

  const play = (event: React.MouseEvent, track: ITrack) => {
    event.stopPropagation();
    if (!userTracksFromPlaylist) return;

    playFromQueue(track, userTracksFromPlaylist.tracks, {
      type: "playlist",
      id: userTracksFromPlaylist.id,
    });
  };

  if (userTracksFromPlaylist === null) return null;

  return (
    <>
      <h1 className="mb-3 bg-black text-[18px] text-white">РўСЂРµРєРё СЃ {userTracksFromPlaylist.name}</h1>
      <div className="flex flex-wrap justify-stretch gap-2">
        {userTracksFromPlaylist.tracks.map((track) => (
          <CardItem
            key={track.id}
            title={track.name}
            subtitle={track.authorName}
            imageUrl={`${BASE_URL}${track.picture}`}
            onClick={(event) => play(event, track)}
          />
        ))}
      </div>
    </>
  );
};

export default Playlist;

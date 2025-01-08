"use client";

import CardItem from "@/shared/components/common/CardItem/CardItem";
import useCollectionStore from "@/shared/store/collection";
import usePlayerStore from "@/shared/store/player";
import { ITrack } from "@/shared/types/track";
import React, { useEffect } from "react";

const TracksCollection = () => {
  const collection = Number(localStorage.getItem("collection"));
  const { getUserTracks, userTracks } = useCollectionStore();
  useEffect(() => {
    if (collection !== null) {
      getUserTracks(collection);
    }
  }, []);
  useEffect(() => {
    console.log("userTracks", userTracks);
  }, [userTracks]);
  const { playTrack, setActiveTrack } = usePlayerStore();

  const play = (e: React.MouseEvent, track: ITrack) => {
    e.stopPropagation();
    setActiveTrack(track);
    playTrack();
  };
  return (
    <div>
      <h1 className="bg-black text-white text-[18px] mb-3">Любимые треки</h1>
      <div className="flex justify-stretch flex-wrap gap-2">
        {userTracks.map((track) => (
          <CardItem
            key={track.id}
            title={track.name}
            subtitle={track.authorName}
            imageUrl={`http://localhost:8340/${track.picture}`}
            onClick={(e) => play(e, track)}
          />
        ))}
      </div>
    </div>
  );
};

export default TracksCollection;

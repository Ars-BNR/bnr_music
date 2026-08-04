"use client";

import React, { useEffect, useState } from "react";
import { usePlaybackStore } from "@/entities/playback";
import CardItem from "@/shared/components/common/CardItem/CardItem";
import { BASE_URL } from "@/shared/config/config";
import useCollectionStore from "@/shared/store/collection";

const TracksCollection = () => {
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const { getUserTracks, userTracks } = useCollectionStore();
  const playFromQueue = usePlaybackStore((state) => state.playFromQueue);

  useEffect(() => {
    const value = Number(localStorage.getItem("collection"));
    setCollectionId(Number.isInteger(value) && value > 0 ? value : null);
  }, []);

  useEffect(() => {
    if (collectionId !== null) void getUserTracks(collectionId);
  }, [collectionId, getUserTracks]);

  return (
    <div>
      <h1 className="mb-3 bg-black text-[18px] text-white">Любимые треки</h1>
      <div className="flex flex-wrap justify-stretch gap-2">
        {userTracks.map((track) => (
          <CardItem
            key={track.id}
            variant="track"
            title={track.name}
            subtitle={track.authorName}
            imageUrl={`${BASE_URL}${track.picture}`}
            onAction={() => {
              if (collectionId !== null) playFromQueue(track, userTracks, { type: "favorites", collectionId });
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TracksCollection;

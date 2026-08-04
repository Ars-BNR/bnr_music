"use client";

import CardItem from "@/shared/components/common/CardItem/CardItem";
import useCollectionStore from "@/shared/store/collection";
import React, { useEffect, useState } from "react";
import PlaylistIcon from "../../../../public/assets/icons/Playlist";

const PlaylistsCollection = () => {
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const { getUserPlaylists, userPlaylist } = useCollectionStore();

  useEffect(() => {
    const value = Number(localStorage.getItem("collection"));
    setCollectionId(Number.isInteger(value) && value > 0 ? value : null);
  }, []);

  useEffect(() => {
    if (collectionId !== null) void getUserPlaylists(collectionId);
  }, [collectionId, getUserPlaylists]);
  return (
    <div>
      <h1 className="bg-black text-white text-[18px] mb-3">Плейлисты</h1>
      <div className="flex justify-stretch flex-wrap gap-2">
        {userPlaylist.map((playlist) => (
          <CardItem
            key={playlist.id}
            title={playlist.name}
            icon={<PlaylistIcon height="100" width="100" />}
            href={`/playlist/${playlist.id}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaylistsCollection;

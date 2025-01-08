"use client";

import CardItem from "@/shared/components/common/CardItem/CardItem";
import useCollectionStore from "@/shared/store/collection";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import PlaylistIcon from "../../../../public/assets/icons/Playlist";

const PlaylistsCollection = () => {
  const router = useRouter();
  const collection = Number(localStorage.getItem("collection"));
  const { getUserPlaylists, userPlaylist } = useCollectionStore();
  useEffect(() => {
    if (collection !== null) {
      getUserPlaylists(collection);
    }
  }, []);
  useEffect(() => {
    console.log("userAlbums", userPlaylist);
  }, [userPlaylist]);
  return (
    <div>
      <h1 className="bg-black text-white text-[18px] mb-3">Плейлисты</h1>
      <div className="flex justify-stretch flex-wrap gap-2">
        {userPlaylist.map((playlist) => (
          <CardItem
            key={playlist.id}
            title={playlist.name}
            icon={<PlaylistIcon height="100" width="100" />}
            onClick={() => router.push(`/playlist/${playlist.id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlaylistsCollection;

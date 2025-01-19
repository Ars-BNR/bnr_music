"use client";

import CardItem from "@/shared/components/common/CardItem/CardItem";
import { BASE_URL } from "@/shared/config/config";
import useCollectionStore from "@/shared/store/collection";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const AlbumsCollection = () => {
  const router = useRouter();
  const collection = Number(localStorage.getItem("collection"));
  const { getUserAlbums, userAlbums } = useCollectionStore();
  useEffect(() => {
    if (collection !== null) {
      getUserAlbums(collection);
    }
  }, []);
  useEffect(() => {
    console.log("userAlbums", userAlbums);
  }, [userAlbums]);
  return (
    <div>
      <h1 className="bg-black text-white text-[18px] mb-3">Альбомы</h1>
      <div className="flex justify-stretch flex-wrap gap-2">
        {userAlbums.map((album) => (
          <CardItem
            key={album.id}
            title={album.Albumname}
            subtitle={album.authorName}
            imageUrl={`${BASE_URL}${album.Albumpicture}`}
            onClick={() => router.push(`/album/${album.albumId}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default AlbumsCollection;

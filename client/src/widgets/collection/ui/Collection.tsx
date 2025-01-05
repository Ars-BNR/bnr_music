"use client";

import { Skeleton } from "@/shared/components/ui/skeleton";
import useCollectionStore from "@/shared/store/collection";
import { useParams, useRouter } from "next/navigation";
import AuthorIcon from "../../../../public/assets/icons/Artist";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import useTrackStore from "@/shared/store/track";
import usePlayerStore from "@/shared/store/player";
import { ICollectionTrack } from "@/shared/types/collection";

const Collection = () => {
  const params = useParams();
  const router = useRouter();
  const collectionId = Number(params?.id); // Получаем id коллекции из URL
  const {
    userAlbums,
    userPlaylist,
    userTracks,
    loading,
    error,
    getUserAlbums,
    getUserPlaylists,
    getUserTracks,
  } = useCollectionStore();
  const { setTracks } = useTrackStore();
  const { playTrack, setActiveTrack } = usePlayerStore();

  // Загружаем данные коллекции при изменении collectionId
  useEffect(() => {
    if (collectionId) {
      getUserAlbums(collectionId, { limit: 10, offset: 0 });
      getUserPlaylists(collectionId, { limit: 10, offset: 0 });
      getUserTracks(collectionId, { limit: 10, offset: 2 });
    }
  }, [collectionId, getUserAlbums, getUserPlaylists, getUserTracks]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  const play = (e: React.MouseEvent, track: ICollectionTrack) => {
    e.stopPropagation();
    setActiveTrack(track);
    playTrack();
    console.log("trackAlbumPersonal", track);
  };

  return (
    <div className="bg-[#09090B] pb-[24px] mb-16 min-h-[284px] text-yellow-50">
      <h2>Альбомы</h2>
      <div className="flex gap-[30px] flex-wrap">
        {userAlbums.map((album) => (
          <Link
            key={album.id}
            href={`/album/${album.id}`}
            className={`
         cursor-pointer flex flex-col grow justify-between max-w-[172px]  p-[12px] bg-[#5801E1] rounded-[12px] gap-[10px] hover:bg-[#7A1FE3] hover:brightness-110 transition-all duration-300 relative 
         
         `}
          >
            <div className="rounded-[4px] flex justify-center items-center min-h-[170px]">
              <AuthorIcon height="100" width="100" />
            </div>
            <div className="flex flex-col justify-center items-center gap-[2px] text-center">
              <p className="text-white text-[14px]">{album.name}</p>
            </div>
          </Link>
        ))}
      </div>

      <h2>Плейлисты</h2>
      <div className="flex gap-[30px] flex-wrap">
        {userPlaylist.map((playlist) => (
          <div
            key={playlist.id}
            className={`
         cursor-pointer flex flex-col grow justify-between max-w-[172px]  p-[12px] bg-[#5801E1] rounded-[12px] gap-[10px] hover:bg-[#7A1FE3] hover:brightness-110 transition-all duration-300 relative 
         
         `}
          >
            <div className="rounded-[4px] flex justify-center items-center min-h-[170px]">
              <AuthorIcon height="100" width="100" />
            </div>
            <div className="flex flex-col justify-center items-center gap-[2px] text-center">
              <p className="text-white text-[14px]">{playlist.name}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Треки</h2>
      <div className="flex gap-[30px] flex-wrap">
        {userTracks.map((track) => (
          <div
            key={track.id}
            onClick={(e) => play(e, track)}
            className={`
         cursor-pointer flex flex-col grow justify-between max-w-[172px]  p-[12px] bg-[#5801E1] rounded-[12px] gap-[10px] hover:bg-[#7A1FE3] hover:brightness-110 transition-all duration-300 relative 
         
         `}
          >
            <div className="rounded-[4px] flex justify-center items-center min-h-[170px]">
              <AuthorIcon height="100" width="100" />
            </div>
            <div className="flex flex-col justify-center items-center gap-[2px] text-center">
              <p className="text-white text-[14px]">{track.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Collection;

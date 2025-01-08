"use client";

import CardItem from "@/shared/components/common/CardItem/CardItem";
import useCollectionStore from "@/shared/store/collection";
import usePlayerStore from "@/shared/store/player";
import useTrackStore from "@/shared/store/track";
import { ICollectionTrack } from "@/shared/types/collection";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";

const Playlist = () => {
  const params = useParams();
  const id = params?.id as string;

  const { getUserTracks, userTracks } = useCollectionStore();
  const { setTracks } = useTrackStore();
  const { playTrack, setActiveTrack } = usePlayerStore();

  useEffect(() => {
    if (id !== null) {
      getUserTracks(Number(id));
    }
  }, []);

  useEffect(() => {
    if (userTracks) {
      setTracks(userTracks);
    }
  }, [userTracks, setTracks]);

  useEffect(() => {
    console.log("userTracks", userTracks);
  }, [userTracks]);

  const play = (e: React.MouseEvent, track: ICollectionTrack) => {
    e.stopPropagation();
    setActiveTrack(track);
    playTrack();
    console.log("trackAlbumPersonal", track);
  };

  return (
    <>
      {userTracks.length > 0 && (
        <>
          <h1 className="bg-black text-white text-[18px] mb-3">
            Треки с {userTracks[0]?.playlistname}
          </h1>
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
        </>
      )}
    </>
  );
};

export default Playlist;

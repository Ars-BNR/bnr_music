import React from "react";
import { ITrack } from "@/shared/types/track";
import usePlayerStore from "@/shared/store/player";
import CardItem from "@/shared/components/common/CardItem/CardItem";
import { BASE_URL } from "@/shared/config/config";

interface TrackItemProps {
  track: ITrack;
  active?: boolean;
}
const CardSongs = ({ track, active = false }: TrackItemProps) => {
  const { playTrack, setActiveTrack } = usePlayerStore();

  const play = (e: any) => {
    e.stopPropagation();
    setActiveTrack(track);
    playTrack();
  };

  return (
    <CardItem
      imageUrl={BASE_URL + track.picture}
      title={track.name}
      subtitle={track.authorName}
      active={active}
      onClick={play}
    />
  );
};

export default CardSongs;

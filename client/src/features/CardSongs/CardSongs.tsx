import React from "react";
import { PlaybackContext, usePlaybackStore } from "@/entities/playback";
import { ITrack } from "@/shared/types/track";
import CardItem from "@/shared/components/common/CardItem/CardItem";
import { BASE_URL } from "@/shared/config/config";

interface TrackItemProps {
  track: ITrack;
  queue: ITrack[];
  context: PlaybackContext;
  active?: boolean;
}
const CardSongs = ({ track, queue, context, active = false }: TrackItemProps) => {
  const playFromQueue = usePlaybackStore((state) => state.playFromQueue);

  const play = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    playFromQueue(track, queue, context);
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

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

  return (
    <CardItem
      variant="track"
      imageUrl={BASE_URL + track.picture}
      title={track.name}
      subtitle={track.authorName}
      active={active}
      ariaLabel={`Воспроизвести ${track.name}`}
      onAction={() => playFromQueue(track, queue, context)}
    />
  );
};

export default CardSongs;

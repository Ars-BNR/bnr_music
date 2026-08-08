import { Play, Trash2 } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import type { ITrack } from "@/shared/types/track";
import { Button } from "@/shared/ui/button";

export { favoriteTracksApi } from "./api/favorite-tracks";
export type { FavoriteTracksPage } from "./api/favorite-tracks";
export { useFavoriteTracksStore } from "./model/favorite-tracks";
export { trackPlaysApi } from "./api/track-plays";

export function TrackRow({ track, index, onPlay, onRemove }: { track: ITrack; index: number; onPlay: () => void; onRemove?: () => void }) {
  const handleRowClick = (event: MouseEvent<HTMLElement>) => {
    if (!(event.target as HTMLElement).closest("button")) onPlay();
  };

  return (
    <article onClick={handleRowClick} className="group flex min-h-14 min-w-0 cursor-pointer items-center gap-3 border border-bnr-line/50 bg-bnr-surface px-3 py-2 transition-colors [transition-duration:180ms] hover:border-bnr-lilac/60 hover:bg-bnr-raised">
      <span className="w-6 shrink-0 text-right font-cinzel text-xs text-bnr-ash">{String(index + 1).padStart(2, "0")}</span>
      <Button type="button" variant="ghost" size="sm" className="size-8 shrink-0 p-0 text-bnr-lilac" aria-label={`Воспроизвести ${track.name}`} onClick={onPlay}><Play fill="currentColor" data-icon="inline-start" /></Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-bnr-bone" title={track.name}>{track.name}</p>
        <p className="truncate text-xs text-bnr-ash" title={track.authorName}><Link href={`/authors/${track.authorId}`} onClick={(event) => event.stopPropagation()} className="hover:text-bnr-lilac focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac">{track.authorName}</Link>{track.featuredAuthors?.length ? <> <span aria-hidden="true">feat. </span>{track.featuredAuthors.map((author, index) => <span key={author.id}>{index ? ", " : ""}<Link href={`/authors/${author.id}`} onClick={(event) => event.stopPropagation()} className="hover:text-bnr-lilac focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac">{author.name}</Link></span>)}</> : null}</p>
      </div>
      {onRemove ? <Button type="button" variant="ghost" size="sm" className="size-8 shrink-0 p-0 text-destructive" aria-label={`Удалить ${track.name} из плейлиста`} onClick={onRemove}><Trash2 data-icon="inline-start" /></Button> : null}
    </article>
  );
}

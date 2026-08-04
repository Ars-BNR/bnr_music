import Image from "next/image";
import Link from "next/link";
import { Heart, Music2 } from "lucide-react";
import { cn } from "@/shared/components/lib/utils";
import { BASE_URL } from "@/shared/config/config";
import { Button } from "@/shared/ui/button";
import { FleurDeLis } from "@/shared/ui/brand";
import type { IAlbum } from "@/shared/types/album";

export function AlbumCard({
  album,
  favorite,
  onFavorite,
  className,
}: {
  album: IAlbum;
  favorite?: boolean;
  onFavorite?: () => void;
  className?: string;
}) {
  return (
    <article className={cn("group relative min-w-0 overflow-hidden border border-bnr-line/60 bg-bnr-surface transition-[border-color,transform] [transition-duration:180ms] hover:-translate-y-0.5 hover:border-bnr-lilac/70 motion-reduce:transform-none", className)}>
      <Link href={`/album/${album.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac focus-visible:ring-inset" aria-label={`Открыть альбом ${album.name}`}>
        <div className="relative aspect-square overflow-hidden bg-bnr-abyss">
          {album.picture ? <Image src={`${BASE_URL}${album.picture}`} alt="" fill sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 190px" unoptimized className="object-cover transition-transform [transition-duration:420ms] group-hover:scale-[1.035] motion-reduce:transform-none" /> : <FleurDeLis aria-hidden="true" className="absolute inset-0 m-auto size-16 text-bnr-lilac/35" />}
          <span className="absolute left-0 top-0 border-b border-r border-bnr-lilac/35 bg-bnr-abyss/90 px-2 py-1 font-cinzel text-[10px] tracking-[0.14em] text-bnr-lilac">ALBUM</span>
        </div>
        <div className="min-w-0 px-3 pt-2.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-bnr-bone" title={album.name}>{album.name}</h3>
        </div>
      </Link>
      <p className="relative z-10 min-w-0 px-3 pb-3 pt-1 text-xs text-bnr-ash"><Link href={`/authors/${album.authorId}`} className="hover:text-bnr-lilac focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac">{album.authorName}</Link>{album.featuredAuthors?.length ? <> <span aria-hidden="true">feat. </span>{album.featuredAuthors.map((author, index) => <span key={author.id}>{index ? ", " : ""}<Link href={`/authors/${author.id}`} className="hover:text-bnr-lilac focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac">{author.name}</Link></span>)}</> : null}</p>
      {onFavorite ? <Button type="button" variant="ghost" size="sm" aria-label={favorite ? `Удалить ${album.name} из любимых` : `Добавить ${album.name} в любимые`} aria-pressed={favorite} onClick={onFavorite} className={cn("absolute right-2 top-2 size-8 p-0 text-bnr-bone backdrop-blur-sm", favorite && "text-bnr-lilac")}>{favorite ? <Heart fill="currentColor" data-icon="inline-start" /> : <Heart data-icon="inline-start" />}</Button> : null}
      <Music2 aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 size-4 text-bnr-ash/40" />
    </article>
  );
}

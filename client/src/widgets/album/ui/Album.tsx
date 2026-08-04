"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2, Play } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import albumService from "@/entities/album-service";
import { favoriteAlbumsApi } from "@/entities/album";
import { usePlaybackStore } from "@/entities/playback";
import { TrackRow } from "@/entities/track";
import { BASE_URL } from "@/shared/config/config";
import type { ISelectedAlbum } from "@/shared/types/album";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { FleurDeLis } from "@/shared/ui/brand";
import { HeraldicPanel } from "@/shared/ui/heraldic-panel";
import { SectionHeading } from "@/shared/ui/section-heading";
import { Skeleton } from "@/shared/ui/skeleton";

const formatListens = (value: number) => new Intl.NumberFormat("ru-RU").format(value ?? 0);

export default function Album() {
  const params = useParams();
  const albumId = Number(params?.id);
  const playFromQueue = usePlaybackStore((state) => state.playFromQueue);
  const [album, setAlbum] = useState<ISelectedAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(albumId) || albumId <= 0) {
      setError("Альбом не найден."); setLoading(false); return;
    }
    let cancelled = false;
    setLoading(true); setError("");
    void albumService.getOne(albumId).then((data) => {
      if (!cancelled) setAlbum(data);
    }).catch((cause) => {
      if (!cancelled) setError(cause?.response?.status === 404 ? "Альбом не найден." : "Не удалось загрузить альбом.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    void favoriteAlbumsApi.status(albumId).then((data) => { if (!cancelled) setIsFavorite(data.isFavorite); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [albumId]);

  const play = (track = album?.tracks[0]) => {
    if (!album || !track) return;
    playFromQueue(track, album.tracks, { type: "album", id: album.id });
  };

  const toggleFavorite = async () => {
    if (!album) return;
    setFavoriteBusy(true);
    try {
      if (isFavorite) await favoriteAlbumsApi.remove(album.id);
      else await favoriteAlbumsApi.add(album.id);
      setIsFavorite((value) => !value);
    } catch { setError("Не удалось обновить любимые альбомы."); } finally { setFavoriteBusy(false); }
  };

  if (loading) return <Skeleton className="min-h-[540px] w-full" />;
  if (!album) return <Empty className="min-h-[320px]"><EmptyHeader><EmptyTitle>Альбом не найден</EmptyTitle><EmptyDescription>{error || "Проверьте ссылку и вернитесь к каталогу."}</EmptyDescription></EmptyHeader></Empty>;

  return (
    <section className="mb-16 min-w-0" aria-labelledby="album-title">
      {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <HeraldicPanel watermark className="mb-7 p-4 sm:p-6">
        <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(240px,360px)_minmax(0,1fr)] md:items-center">
          <div className="relative mx-auto w-full max-w-[360px] border border-bnr-lilac/45 bg-bnr-abyss p-1.5 shadow-[0_0_0_5px_hsl(var(--bnr-abyss)/0.72)]">
            {album.picture ? <Image src={`${BASE_URL}${album.picture}`} alt={`Обложка альбома ${album.name}`} width={360} height={360} unoptimized className="aspect-square w-full object-cover" /> : <FleurDeLis aria-hidden="true" className="m-auto aspect-square w-full p-16 text-bnr-lilac/25" />}
            <span className="absolute left-0 top-0 border-b border-r border-bnr-lilac/40 bg-bnr-abyss/90 px-3 py-1.5 font-cinzel text-[10px] tracking-[0.18em] text-bnr-lilac">ARCHIVE ALBUM</span>
          </div>
          <div className="min-w-0">
            <p className="font-cinzel text-[10px] tracking-[0.2em] text-bnr-lilac">МУЗЫКАЛЬНЫЙ АРХИВ</p>
            <h1 id="album-title" className="mt-2 line-clamp-3 font-cinzel text-[clamp(2rem,5vw,2.625rem)] font-semibold leading-tight tracking-wide text-bnr-bone">{album.name}</h1>
            <p className="mt-3 text-base text-bnr-lilac"><Link href={`/authors/${album.authorId}`} className="transition-colors hover:text-bnr-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac">{album.authorName}</Link>{album.featuredAuthors?.length ? <> <span aria-hidden="true">feat. </span>{album.featuredAuthors.map((author, index) => <span key={author.id}>{index ? ", " : ""}<Link href={`/authors/${author.id}`} className="transition-colors hover:text-bnr-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac">{author.name}</Link></span>)}</> : null}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-bnr-ash"><span>{formatListens(album.listens)} прослушиваний</span><span>{album.tracks.length} треков</span></div>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button type="button" variant="brand" onClick={() => play()} disabled={album.tracks.length === 0}><Play fill="currentColor" data-icon="inline-start" />Слушать</Button>
              <Button type="button" variant="brandLink" onClick={() => void toggleFavorite()} disabled={favoriteBusy} aria-pressed={isFavorite}>{favoriteBusy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Heart fill={isFavorite ? "currentColor" : "none"} data-icon="inline-start" />}{isFavorite ? "В любимых" : "В любимые"}</Button>
            </div>
          </div>
        </div>
      </HeraldicPanel>
      <SectionHeading description="Запускайте треки по отдельности или слушайте альбом целиком.">Треки альбома</SectionHeading>
      {album.tracks.length === 0 ? <Empty className="min-h-44"><EmptyHeader><EmptyTitle>Треков пока нет</EmptyTitle><EmptyDescription>Этот альбом ещё не содержит доступных записей.</EmptyDescription></EmptyHeader></Empty> : <div className="space-y-2">{album.tracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} onPlay={() => play(track)} />)}</div>}
    </section>
  );
}

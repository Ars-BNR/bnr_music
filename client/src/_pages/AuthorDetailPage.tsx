"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Disc3, ListMusic, Loader2 } from "lucide-react";
import { authorApi, type Author } from "@/entities/author";
import { AlbumCard } from "@/entities/album";
import { usePlaybackStore } from "@/entities/playback";
import { TrackRow } from "@/entities/track";
import type { IAlbum } from "@/shared/types/album";
import type { ITrack } from "@/shared/types/track";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { FleurDeLis } from "@/shared/ui/brand";
import { HeraldicPanel } from "@/shared/ui/heraldic-panel";
import { SectionHeading } from "@/shared/ui/section-heading";
import { LoadingReveal } from "@/shared/ui/heraldic-loader";
import { Skeleton } from "@/shared/ui/skeleton";

const TRACK_BATCH = 20;
const ALBUM_BATCH = 12;

export function AuthorDetailPage() {
  const params = useParams();
  const authorId = Number(params?.id);
  const playFromQueue = usePlaybackStore((state) => state.playFromQueue);
  const replaceQueue = usePlaybackStore((state) => state.replaceQueue);
  const [author, setAuthor] = useState<Author | null>(null);
  const [tracks, setTracks] = useState<ITrack[]>([]);
  const [albums, setAlbums] = useState<IAlbum[]>([]);
  const [tracksTotal, setTracksTotal] = useState(0);
  const [albumsTotal, setAlbumsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState<"tracks" | "albums" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(authorId) || authorId <= 0) { setLoading(false); setError("Автор не найден."); return; }
    let cancelled = false;
    setLoading(true); setError("");
    void Promise.all([authorApi.get(authorId), authorApi.getTracks(authorId, TRACK_BATCH), authorApi.getAlbums(authorId, ALBUM_BATCH)])
      .then(([nextAuthor, nextTracks, nextAlbums]) => {
        if (!cancelled) {
          setAuthor(nextAuthor); setTracks(nextTracks.tracks); setTracksTotal(nextTracks.total);
          setAlbums(nextAlbums.albums); setAlbumsTotal(nextAlbums.total);
        }
      })
      .catch((cause) => { if (!cancelled) setError(cause?.response?.status === 404 ? "Автор не найден." : "Не удалось загрузить архив автора."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authorId]);

  useEffect(() => {
    replaceQueue(tracks, { type: "author", id: authorId });
  }, [authorId, replaceQueue, tracks]);

  const loadMore = async (kind: "tracks" | "albums") => {
    setLoadingMore(kind);
    try {
      if (kind === "tracks") {
        const data = await authorApi.getTracks(authorId, TRACK_BATCH, tracks.length);
        setTracks((current) => [...current, ...data.tracks.filter((track) => !current.some((item) => item.id === track.id))]);
        setTracksTotal(data.total);
      } else {
        const data = await authorApi.getAlbums(authorId, ALBUM_BATCH, albums.length);
        setAlbums((current) => [...current, ...data.albums.filter((album) => !current.some((item) => item.id === album.id))]);
        setAlbumsTotal(data.total);
      }
    } catch { setError("Не удалось загрузить следующую часть архива."); } finally { setLoadingMore(null); }
  };

  if (loading) return <LoadingReveal loading variant="page" label="Открываем архив автора"><Skeleton className="min-h-[620px] w-full" /></LoadingReveal>;
  if (!author) return <Empty className="min-h-[320px]"><EmptyHeader><EmptyTitle>Автор не найден</EmptyTitle><EmptyDescription>{error || "Проверьте адрес страницы."}</EmptyDescription></EmptyHeader></Empty>;

  return (
    <section className="mb-16 min-w-0" aria-labelledby="author-title">
      {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <HeraldicPanel watermark className="mb-7 p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative grid size-28 shrink-0 place-items-center border border-bnr-lilac/50 bg-bnr-abyss font-cinzel text-5xl text-bnr-lilac">{author.name.charAt(0).toUpperCase()}<FleurDeLis aria-hidden="true" className="absolute -bottom-4 -right-4 size-10 text-bnr-lilac" /></div>
          <div className="min-w-0"><p className="font-cinzel text-[10px] tracking-[0.2em] text-bnr-lilac">АРХИВ АВТОРА</p><h1 id="author-title" className="mt-2 truncate font-cinzel text-[clamp(2rem,5vw,2.625rem)] font-semibold text-bnr-bone">{author.name}</h1><div className="mt-4 flex gap-5 text-sm text-bnr-ash"><span>{tracksTotal} треков</span><span>{albumsTotal} альбомов</span></div></div>
        </div>
      </HeraldicPanel>
      <SectionHeading description={`${tracksTotal} записей в личном каталоге автора.`}>Треки</SectionHeading>
      {tracks.length ? <div className="space-y-2">{tracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} onPlay={() => playFromQueue(track, tracks, { type: "author", id: authorId })} />)}</div> : <Empty className="min-h-40"><EmptyHeader><EmptyTitle>Треков пока нет</EmptyTitle><EmptyDescription>В архиве ещё нет доступных записей.</EmptyDescription></EmptyHeader></Empty>}
      {tracks.length < tracksTotal ? <Button type="button" variant="brandLink" className="mt-4 w-full sm:w-auto" onClick={() => void loadMore("tracks")} disabled={loadingMore !== null}>{loadingMore === "tracks" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ListMusic data-icon="inline-start" />}Показать ещё</Button> : null}
      <SectionHeading className="mt-10" description={`${albumsTotal} релизов в архиве автора.`}>Альбомы</SectionHeading>
      {albums.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{albums.map((album) => <AlbumCard key={album.id} album={album} />)}</div> : <Empty className="min-h-40"><EmptyHeader><EmptyTitle>Альбомов пока нет</EmptyTitle><EmptyDescription>Релизы появятся после наполнения каталога.</EmptyDescription></EmptyHeader></Empty>}
      {albums.length < albumsTotal ? <Button type="button" variant="brandLink" className="mt-4 w-full sm:w-auto" onClick={() => void loadMore("albums")} disabled={loadingMore !== null}>{loadingMore === "albums" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Disc3 data-icon="inline-start" />}Показать ещё</Button> : null}
    </section>
  );
}

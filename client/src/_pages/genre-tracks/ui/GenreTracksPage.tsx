"use client";

import categoryService from "@/entities/category-service";
import CardSongs from "@/features/CardSongs/CardSongs";
import { usePlaybackStore } from "@/entities/playback";
import type { ICategory } from "@/shared/types/category";
import type { ITrack } from "@/shared/types/track";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { SectionHeading } from "@/shared/ui/section-heading";
import { Skeleton } from "@/shared/ui/skeleton";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

const responseStatus = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("response" in error)) return undefined;
  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === "number" ? response.status : undefined;
};

export function GenreTracksPage({ genreId }: { genreId: number }) {
  const [genre, setGenre] = useState<ICategory | null>(null);
  const [tracks, setTracks] = useState<ITrack[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const requestId = useRef(0);
  const replaceQueue = usePlaybackStore((state) => state.replaceQueue);

  const loadTracks = useCallback(async (offset: number, reset = false) => {
    const currentRequest = ++requestId.current;
    if (reset) {
      setLoading(true);
      setError("");
      setNotFound(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await categoryService.getTracks(genreId, { count: PAGE_SIZE, offset });
      if (currentRequest !== requestId.current) return;

      setGenre(response.genre);
      setTotal(response.total);
      setTracks((current) => reset ? response.tracks : [...current, ...response.tracks.filter((track) => !current.some((item) => item.id === track.id))]);
    } catch (requestError) {
      if (currentRequest !== requestId.current) return;
      if (responseStatus(requestError) === 404) setNotFound(true);
      else setError("Не удалось загрузить треки жанра. Проверьте подключение и повторите попытку.");
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [genreId]);

  useEffect(() => {
    void loadTracks(0, true);
  }, [loadTracks]);

  useEffect(() => {
    if (tracks.length > 0) replaceQueue(tracks, { type: "genre", id: genreId });
  }, [genreId, replaceQueue, tracks]);

  if (notFound) {
    return (
      <Empty className="min-h-[360px]">
        <EmptyHeader><EmptyTitle>Жанр не найден</EmptyTitle><EmptyDescription>Возможно, он был удалён или ссылка устарела.</EmptyDescription></EmptyHeader>
        <Button asChild variant="brandLink"><Link href="/category">Вернуться к жанрам</Link></Button>
      </Empty>
    );
  }

  return (
    <section className="mb-16 min-w-0" aria-labelledby="genre-title">
      <nav aria-label="Хлебные крошки" className="mb-4 text-sm text-bnr-ash"><Link href="/category" className="hover:text-bnr-lilac">Жанры</Link><span aria-hidden="true" className="px-2">/</span><span className="text-bnr-bone">{genre?.name ?? "Загрузка"}</span></nav>
      <SectionHeading description={genre ? `${total} ${total === 1 ? "трек" : "треков"}` : undefined}><span id="genre-title">{genre?.name ?? "Жанр"}</span></SectionHeading>
      {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription><Button variant="brandLink" size="sm" onClick={() => void loadTracks(0, true)}>Повторить</Button></Alert> : null}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="aspect-[3/4]" />)}</div>
      ) : !error && tracks.length === 0 ? (
        <Empty className="min-h-[260px]"><EmptyHeader><EmptyTitle>В этом жанре пока нет треков</EmptyTitle><EmptyDescription>Новые композиции появятся здесь после пополнения каталога.</EmptyDescription></EmptyHeader></Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {tracks.map((track) => <CardSongs key={track.id} track={track} queue={tracks} context={{ type: "genre", id: genreId }} />)}
          </div>
          {tracks.length < total ? <div className="mt-8 flex justify-center"><Button variant="brandLink" disabled={loadingMore} onClick={() => void loadTracks(tracks.length)}>{loadingMore ? "Загружаем…" : "Показать ещё"}</Button></div> : null}
        </>
      )}
    </section>
  );
}

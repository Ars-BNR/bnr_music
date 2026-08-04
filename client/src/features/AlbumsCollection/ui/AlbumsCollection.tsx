"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AlbumCard, favoriteAlbumsApi, type FavoriteAlbum } from "@/entities/album";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { SectionHeading } from "@/shared/ui/section-heading";
import { Skeleton } from "@/shared/ui/skeleton";

const PAGE_SIZE = 20;
const loadError = "Не удалось загрузить любимые альбомы.";

export default function AlbumsCollection() {
  const [albums, setAlbums] = useState<FavoriteAlbum[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (offset = 0) => {
    const data = await favoriteAlbumsApi.get(PAGE_SIZE, offset);
    setAlbums((current) => offset === 0
      ? data.items
      : [...current, ...data.items.filter((album) => !current.some((item) => item.id === album.id))]);
    setTotal(data.total);
    setError("");
  }, []);

  const loadInitial = useCallback(() => {
    setLoading(true);
    setError("");
    void load()
      .catch(() => setError(loadError))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const remove = async (albumId: number) => {
    setError("");
    try {
      await favoriteAlbumsApi.remove(albumId);
      setAlbums((current) => current.filter((album) => album.id !== albumId));
      setTotal((current) => Math.max(0, current - 1));
    } catch {
      setError("Не удалось удалить альбом из любимых.");
    }
  };

  const loadMore = () => {
    setLoadingMore(true);
    void load(albums.length)
      .catch(() => setError("Не удалось загрузить следующие альбомы."))
      .finally(() => setLoadingMore(false));
  };

  if (loading) return <Skeleton className="min-h-[380px] w-full" />;

  const empty = (
    <Empty className="min-h-[260px]">
      <EmptyHeader>
        <EmptyTitle>Любимых альбомов пока нет</EmptyTitle>
        <EmptyDescription>Откройте альбом и добавьте его в личный архив.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );

  const retry = (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>{error}</AlertDescription>
      <Button type="button" variant="brandLink" size="sm" onClick={loadInitial}>Повторить</Button>
    </Alert>
  );

  return (
    <section className="mb-16 min-w-0" aria-labelledby="favorite-albums-title">
      <SectionHeading description="Релизы, которые вы сохранили в личный архив.">
        <span id="favorite-albums-title">Любимые альбомы</span>
      </SectionHeading>
      {error && albums.length === 0 ? retry : null}
      {!error && albums.length === 0 ? empty : null}
      {albums.length > 0 ? (
        <>
          {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} favorite onFavorite={() => void remove(album.id)} />
            ))}
          </div>
          {albums.length < total ? (
            <Button type="button" variant="brandLink" className="mt-5 w-full sm:w-auto" disabled={loadingMore} onClick={loadMore}>
              {loadingMore ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
              Показать ещё
            </Button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

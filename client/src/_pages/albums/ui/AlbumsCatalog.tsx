"use client";

import { Disc3, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlbumCard } from "@/entities/album";
import { debounce } from "@/shared/constants/debounce";
import type { IAlbum } from "@/shared/types/album";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { HeraldicPanel } from "@/shared/ui/heraldic-panel";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { albumCatalogApi } from "../api/album-catalog";

export function AlbumsCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [albums, setAlbums] = useState<IAlbum[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const updateUrl = useMemo(() => debounce((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = value.trim();
    if (normalized) params.set("q", normalized);
    else params.delete("q");
    router.replace(params.size ? `/albums?${params.toString()}` : "/albums", { scroll: false });
  }, 300), [router, searchParams]);

  useEffect(() => () => updateUrl.cancel(), [updateUrl]);

  useEffect(() => {
    const controller = new AbortController();
    const normalized = urlQuery.trim();
    setLoading(true);
    setError("");
    setLoadMoreError("");
    const request = normalized.length >= 2
      ? albumCatalogApi.search(normalized, 20, 0, controller.signal)
      : albumCatalogApi.get(20, 0, controller.signal);
    void request.then((data) => {
      setAlbums(data.items);
      setTotal(data.total);
    }).catch(() => {
      if (!controller.signal.aborted) setError("Не удалось загрузить каталог альбомов.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [reloadKey, urlQuery]);

  const loadMore = async () => {
    if (albums.length >= total || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const normalized = urlQuery.trim();
      const data = normalized.length >= 2
        ? await albumCatalogApi.search(normalized, 20, albums.length)
        : await albumCatalogApi.get(20, albums.length);
      setAlbums((current) => {
        const known = new Set(current.map((album) => album.id));
        return [...current, ...data.items.filter((album) => !known.has(album.id))];
      });
      setTotal(data.total);
    } catch {
      setLoadMoreError("Следующую часть каталога загрузить не удалось.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="mb-16 min-w-0" aria-labelledby="albums-catalog-title">
      <HeraldicPanel watermark className="mb-6 p-6 sm:p-8">
        <p className="font-cinzel text-[10px] tracking-[.22em] text-bnr-lilac">КОРОЛЕВСКАЯ ВИТРИНА</p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 id="albums-catalog-title" className="font-cinzel text-3xl font-semibold text-bnr-bone sm:text-4xl">Альбомы</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-bnr-ash">
              Релизы музыкального архива BNR — от самых популярных до новых находок.
            </p>
          </div>
          <label className="relative block w-full max-w-sm">
            <span className="sr-only">Поиск альбомов</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-bnr-lilac" />
            <Input
              type="search"
              aria-label="Поиск альбомов"
              className="h-11 border-bnr-line bg-bnr-abyss/70 pl-10"
              placeholder="Название или автор"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                updateUrl(event.target.value);
              }}
            />
          </label>
        </div>
      </HeraldicPanel>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-label="Загрузка альбомов">
          {Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="aspect-[4/5]" />)}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button type="button" variant="brandLink" size="sm" onClick={() => setReloadKey((key) => key + 1)}>Повторить</Button>
          </AlertDescription>
        </Alert>
      ) : albums.length === 0 ? (
        <Empty className="min-h-[280px] border border-bnr-line bg-bnr-surface/50">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Disc3 /></EmptyMedia>
            <EmptyTitle>Альбомы не найдены</EmptyTitle>
            <EmptyDescription>{urlQuery ? "Измените поисковый запрос." : "Каталог пока пуст."}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-cinzel text-xs tracking-[.16em] text-bnr-lilac">НАЙДЕНО {total}</p>
            {urlQuery.trim().length < 2 ? <p className="text-xs text-bnr-ash">По популярности</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" data-testid="albums-catalog-grid">
            {albums.map((album) => <AlbumCard key={album.id} album={album} />)}
          </div>
          {loadMoreError ? <Alert variant="destructive"><AlertDescription>{loadMoreError}</AlertDescription></Alert> : null}
          {albums.length < total ? (
            <Button type="button" variant="brand" className="self-center" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? "Загружаем…" : "Показать ещё"}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}


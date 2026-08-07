"use client";

import { Disc3, ListMusic, Search as SearchIcon, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlaybackStore } from "@/entities/playback";
import CardSongs from "@/features/CardSongs/CardSongs";
import CardItem from "@/shared/components/common/CardItem/CardItem";
import { AlbumCard } from "@/entities/album";
import type { IAlbum } from "@/shared/types/album";
import type { ICategory } from "@/shared/types/category";
import type { ITrack } from "@/shared/types/track";
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
import { SectionHeading } from "@/shared/ui/section-heading";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { catalogSearchApi } from "../api/catalog-search";
import {
  isSearchType,
  type SearchAuthor,
  type SearchEntityType,
  type SearchPlaylist,
  type SearchPreview,
} from "../model/catalog-search";

type SearchItem = ITrack | IAlbum | ICategory | SearchAuthor | SearchPlaylist;

const labels: Record<SearchEntityType, string> = {
  tracks: "Треки",
  authors: "Авторы",
  albums: "Альбомы",
  genres: "Жанры",
  playlists: "Плейлисты",
};

const entityTypes = Object.keys(labels) as SearchEntityType[];

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-label="Загрузка результатов">
      {Array.from({ length: 10 }, (_, index) => (
        <Skeleton key={index} className="aspect-[3/4]" />
      ))}
    </div>
  );
}

function SearchPlaylistCard({ playlist }: { playlist: SearchPlaylist }) {
  return (
    <Link
      href={`/playlist/${playlist.id}`}
      aria-label={`Открыть плейлист ${playlist.name}`}
      className="group min-w-0 border border-bnr-line bg-bnr-surface p-4 transition-[border-color,transform] [transition-duration:180ms] hover:-translate-y-0.5 hover:border-bnr-lilac focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac motion-reduce:transform-none"
    >
      <span className="grid size-11 place-items-center border border-bnr-lilac/40 bg-bnr-violet/10 text-bnr-lilac">
        <ListMusic aria-hidden="true" />
      </span>
      <span className="mt-5 block line-clamp-2 font-cinzel text-base font-semibold text-bnr-bone">
        {playlist.name}
      </span>
      <span className="mt-1 block text-xs text-bnr-ash">
        {playlist.ownerName} · {Number(playlist.trackCount ?? 0)} треков
      </span>
    </Link>
  );
}

function ResultsGrid({ type, items, query }: { type: SearchEntityType; items: SearchItem[]; query: string }) {
  if (type === "tracks") {
    const tracks = items as ITrack[];
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" data-testid="search-results-tracks">
        {tracks.map((track) => (
          <CardSongs key={track.id} track={track} queue={tracks} context={{ type: "search", query }} />
        ))}
      </div>
    );
  }

  if (type === "albums") {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" data-testid="search-results-albums">
        {(items as IAlbum[]).map((album) => <AlbumCard key={album.id} album={album} />)}
      </div>
    );
  }

  if (type === "authors") {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" data-testid="search-results-authors">
        {(items as SearchAuthor[]).map((author) => (
          <CardItem
            key={author.id}
            variant="author"
            title={author.name}
            href={`/authors/${author.id}`}
            ariaLabel={`Открыть автора ${author.name}`}
          />
        ))}
      </div>
    );
  }

  if (type === "genres") {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" data-testid="search-results-genres">
        {(items as ICategory[]).map((genre) => (
          <CardItem
            key={genre.id}
            variant="genre"
            title={genre.name}
            href={`/category/${genre.id}`}
            ariaLabel={`Открыть жанр ${genre.name}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="search-results-playlists">
      {(items as SearchPlaylist[]).map((playlist) => (
        <SearchPlaylistCard key={playlist.id} playlist={playlist} />
      ))}
    </div>
  );
}

export function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const requestedType = searchParams.get("type");
  const type = isSearchType(requestedType) ? requestedType : "all";
  const replaceQueue = usePlaybackStore((state) => state.replaceQueue);
  const [preview, setPreview] = useState<SearchPreview | null>(null);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  const setType = useCallback((nextType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", nextType);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    setPreview(null);
    setItems([]);
    setTotal(0);
    setError("");
    setLoadMoreError("");
    if (query.length < 2) return;

    const controller = new AbortController();
    const run = ++requestId.current;
    setLoading(true);
    const request = type === "all"
      ? catalogSearchApi.preview(query, 5, controller.signal).then((data) => setPreview(data))
      : catalogSearchApi.page(type, query, 20, 0, controller.signal).then((data) => {
        setItems(data.items);
        setTotal(data.total);
      });

    void request.catch(() => {
      if (!controller.signal.aborted && run === requestId.current) setError("Не удалось выполнить поиск. Проверьте соединение и повторите попытку.");
    }).finally(() => {
      if (!controller.signal.aborted && run === requestId.current) setLoading(false);
    });

    return () => controller.abort();
  }, [query, reloadKey, type]);

  const trackQueue = useMemo(() => {
    if (type === "all") return preview?.tracks.items ?? [];
    return type === "tracks" ? items as ITrack[] : [];
  }, [items, preview, type]);

  useEffect(() => {
    if (!query || !trackQueue.length) return;
    replaceQueue(trackQueue, { type: "search", query });
  }, [query, replaceQueue, trackQueue]);

  const loadMore = async () => {
    if (type === "all" || items.length >= total || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError("");
    const run = ++requestId.current;
    try {
      const data = await catalogSearchApi.page(type, query, 20, items.length);
      if (run !== requestId.current) return;
      setItems((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...data.items.filter((item) => !known.has(item.id))];
      });
      setTotal(data.total);
    } catch {
      if (run === requestId.current) setLoadMoreError("Не удалось загрузить следующую часть результатов.");
    } finally {
      if (run === requestId.current) setLoadingMore(false);
    }
  };

  const hasTypeResults = type !== "all" && items.length > 0;
  const hasPreviewResults = Boolean(preview && entityTypes.some((entityType) => preview[entityType].items.length));

  return (
    <section className="mb-16 min-w-0" aria-labelledby="catalog-search-title">
      <HeraldicPanel watermark className="mb-6 overflow-hidden p-6 sm:p-8">
        <p className="font-cinzel text-[10px] tracking-[.22em] text-bnr-lilac">ЕДИНЫЙ КАТАЛОГ BNR</p>
        <h1 id="catalog-search-title" className="mt-3 font-cinzel text-3xl font-semibold text-bnr-bone sm:text-4xl">
          Поиск по музыкальному архиву
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-bnr-ash">
          Ищите треки, авторов, альбомы, жанры и открытые плейлисты в одном месте.
        </p>
      </HeraldicPanel>

      <Tabs value={type} onValueChange={setType}>
        <TabsList className="bnr-scrollbar mb-6 flex h-auto max-w-full justify-start overflow-x-auto bg-bnr-surface p-1">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="tracks">Треки</TabsTrigger>
          <TabsTrigger value="authors">Авторы</TabsTrigger>
          <TabsTrigger value="albums">Альбомы</TabsTrigger>
          <TabsTrigger value="genres">Жанры</TabsTrigger>
          <TabsTrigger value="playlists">Плейлисты</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.length < 2 ? (
        <Empty className="min-h-[280px] border border-bnr-line bg-bnr-surface/50">
          <EmptyHeader>
            <EmptyMedia variant="icon"><SearchIcon /></EmptyMedia>
            <EmptyTitle>Введите не менее двух символов</EmptyTitle>
            <EmptyDescription>Поле поиска находится в верхней части страницы.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : loading ? <SearchSkeleton /> : error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button type="button" variant="brandLink" size="sm" onClick={() => setReloadKey((key) => key + 1)}>Повторить</Button>
          </AlertDescription>
        </Alert>
      ) : type === "all" && hasPreviewResults && preview ? (
        <div className="flex flex-col gap-10">
          {entityTypes.map((entityType) => {
            const group = preview[entityType];
            if (!group.items.length) return null;
            return (
              <section key={entityType} aria-labelledby={`search-group-${entityType}`}>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <SectionHeading><span id={`search-group-${entityType}`}>{labels[entityType]}</span></SectionHeading>
                  {group.total > group.items.length ? (
                    <Button type="button" variant="brandLink" size="sm" onClick={() => setType(entityType)}>
                      Показать все · {group.total}
                    </Button>
                  ) : null}
                </div>
                <ResultsGrid type={entityType} items={group.items} query={query} />
              </section>
            );
          })}
        </div>
      ) : hasTypeResults ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <SectionHeading>{labels[type]}</SectionHeading>
            <span className="text-xs text-bnr-ash">Найдено: {total}</span>
          </div>
          <ResultsGrid type={type} items={items} query={query} />
          {loadMoreError ? <Alert variant="destructive"><AlertDescription>{loadMoreError}</AlertDescription></Alert> : null}
          {items.length < total ? (
            <Button type="button" variant="brand" className="self-center" disabled={loadingMore} onClick={() => void loadMore()}>
              {loadingMore ? "Загружаем…" : "Показать ещё"}
            </Button>
          ) : null}
        </div>
      ) : (
        <Empty className="min-h-[280px] border border-bnr-line bg-bnr-surface/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {type === "albums" ? <Disc3 /> : type === "authors" ? <UsersRound /> : <SearchIcon />}
            </EmptyMedia>
            <EmptyTitle>Ничего не найдено</EmptyTitle>
            <EmptyDescription>Попробуйте изменить запрос или выбрать другую вкладку.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}


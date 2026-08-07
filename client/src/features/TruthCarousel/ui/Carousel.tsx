"use client";

import { ChevronLeft, ChevronRight, ImageOff, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import stl from "../styles/Carousel.module.scss";
import { BASE_URL } from "@/shared/config/config";
import useAlbumStore from "@/shared/store/album";
import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { Skeleton } from "@/shared/ui/skeleton";
import { SectionHeading } from "@/shared/ui/section-heading";
import { LoadingReveal } from "@/shared/ui/heraldic-loader";

const AUTOPLAY_DELAY = 5_000;

function normalizeIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}
function getVisibleOffsets(length: number) {
  if (length === 1) return [0];
  if (length === 2) return [-1, 0];
  if (length === 3) return [-1, 0, 1];
  if (length === 4) return [-2, -1, 0, 1];
  return [-2, -1, 0, 1, 2];
}

export default function Carousel() {
  const { albums, fetchTopAlbums, loading, error } = useAlbumStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    void fetchTopAlbums({ count: 5, offset: 0 });
  }, [fetchTopAlbums]);

  useEffect(() => {
    if (albums.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((index) => normalizeIndex(index, albums.length));
  }, [albums.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const moveBy = useCallback(
    (offset: number) => {
      if (albums.length < 2 || offset === 0) return;
      setActiveIndex((index) => normalizeIndex(index + offset, albums.length));
    },
    [albums.length]
  );

  const canNavigate = albums.length > 1;
  const shouldAutoplay =
    canNavigate && isAutoPlaying && !isInteracting && isDocumentVisible && !prefersReducedMotion;

  useEffect(() => {
    if (!shouldAutoplay) return;
    const timer = window.setTimeout(() => moveBy(1), AUTOPLAY_DELAY);
    return () => window.clearTimeout(timer);
  }, [activeIndex, moveBy, shouldAutoplay]);

  const visibleAlbums = useMemo(() => {
    if (!albums.length) return [];
    return getVisibleOffsets(albums.length).map((offset) => ({
      album: albums[normalizeIndex(activeIndex + offset, albums.length)],
      offset,
    }));
  }, [activeIndex, albums]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveBy(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveBy(1);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsInteracting(false);
  };

  if (loading) return <LoadingReveal loading label="РћС‚РєСЂС‹РІР°РµРј РїРѕРїСѓР»СЏСЂРЅС‹Рµ Р°Р»СЊР±РѕРјС‹"><Skeleton className={stl.skeleton} /></LoadingReveal>;

  if (!albums.length) {
    return (
      <Empty className={stl.empty}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageOff />
          </EmptyMedia>
          <EmptyTitle>Популярные альбомы пока не доступны</EmptyTitle>
          <EmptyDescription>{error || "Что-то пошло не так — попробуйте обновить страницу."}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section
      aria-label="Popular albums"
      aria-roledescription="carousel"
      className={stl.carousel}
      tabIndex={0}
      onBlur={handleBlur}
      onFocus={() => setIsInteracting(true)}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => setIsInteracting(true)}
      onPointerLeave={() => setIsInteracting(false)}
    >
      <div className={stl.headingRow}>
        <SectionHeading className={stl.heading} description="Королевская витрина из глубины царства BNR.">Популярные альбомы</SectionHeading>
        <Button asChild variant="brandLink" size="sm">
          <Link href="/albums">Все популярные альбомы</Link>
        </Button>
      </div>
      <div className={stl.viewport}>
        {visibleAlbums.map(({ album, offset }) => {
          const isActive = offset === 0;
          const image = (
            <Image
              alt={album.name}
              className={stl.image}
              height={338}
              priority={isActive}
              sizes="(max-width: 640px) 220px, 338px"
              src={`${BASE_URL}${album.picture}`}
              unoptimized
              width={338}
            />
          );

          return (
            <article
              key={album.id}
              aria-current={isActive ? "true" : undefined}
              className={stl.slide}
              data-slot={offset}
            >
              {isActive ? (
                <Link className={stl.activeSlide} href={`/album/${album.id}`}>
                  {image}
                  <div className={stl.info}>
                    <div className={stl.text}>
                      <p className={stl.catalog}>ARCHIVE ALBUM</p>
                      <p className={stl.name}>{album.name}</p>
                      <p className={stl.author}>{album.authorName}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <button
                  aria-label={`Show album ${album.name}`}
                  className={stl.slideButton}
                  onClick={() => moveBy(offset)}
                  type="button"
                >
                  {image}
                </button>
              )}
            </article>
          );
        })}
      </div>

      <div className={stl.controls}>
        <Button
          aria-label="Previous album"
          disabled={!canNavigate}
          onClick={() => moveBy(-1)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronLeft data-icon="inline-start" />
        </Button>
        {!prefersReducedMotion && (
          <Button
            aria-label={isAutoPlaying ? "Pause autoplay" : "Resume autoplay"}
            aria-pressed={isAutoPlaying}
            disabled={!canNavigate}
            onClick={() => setIsAutoPlaying((value) => !value)}
            size="icon"
            type="button"
            variant="ghost"
          >
            {isAutoPlaying ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}
          </Button>
        )}
        <p aria-live="off" className={stl.status}>
          Альбом {activeIndex + 1} из {albums.length}
        </p>
        <Button
          aria-label="Next album"
          disabled={!canNavigate}
          onClick={() => moveBy(1)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronRight data-icon="inline-start" />
        </Button>
      </div>
    </section>
  );
}

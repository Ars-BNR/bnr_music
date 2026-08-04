"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { usePlaybackStore } from "@/entities/playback";
import { useFavoriteTracksStore } from "@/entities/track";
import CardItem from "@/shared/components/common/CardItem/CardItem";
import { BASE_URL } from "@/shared/config/config";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/shared/ui/empty";
import { LoadingReveal } from "@/shared/ui/heraldic-loader";
import { SectionHeading } from "@/shared/ui/section-heading";

export default function TracksCollection() {
  const tracks = useFavoriteTracksStore((state) => state.items);
  const total = useFavoriteTracksStore((state) => state.total);
  const loading = useFavoriteTracksStore((state) => state.loading);
  const loadingMore = useFavoriteTracksStore((state) => state.loadingMore);
  const error = useFavoriteTracksStore((state) => state.error);
  const loadInitial = useFavoriteTracksStore((state) => state.loadInitial);
  const loadMore = useFavoriteTracksStore((state) => state.loadMore);
  const playFromQueue = usePlaybackStore((state) => state.playFromQueue);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return (
    <LoadingReveal
      loading={loading}
      variant="section"
      label="Открываем любимые треки"
    >
      <section className="mb-16 min-w-0" aria-labelledby="favorite-tracks-title">
        <SectionHeading description="Треки, которые вы сохранили в личный архив.">
          <span id="favorite-tracks-title">Любимые треки</span>
        </SectionHeading>

        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
            {tracks.length === 0 ? (
              <Button
                type="button"
                variant="brandLink"
                size="sm"
                onClick={() => void loadInitial()}
              >
                Повторить
              </Button>
            ) : null}
          </Alert>
        ) : null}

        {!error && !loading && tracks.length === 0 ? (
          <Empty className="min-h-[260px]">
            <EmptyHeader>
              <EmptyTitle>Любимых треков пока нет</EmptyTitle>
              <EmptyDescription>
                Запустите трек и нажмите на сердце в Player, чтобы сохранить его.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {tracks.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {tracks.map((track) => (
                <CardItem
                  key={track.id}
                  variant="track"
                  title={track.name}
                  subtitle={track.authorName}
                  imageUrl={`${BASE_URL}${track.picture}`}
                  onAction={() =>
                    playFromQueue(track, tracks, { type: "favorites" })
                  }
                />
              ))}
            </div>
            {tracks.length < total ? (
              <Button
                type="button"
                variant="brandLink"
                className="mt-5 w-full sm:w-auto"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : null}
                Показать ещё
              </Button>
            ) : null}
          </>
        ) : null}
      </section>
    </LoadingReveal>
  );
}

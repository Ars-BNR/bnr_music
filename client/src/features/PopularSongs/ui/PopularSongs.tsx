"use client";

import CardSongs from "@/features/CardSongs/CardSongs";
import useTrackStore from "@/shared/store/track";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { SectionHeading } from "@/shared/ui/section-heading";
import { Skeleton } from "@/shared/ui/skeleton";
import { useEffect } from "react";

const PopularSongs = () => {
  const { tracks, fetchTopTracks, loading, error } = useTrackStore();

  useEffect(() => {
    void fetchTopTracks({ count: 10, offset: 0 });
  }, [fetchTopTracks]);

  return (
    <section className="mb-16 min-w-0" aria-labelledby="popular-tracks-heading">
      <SectionHeading><span id="popular-tracks-heading">Популярные треки</span></SectionHeading>
      {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription><Button variant="brandLink" size="sm" onClick={() => void fetchTopTracks({ count: 10, offset: 0 })}>Повторить</Button></Alert> : null}
      {!loading && !error && tracks.length === 0 ? (
        <Empty className="min-h-[240px]"><EmptyHeader><EmptyTitle>Треки пока не найдены</EmptyTitle><EmptyDescription>Здесь появятся самые популярные композиции.</EmptyDescription></EmptyHeader></Empty>
      ) : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="aspect-[3/4]" />)
          : tracks.map((track) => <CardSongs key={track.id} track={track} queue={tracks} context={{ type: "popular" }} />)}
      </div>}
    </section>
  );
};

export default PopularSongs;

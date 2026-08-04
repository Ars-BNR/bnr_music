import { GenreTracksPage } from "@/_pages/genre-tracks";
import { notFound } from "next/navigation";

export default async function GenrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const genreId = Number(id);
  if (!Number.isSafeInteger(genreId) || genreId < 1) notFound();
  return <GenreTracksPage genreId={genreId} />;
}

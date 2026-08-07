import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import { AlbumsCatalog } from "./AlbumsCatalog";

function AlbumsFallback() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-label="Загрузка альбомов">
      {Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="aspect-[4/5]" />)}
    </div>
  );
}

export function AlbumsPage() {
  return (
    <Suspense fallback={<AlbumsFallback />}>
      <AlbumsCatalog />
    </Suspense>
  );
}

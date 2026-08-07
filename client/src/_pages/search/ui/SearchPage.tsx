import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import { SearchResults } from "./SearchResults";

function SearchPageFallback() {
  return (
    <div className="flex min-w-0 flex-col gap-6" aria-label="Загрузка поиска">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="aspect-[3/4]" />
        ))}
      </div>
    </div>
  );
}

export function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchResults />
    </Suspense>
  );
}


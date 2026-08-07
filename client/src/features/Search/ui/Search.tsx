"use client";

import { Search as SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "@/shared/constants/debounce";
import { Input } from "@/shared/ui/input";

const Search = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSearchPage = pathname === "/search";
  const queryFromUrl = isSearchPage ? searchParams.get("q") ?? "" : "";
  const [query, setQuery] = useState(queryFromUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setQuery(queryFromUrl), [queryFromUrl]);
  useEffect(() => {
    if (!isSearchPage) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isSearchPage]);

  const updateUrl = useMemo(() => debounce((nextQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalizedQuery = nextQuery.trim();
    if (normalizedQuery) params.set("q", normalizedQuery);
    else params.delete("q");
    if (!params.has("type")) params.set("type", "all");
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, 300), [router, searchParams]);

  useEffect(() => () => updateUrl.cancel(), [updateUrl]);

  const openSearch = () => {
    if (!isSearchPage) router.push("/search?type=all");
  };

  return (
    <div className="relative w-full max-w-[486px]">
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-bnr-lilac"
      />
      <Input
        ref={inputRef}
        type="search"
        autoFocus={isSearchPage}
        aria-label="Поиск по каталогу"
        className="h-11 w-full border-bnr-line bg-bnr-surface pl-10 text-bnr-bone placeholder:text-bnr-ash focus-visible:border-bnr-lilac"
        placeholder="Треки, авторы, альбомы, жанры, плейлисты"
        readOnly={!isSearchPage}
        value={query}
        onClick={openSearch}
        onFocus={openSearch}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          updateUrl(nextQuery);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.currentTarget.blur();
        }}
      />
    </div>
  );
};

export default Search;

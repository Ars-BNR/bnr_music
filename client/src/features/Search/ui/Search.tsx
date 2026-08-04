"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlaybackStore } from "@/entities/playback";
import trackService from "@/entities/track-service";
import { debounce } from "@/shared/constants/debounce";
import { ITrack } from "@/shared/types/track";
import { Input } from "@/shared/ui/input";

const SEARCH_RESULTS_ID = "track-search-results";

const Search = () => {
  const playFromQueue = usePlaybackStore((state) => state.playFromQueue);
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<ITrack[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestQueryRef = useRef("");

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    inputRef.current?.blur();
  }, []);

  const searchData = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTracks([]);
      return;
    }

    try {
      const nextTracks = await trackService.searchTracks(query);
      if (latestQueryRef.current === query) setTracks(nextTracks);
    } catch {
      if (latestQueryRef.current === query) setTracks([]);
    }
  }, []);
  const debouncedSearch = useMemo(() => debounce(searchData, 300), [searchData]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    latestQueryRef.current = query;
    setIsOpen(true);

    if (!query.trim()) {
      debouncedSearch.cancel();
      setTracks([]);
      return;
    }

    debouncedSearch(query);
  };

  return (
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/50"
          data-testid="search-backdrop"
          onPointerDown={closeSearch}
        />
      )}
      <div className="relative z-40 w-full max-w-[486px]">
        <Input
          ref={inputRef}
          className="max-w-[486px]"
          placeholder="Search song"
          value={searchQuery}
          aria-autocomplete="list"
          aria-controls={SEARCH_RESULTS_ID}
          aria-expanded={isOpen && tracks.length > 0}
          onChange={(event) => handleSearchChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeSearch();
          }}
        />
        {isOpen && tracks.length > 0 && (
          <div
            id={SEARCH_RESULTS_ID}
            role="list"
            aria-label="Track search results"
            className="absolute mt-1 flex w-full flex-col rounded-md bg-popover p-1 text-popover-foreground shadow-md"
          >
            {tracks.map((track) => (
              <button
                key={track.id}
                type="button"
                className="flex flex-col gap-1 rounded-sm px-3 py-2 text-left hover:bg-accent"
                onClick={() => {
                  playFromQueue(track, tracks, { type: "search", query: searchQuery });
                  closeSearch();
                }}
              >
                <span className="font-medium">{track.name}</span>
                <span className="text-sm text-muted-foreground">
                  {track.authorName}{track.albumId ? ` В· Album #${track.albumId}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Search;

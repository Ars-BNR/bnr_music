import type { IAlbum } from "@/shared/types/album";
import type { ICategory } from "@/shared/types/category";
import type { ITrack } from "@/shared/types/track";

export const searchTypes = ["all", "tracks", "authors", "albums", "genres", "playlists"] as const;

export type SearchType = (typeof searchTypes)[number];
export type SearchEntityType = Exclude<SearchType, "all">;

export interface SearchAuthor {
  id: number;
  name: string;
  avatar?: string | null;
  bio?: string;
}

export interface SearchPlaylist {
  id: number;
  name: string;
  trackCount: number;
  ownerName: string;
  userId?: number;
}

export interface SearchPreview {
  tracks: SearchPageResult<ITrack>;
  authors: SearchPageResult<SearchAuthor>;
  albums: SearchPageResult<IAlbum>;
  genres: SearchPageResult<ICategory>;
  playlists: SearchPageResult<SearchPlaylist>;
}

export type SearchEntityMap = {
  tracks: ITrack;
  authors: SearchAuthor;
  albums: IAlbum;
  genres: ICategory;
  playlists: SearchPlaylist;
};

export interface SearchPageResult<T> {
  items: T[];
  total: number;
}

export const isSearchType = (value: string | null): value is SearchType =>
  searchTypes.includes(value as SearchType);

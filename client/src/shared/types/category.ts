export interface ICategory {
  id: number;
  name: string;
}

export interface CategoryState {
  categories: ICategory[];
  error: string;
  loading: boolean;
}

export interface GenreTracksResponse {
  genre: ICategory;
  tracks: import("@/shared/types/track").ITrack[];
  total: number;
}

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

export interface RankedItem {
  id: number;
  name: string;
  listens: number;
  trackId?: number;
  trackName?: string;
  genreId?: number;
  genreName?: string;
  albumId?: number;
  albumName?: string;
  authorId?: number;
  authorName?: string;
}

export interface AnalyticsDashboard {
  period: AnalyticsPeriod;
  trackingSince: string | null;
  generatedAt: string;
  popularTracksByGenre: RankedItem[];
  popularTracksByAlbum: RankedItem[];
  popularGenres: RankedItem[];
  popularAuthors: RankedItem[];
  popularAlbumsByAuthor: RankedItem[];
  popularAlbumTracksByAuthor: RankedItem[];
}

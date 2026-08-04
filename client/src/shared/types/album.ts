import { ITrack } from "./track";

export interface IAlbum {
  id: number;
  name: string;
  listens: number;
  authorId: number;
  authorName: string;
  picture: string;
  featuredAuthors?: Array<{ id: number; name: string; avatar: string | null }>;
}
export interface ISelectedAlbum extends IAlbum {
  tracks: ITrack[];
}
export interface AlbumState {
  albums: IAlbum[];
  selectedAlbumTracks: ISelectedAlbum | null;
  error: string;
  loading: boolean;
}

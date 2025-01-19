import { ITrack } from "./track";

export interface ICollectionAlbum {
  id: number;
  albumId: number;
  Albumname: string;
  Albumpicture: string;
  Albumlistens: number;
  authorName: string;
}
export interface ICollectionPlaylist {
  id: number;
  name: string;
}

export interface ITracksFromUserPlaylist {
  id: number;
  name: string;
  userId: number;
  tracks: ITrack[];
}

export interface CollectionState {
  userAlbums: ICollectionAlbum[];
  userPlaylist: ICollectionPlaylist[];
  userTracks: ITrack[];
  userTracksFromPlaylist: ITracksFromUserPlaylist;
  error: string;
  loading: boolean;
}

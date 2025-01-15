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
export interface ICollectionTrack {
  id: number;
  name: string;
  picture: string;
  text: string;
  listens: number;
  audio: string;
  authorId: number;
  authorName: string;
}
export interface ITracksFromUserPlaylist {
  id: number;
  name: string;
  userId: number;
  tracks: ICollectionTrack[];
}

export interface CollectionState {
  userAlbums: ICollectionAlbum[];
  userPlaylist: ICollectionPlaylist[];
  userTracks: ICollectionTrack[];
  userTracksFromPlaylist: ITracksFromUserPlaylist | null;
  error: string;
  loading: boolean;
}

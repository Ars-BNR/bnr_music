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
  playlistId: number;
  trackId: number;
  name: string;
  picture: string;
  text: string;
  listens: number;
  audio: string;
  authorId: number;
  authorName: string;
  playlistname: string;
}

export interface CollectionState {
  userAlbums: ICollectionAlbum[];
  userPlaylist: ICollectionPlaylist[];
  userTracks: ICollectionTrack[];
  error: string;
  loading: boolean;
}

export interface ICollectionAlbums {
  id: number;
  name: string;
  listens: number;
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
  authorName?: string;
}

export interface CollectionState {
  userAlbums: ICollectionAlbums[];
  userPlaylist: ICollectionPlaylist[];
  userTracks: ICollectionTrack[];
  error: string;
  loading: boolean;
}

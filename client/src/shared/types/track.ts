export interface ITrack {
  id: number;
  name: string;
  picture: string;
  text: string;
  listens: number;
  audio: string;
  authorName: string;
  authorId?: number;
  albumId?: number;
}

export interface TrackState {
  tracks: ITrack[];
  error: string;
  loading: boolean;
}

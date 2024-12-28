export interface ITrack {
  id: string;
  name: string;
  picture: string;
  text: string;
  listens: number;
  audio: string;
  authorName: string;
}

export interface TrackState {
  tracks: ITrack[];
  error: string;
}

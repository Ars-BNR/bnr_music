export interface ITrack {
  id: string;
  name: string;
  picture: string;
  text: string;
  listens: number;
  audio: string;
  author: string;
}

export interface TrackState {
  tracks: ITrack[];
  error: string;
}

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
  featuredAuthors?: Array<{ id: number; name: string; avatar: string | null }>;
}

export interface TrackState {
  tracks: ITrack[];
  error: string;
  loading: boolean;
}

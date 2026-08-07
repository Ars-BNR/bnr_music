export interface FeaturedAuthor {
  id: number;
  name: string;
  avatar: string | null;
}

export interface TrackAlbumCredit {
  id: number;
  name: string;
}

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
  albums?: TrackAlbumCredit[];
  featuredAuthors?: FeaturedAuthor[];
}

export interface TrackState {
  tracks: ITrack[];
  error: string;
  loading: boolean;
}

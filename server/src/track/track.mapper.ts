import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { mapFeaturedAuthors } from 'src/author/featured-author.mapper';
import { TrackModel } from './model/track.model';

type AlbumWithRelation = AlbumModel & {
  AlbumTrackModel?: { position?: number };
};

export type TrackAlbumCredit = { id: number; name: string };

export function mapTrackModel(model: TrackModel) {
  const track = model.get({ plain: true }) as TrackModel & {
    author?: AuthorModel;
    albums?: AlbumWithRelation[];
    featuredAuthors?: AuthorModel[];
  };
  const albums = [...(track.albums ?? [])]
    .sort(
      (left, right) =>
        (left.AlbumTrackModel?.position ?? Number.MAX_SAFE_INTEGER) -
        (right.AlbumTrackModel?.position ?? Number.MAX_SAFE_INTEGER),
    )
    .map(({ id, name }) => ({ id, name }));
  const publicTrack = { ...track };
  Reflect.deleteProperty(publicTrack, 'creatorRequestId');
  return {
    ...publicTrack,
    authorName: track.author?.name ?? '',
    albums,
    albumId: albums[0]?.id,
    featuredAuthors: mapFeaturedAuthors(track.featuredAuthors),
  };
}

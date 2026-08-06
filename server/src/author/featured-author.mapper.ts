import { AuthorModel } from './model/author.model';

type FeaturedAuthorWithRelation = AuthorModel & {
  AlbumFeaturedAuthorModel?: { position?: number };
  TrackFeaturedAuthorModel?: { position?: number };
};

const featuredPosition = (author: FeaturedAuthorWithRelation) =>
  author.AlbumFeaturedAuthorModel?.position ??
  author.TrackFeaturedAuthorModel?.position ??
  Number.MAX_SAFE_INTEGER;

export const mapFeaturedAuthors = (
  authors: FeaturedAuthorWithRelation[] | undefined,
) =>
  [...(authors ?? [])]
    .sort((left, right) => featuredPosition(left) - featuredPosition(right))
    .map((author) => ({
      id: author.id,
      name: author.name,
      avatar: author.avatar ?? null,
    }));

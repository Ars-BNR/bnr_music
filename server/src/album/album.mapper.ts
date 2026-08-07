import { AuthorModel } from 'src/author/model/author.model';
import { mapFeaturedAuthors } from 'src/author/featured-author.mapper';
import { AlbumModel } from './model/album.model';

export function mapAlbumModel(model: AlbumModel) {
  const album = model.get({ plain: true }) as AlbumModel & {
    author?: AuthorModel;
    featuredAuthors?: AuthorModel[];
  };
  const publicAlbum = { ...album };
  Reflect.deleteProperty(publicAlbum, 'creatorRequestId');
  return {
    ...publicAlbum,
    authorName: album.author?.name ?? '',
    featuredAuthors: mapFeaturedAuthors(album.featuredAuthors),
  };
}

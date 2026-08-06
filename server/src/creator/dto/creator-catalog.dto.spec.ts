import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateCreatorAlbumDto,
  CreateCreatorTrackDto,
} from './creator-catalog.dto';

describe('Creator catalog DTO', () => {
  it('parses ordered featured-author ids from multipart JSON', async () => {
    const dto = plainToInstance(CreateCreatorAlbumDto, {
      name: 'Purple Archive',
      featuredAuthorIds: '[12,13]',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.featuredAuthorIds).toEqual([12, 13]);
  });

  it('rejects duplicate featured-author ids', async () => {
    const dto = plainToInstance(CreateCreatorAlbumDto, {
      name: 'Duplicate feat',
      featuredAuthorIds: '[12,12]',
    });

    const errors = await validate(dto);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'featuredAuthorIds' }),
      ]),
    );
  });

  it('keeps an empty featured-author list valid for tracks', async () => {
    const dto = plainToInstance(CreateCreatorTrackDto, {
      name: 'Solo track',
      genreIds: '[3]',
      featuredAuthorIds: '',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.featuredAuthorIds).toEqual([]);
  });
});

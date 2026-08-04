import { ForbiddenException } from '@nestjs/common';
import { CollectionService } from './collection.service';

describe('CollectionService', () => {
  it('does not disclose another user collection', async () => {
    const collectionRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 1, userId: 2 }),
    };
    const service = new CollectionService(
      collectionRepository as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(
      service.getByUserId(2, {
        sub: 1,
        email: 'user@example.com',
        role: 'user',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

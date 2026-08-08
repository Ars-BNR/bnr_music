import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  DeleteCreatorProfileDto,
  UpdateCreatorProfileDto,
} from './creator-profile.dto';

describe('Creator profile DTO', () => {
  it('accepts a complete public author profile update', async () => {
    const dto = plainToInstance(UpdateCreatorProfileDto, {
      stageName: 'Purple Saint',
      bio: 'A sufficiently detailed biography for the public author page.',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects a short public biography', async () => {
    const dto = plainToInstance(UpdateCreatorProfileDto, {
      bio: 'Too short',
    });
    expect(await validate(dto)).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'bio' })]),
    );
  });

  it('requires both password and stage name for deletion', async () => {
    const dto = plainToInstance(DeleteCreatorProfileDto, {
      currentPassword: '',
      stageName: '',
    });
    expect((await validate(dto)).map((error) => error.property).sort()).toEqual(
      ['currentPassword', 'stageName'],
    );
  });
});

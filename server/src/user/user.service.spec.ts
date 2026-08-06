import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from './user.service';

describe('UserService profile operations', () => {
  const createService = (user: Record<string, unknown>) => {
    const userRepository = {
      findByPk: jest.fn().mockResolvedValue(user),
      findOne: jest.fn(),
    };
    const tokenService = {
      removeAllForUser: jest.fn(),
      generateTokens: jest.fn(),
      saveToken: jest.fn(),
    };
    const fileService = {
      createFile: jest.fn().mockReturnValue('image/new-avatar.png'),
      deleteFile: jest.fn(),
    };
    const rbacService = {
      resolvePrincipal: jest.fn().mockResolvedValue({
        sub: Number(user.id ?? 1),
        email: String(user.email ?? 'saint@example.com'),
        roles: ['user'],
        permissions: [
          'profile.manage-own',
          'library.manage-own',
          'creator.apply',
        ],
      }),
      assignSystemRole: jest.fn(),
    };
    const service = new UserService(
      userRepository as any,
      {} as any,
      { transaction: jest.fn(async (callback) => callback({})) } as any,
      tokenService as any,
      { sendActivationMail: jest.fn() } as any,
      fileService as any,
      {
        getOrThrow: jest.fn().mockReturnValue('http://localhost:8340'),
        get: jest.fn(),
      } as any,
      rbacService as any,
    );
    return { service, userRepository, tokenService, fileService };
  };

  it('returns a profile response without password or activation link', async () => {
    const { service } = createService({
      id: 1,
      email: 'saint@example.com',
      displayName: 'Saint',
      bio: '',
      avatar: null,
      isActivated: true,
      password: 'secret',
      activationLink: 'private',
    });

    const profile = await service.getProfile(1);
    expect(profile).toEqual({
      id: 1,
      email: 'saint@example.com',
      displayName: 'Saint',
      bio: '',
      avatar: null,
      roles: ['user'],
      permissions: [
        'profile.manage-own',
        'library.manage-own',
        'creator.apply',
      ],
      isActivated: true,
    });
    expect(profile).not.toHaveProperty('password');
    expect(profile).not.toHaveProperty('activationLink');
  });

  it('deletes a newly uploaded avatar when persistence fails', async () => {
    const user = {
      id: 1,
      email: 'saint@example.com',
      displayName: 'Saint',
      bio: '',
      avatar: 'image/old.png',
      isActivated: true,
      save: jest.fn().mockRejectedValue(new Error('database failure')),
    };
    const { service, fileService } = createService(user);

    await expect(
      service.replaceAvatar(1, {
        size: 100,
        mimetype: 'image/png',
        originalname: 'avatar.png',
      } as Express.Multer.File),
    ).rejects.toThrow('database failure');
    expect(fileService.deleteFile).toHaveBeenCalledWith('image/new-avatar.png');
    expect(fileService.deleteFile).not.toHaveBeenCalledWith('image/old.png');
  });

  it('invalidates all refresh sessions after changing the password', async () => {
    const user = {
      id: 1,
      password: await bcrypt.hash('old-password', 10),
      save: jest.fn(),
    };
    const { service, tokenService } = createService(user);

    await service.changePassword(1, {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
    expect(tokenService.removeAllForUser).toHaveBeenCalledWith(1, {});
    expect(await bcrypt.compare('new-password', user.password)).toBe(true);
  });

  it('accepts a 20-character seed password for login without weakening registration', async () => {
    const password = '12345678901234567890';
    const loginErrors = await validate(
      plainToInstance(LoginDto, { email: 'admin@example.test', password }),
    );
    const registrationErrors = await validate(
      plainToInstance(CreateUserDto, { email: 'admin@example.test', password }),
    );

    expect(loginErrors).toHaveLength(0);
    expect(registrationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'password' }),
      ]),
    );
  });

  it('keeps an incorrect login password as 401', async () => {
    const password = await bcrypt.hash('correct-password', 10);
    const { service, userRepository } = createService({});
    userRepository.findOne.mockResolvedValue({ password });

    await expect(
      service.login({
        email: 'admin@example.test',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

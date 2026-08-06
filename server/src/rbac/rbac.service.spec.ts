import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RbacService } from './rbac.service';

describe('RbacService', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const createRepositories = () => {
    const userRepository = {
      findByPk: jest.fn(),
      findAndCountAll: jest.fn(),
    };
    const roleRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByPk: jest.fn(),
    };
    const permissionRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };
    const userRoleRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      destroy: jest.fn(),
      bulkCreate: jest.fn(),
    };
    const rolePermissionRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    const sequelize = {
      transaction: jest.fn((callback: (value: unknown) => unknown) =>
        callback(transaction),
      ),
    };
    const service = new RbacService(
      userRepository as never,
      roleRepository as never,
      permissionRepository as never,
      userRoleRepository as never,
      rolePermissionRepository as never,
      sequelize as never,
    );
    return {
      service,
      userRepository,
      roleRepository,
      permissionRepository,
      userRoleRepository,
      rolePermissionRepository,
    };
  };

  it('merges and de-duplicates permissions from every assigned role', async () => {
    const repositories = createRepositories();
    repositories.userRepository.findByPk.mockResolvedValue({
      id: 7,
      email: 'author@example.test',
    });
    repositories.userRoleRepository.findAll.mockResolvedValue([
      { userId: 7, roleId: 1 },
      { userId: 7, roleId: 2 },
    ]);
    repositories.roleRepository.findAll.mockResolvedValue([
      { id: 1, code: 'user' },
      { id: 2, code: 'author' },
    ]);
    repositories.rolePermissionRepository.findAll.mockResolvedValue([
      { permissionId: 4 },
      { permissionId: 1 },
      { permissionId: 4 },
    ]);
    repositories.permissionRepository.findAll.mockResolvedValue([
      { code: 'creator.publish' },
      { code: 'profile.manage-own' },
    ]);

    await expect(repositories.service.resolvePrincipal(7)).resolves.toEqual({
      sub: 7,
      email: 'author@example.test',
      roles: ['author', 'user'],
      permissions: ['creator.publish', 'profile.manage-own'],
    });
  });

  it('does not allow removing the mandatory user role', async () => {
    const repositories = createRepositories();
    repositories.userRepository.findByPk.mockResolvedValue({ id: 7 });
    repositories.roleRepository.findAll.mockResolvedValue([
      { id: 3, code: 'admin' },
    ]);
    repositories.roleRepository.findOne.mockResolvedValue({
      id: 1,
      code: 'user',
    });

    await expect(
      repositories.service.replaceUserRoles(7, [3], {
        sub: 1,
        email: 'admin@example.test',
        roles: ['admin'],
        permissions: ['rbac.manage'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents an administrator from removing their own admin role', async () => {
    const repositories = createRepositories();
    repositories.userRepository.findByPk.mockResolvedValue({ id: 1 });
    repositories.roleRepository.findAll.mockResolvedValue([
      { id: 1, code: 'user' },
    ]);
    repositories.roleRepository.findOne.mockResolvedValue({
      id: 1,
      code: 'user',
    });

    await expect(
      repositories.service.replaceUserRoles(1, [1], {
        sub: 1,
        email: 'admin@example.test',
        roles: ['admin', 'user'],
        permissions: ['rbac.manage'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

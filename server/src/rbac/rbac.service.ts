import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction } from 'sequelize';
import { UserModel } from 'src/user/model/user.model';
import { CreateRoleDto, UpdateRoleDto } from './dto/rbac.dto';
import { PermissionModel } from './model/permission.model';
import { RolePermissionModel } from './model/role-permission.model';
import { RoleModel } from './model/role.model';
import { UserRoleModel } from './model/user-role.model';
import {
  AuthenticatedPrincipal,
  PERMISSION_CODES,
  SYSTEM_ROLE_PERMISSIONS,
  SystemRoleCode,
} from './rbac.constants';

@Injectable()
export class RbacService {
  constructor(
    @InjectModel(UserModel)
    private readonly userRepository: typeof UserModel,
    @InjectModel(RoleModel)
    private readonly roleRepository: typeof RoleModel,
    @InjectModel(PermissionModel)
    private readonly permissionRepository: typeof PermissionModel,
    @InjectModel(UserRoleModel)
    private readonly userRoleRepository: typeof UserRoleModel,
    @InjectModel(RolePermissionModel)
    private readonly rolePermissionRepository: typeof RolePermissionModel,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async resolvePrincipal(
    userId: number,
    transaction?: Transaction,
  ): Promise<AuthenticatedPrincipal> {
    const user = await this.userRepository.findByPk(userId, {
      attributes: ['id', 'email', 'mustChangePassword'],
      transaction,
    });
    if (!user) throw new UnauthorizedException('User no longer exists');

    const roles = await this.getRolesForUsers([userId], transaction);
    const userRoles = roles.get(userId) ?? [];
    const roleIds = userRoles.map((role) => role.id);
    const permissionIds = roleIds.length
      ? await this.rolePermissionRepository.findAll({
          where: { roleId: { [Op.in]: roleIds } },
          attributes: ['permissionId'],
          transaction,
        })
      : [];
    const uniquePermissionIds = [
      ...new Set(permissionIds.map((item) => item.permissionId)),
    ];
    const permissions = uniquePermissionIds.length
      ? await this.permissionRepository.findAll({
          where: { id: { [Op.in]: uniquePermissionIds } },
          attributes: ['code'],
          order: [['code', 'ASC']],
          transaction,
        })
      : [];

    return {
      sub: user.id,
      email: user.email,
      roles: userRoles.map((role) => role.code).sort(),
      permissions: permissions.map((permission) => permission.code),
      mustChangePassword: user.mustChangePassword,
    };
  }

  async getPermissions(): Promise<PermissionModel[]> {
    return this.permissionRepository.findAll({ order: [['code', 'ASC']] });
  }

  async ensureSystemDefinitions(transaction?: Transaction): Promise<void> {
    const run = async (activeTransaction: Transaction) => {
      const permissions = new Map<string, PermissionModel>();
      for (const code of PERMISSION_CODES) {
        const [permission] = await this.permissionRepository.findOrCreate({
          where: { code },
          defaults: {
            code,
            name: code,
            description: `System permission: ${code}`,
          },
          transaction: activeTransaction,
        });
        permissions.set(code, permission);
      }
      for (const code of ['user', 'author', 'admin'] as const) {
        const [role] = await this.roleRepository.findOrCreate({
          where: { code },
          defaults: {
            code,
            name: code.charAt(0).toUpperCase() + code.slice(1),
            description: `System role: ${code}`,
            isSystem: true,
          },
          transaction: activeTransaction,
        });
        if (!role.isSystem) {
          await role.update(
            { isSystem: true },
            { transaction: activeTransaction },
          );
        }
        for (const permissionCode of SYSTEM_ROLE_PERMISSIONS[code]) {
          const permission = permissions.get(permissionCode);
          if (!permission) continue;
          await this.rolePermissionRepository.findOrCreate({
            where: { roleId: role.id, permissionId: permission.id },
            defaults: { roleId: role.id, permissionId: permission.id },
            transaction: activeTransaction,
          });
        }
      }
    };

    if (transaction) return run(transaction);
    await this.sequelize.transaction(run);
  }

  async getRoles(): Promise<RoleModel[]> {
    return this.roleRepository.findAll({
      include: [
        {
          model: PermissionModel,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
      order: [['code', 'ASC']],
    });
  }

  async createRole(dto: CreateRoleDto): Promise<RoleModel> {
    return this.sequelize.transaction(async (transaction) => {
      if (
        await this.roleRepository.findOne({
          where: { code: dto.code },
          transaction,
        })
      ) {
        throw new ConflictException('Role code is already in use');
      }
      await this.assertPermissionsExist(dto.permissionIds, transaction);
      const role = await this.roleRepository.create(
        {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          isSystem: false,
        },
        { transaction },
      );
      await this.replaceRolePermissions(
        role.id,
        dto.permissionIds,
        transaction,
      );
      return this.getRoleById(role.id, transaction);
    });
  }

  async updateRole(id: number, dto: UpdateRoleDto): Promise<RoleModel> {
    return this.sequelize.transaction(async (transaction) => {
      const role = await this.roleRepository.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!role) throw new NotFoundException('Role not found');
      if (role.isSystem) {
        throw new ForbiddenException('System roles are read-only');
      }

      if (dto.permissionIds) {
        await this.assertPermissionsExist(dto.permissionIds, transaction);
        await this.assertManageAccessRemains(
          role.id,
          dto.permissionIds,
          transaction,
        );
        await this.replaceRolePermissions(
          role.id,
          dto.permissionIds,
          transaction,
        );
      }
      await role.update(
        {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
        },
        { transaction },
      );
      return this.getRoleById(role.id, transaction);
    });
  }

  async deleteRole(
    id: number,
  ): Promise<{ deletedRoleId: number; affectedUsers: number }> {
    return this.sequelize.transaction(async (transaction) => {
      const role = await this.roleRepository.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!role) throw new NotFoundException('Role not found');
      if (role.isSystem)
        throw new ForbiddenException('System roles cannot be deleted');
      await this.assertManageAccessRemains(role.id, [], transaction);
      const affectedUsers = await this.userRoleRepository.count({
        where: { roleId: role.id },
        transaction,
      });
      await this.userRoleRepository.destroy({
        where: { roleId: role.id },
        transaction,
      });
      await this.rolePermissionRepository.destroy({
        where: { roleId: role.id },
        transaction,
      });
      await role.destroy({ transaction });
      return { deletedRoleId: id, affectedUsers };
    });
  }

  async assertUserCanLoseManageAccess(
    userId: number,
    transaction: Transaction,
  ): Promise<void> {
    const manageRoleIds = await this.getManageRoleIds(transaction);
    if (!manageRoleIds.length) return;
    const isManager = await this.userRoleRepository.count({
      where: { userId, roleId: { [Op.in]: manageRoleIds } },
      transaction,
    });
    if (!isManager) return;
    const other = await this.userRoleRepository.findOne({
      where: {
        userId: { [Op.ne]: userId },
        roleId: { [Op.in]: manageRoleIds },
      },
      transaction,
    });
    if (!other)
      throw new ForbiddenException(
        'At least one active RBAC manager is required',
      );
  }

  async getUsers(query = '', count = 20, offset = 0) {
    const where = query
      ? {
          [Op.or]: [
            { email: { [Op.iLike]: `%${query}%` } },
            { displayName: { [Op.iLike]: `%${query}%` } },
          ],
        }
      : undefined;
    const { rows, count: total } = await this.userRepository.findAndCountAll({
      where,
      attributes: [
        'id',
        'email',
        'displayName',
        'accountStatus',
        'blockedAt',
        'deletedAt',
      ],
      order: [['id', 'ASC']],
      limit: count,
      offset,
      distinct: true,
    });
    const roles = await this.getRolesForUsers(rows.map((user) => user.id));
    return {
      items: rows.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        accountStatus: user.accountStatus,
        blockedAt: user.blockedAt,
        deletedAt: user.deletedAt,
        roles: roles.get(user.id) ?? [],
      })),
      total,
    };
  }

  async replaceUserRoles(
    userId: number,
    roleIds: number[],
    actor: AuthenticatedPrincipal,
  ) {
    return this.sequelize.transaction(async (transaction) => {
      const user = await this.userRepository.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user) throw new NotFoundException('User not found');
      const roles = await this.roleRepository.findAll({
        where: { id: { [Op.in]: roleIds } },
        transaction,
      });
      if (roles.length !== new Set(roleIds).size) {
        throw new BadRequestException('One or more roles do not exist');
      }
      const userRole = await this.roleRepository.findOne({
        where: { code: 'user' },
        transaction,
      });
      if (!userRole || !roleIds.includes(userRole.id)) {
        throw new BadRequestException('The user role is mandatory');
      }

      const desiredCodes = new Set(roles.map((role) => role.code));
      if (
        userId === actor.sub &&
        actor.roles.includes('admin') &&
        !desiredCodes.has('admin')
      ) {
        throw new ForbiddenException('You cannot remove your own admin role');
      }
      await this.assertLastManagerRemains(userId, roleIds, transaction);
      await this.userRoleRepository.destroy({ where: { userId }, transaction });
      await this.userRoleRepository.bulkCreate(
        roleIds.map((roleId) => ({ userId, roleId })),
        { transaction },
      );
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles: roles.sort((left, right) => left.code.localeCompare(right.code)),
      };
    });
  }

  async assignSystemRole(
    userId: number,
    roleCode: SystemRoleCode,
    transaction?: Transaction,
  ): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { code: roleCode, isSystem: true },
      transaction,
    });
    if (!role) throw new Error(`System role ${roleCode} is not initialized`);
    await this.userRoleRepository.findOrCreate({
      where: { userId, roleId: role.id },
      defaults: { userId, roleId: role.id },
      transaction,
    });
  }

  async removeSystemRole(
    userId: number,
    roleCode: SystemRoleCode,
    transaction?: Transaction,
  ): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { code: roleCode, isSystem: true },
      transaction,
    });
    if (!role) throw new Error(`System role ${roleCode} is not initialized`);
    await this.userRoleRepository.destroy({
      where: { userId, roleId: role.id },
      transaction,
    });
  }

  private async getRolesForUsers(
    userIds: number[],
    transaction?: Transaction,
  ): Promise<Map<number, RoleModel[]>> {
    const result = new Map<number, RoleModel[]>();
    if (!userIds.length) return result;
    const relations = await this.userRoleRepository.findAll({
      where: { userId: { [Op.in]: userIds } },
      transaction,
    });
    const roleIds = [...new Set(relations.map((item) => item.roleId))];
    const roles = roleIds.length
      ? await this.roleRepository.findAll({
          where: { id: { [Op.in]: roleIds } },
          attributes: ['id', 'code', 'name', 'description', 'isSystem'],
          transaction,
        })
      : [];
    const rolesById = new Map(roles.map((role) => [role.id, role]));
    for (const relation of relations) {
      const role = rolesById.get(relation.roleId);
      if (!role) continue;
      const userRoles = result.get(relation.userId) ?? [];
      userRoles.push(role);
      result.set(relation.userId, userRoles);
    }
    return result;
  }

  private async assertPermissionsExist(
    permissionIds: number[],
    transaction: Transaction,
  ): Promise<void> {
    const count = permissionIds.length
      ? await this.permissionRepository.count({
          where: { id: { [Op.in]: permissionIds } },
          transaction,
        })
      : 0;
    if (count !== new Set(permissionIds).size) {
      throw new BadRequestException('One or more permissions do not exist');
    }
  }

  private async replaceRolePermissions(
    roleId: number,
    permissionIds: number[],
    transaction: Transaction,
  ): Promise<void> {
    await this.rolePermissionRepository.destroy({
      where: { roleId },
      transaction,
    });
    if (permissionIds.length) {
      await this.rolePermissionRepository.bulkCreate(
        permissionIds.map((permissionId) => ({ roleId, permissionId })),
        { transaction },
      );
    }
  }

  private async getRoleById(
    id: number,
    transaction: Transaction,
  ): Promise<RoleModel> {
    const role = await this.roleRepository.findByPk(id, {
      include: [
        {
          model: PermissionModel,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
      transaction,
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  private async getManageRoleIds(transaction: Transaction): Promise<number[]> {
    const permission = await this.permissionRepository.findOne({
      where: { code: 'rbac.manage' },
      transaction,
    });
    const [admin, relations] = await Promise.all([
      this.roleRepository.findOne({ where: { code: 'admin' }, transaction }),
      permission
        ? this.rolePermissionRepository.findAll({
            where: { permissionId: permission.id },
            transaction,
          })
        : [],
    ]);
    return [
      ...new Set([
        ...(admin ? [admin.id] : []),
        ...relations.map((item) => item.roleId),
      ]),
    ];
  }

  private async assertLastManagerRemains(
    userId: number,
    desiredRoleIds: number[],
    transaction: Transaction,
  ): Promise<void> {
    const manageRoleIds = await this.getManageRoleIds(transaction);
    if (desiredRoleIds.some((id) => manageRoleIds.includes(id))) return;
    const current = await this.userRoleRepository.count({
      where: { userId, roleId: { [Op.in]: manageRoleIds } },
      transaction,
    });
    if (!current) return;
    const otherManager = await this.userRoleRepository.findOne({
      where: {
        userId: { [Op.ne]: userId },
        roleId: { [Op.in]: manageRoleIds },
      },
      transaction,
    });
    if (!otherManager) {
      throw new ForbiddenException('At least one RBAC manager is required');
    }
  }

  private async assertManageAccessRemains(
    roleId: number,
    desiredPermissionIds: number[],
    transaction: Transaction,
  ): Promise<void> {
    const manage = await this.permissionRepository.findOne({
      where: { code: 'rbac.manage' },
      transaction,
    });
    if (!manage || desiredPermissionIds.includes(manage.id)) return;
    const currentlyGrants = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId: manage.id },
      transaction,
    });
    if (!currentlyGrants) return;
    const roleHasUsers = await this.userRoleRepository.findOne({
      where: { roleId },
      transaction,
    });
    if (!roleHasUsers) return;
    const otherManageRoleIds = (
      await this.getManageRoleIds(transaction)
    ).filter((id) => id !== roleId);
    const otherManager = otherManageRoleIds.length
      ? await this.userRoleRepository.findOne({
          where: { roleId: { [Op.in]: otherManageRoleIds } },
          transaction,
        })
      : null;
    if (!otherManager) {
      throw new ForbiddenException('At least one RBAC manager is required');
    }
  }
}

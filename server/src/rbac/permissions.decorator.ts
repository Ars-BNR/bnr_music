import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from './rbac.constants';

export const PERMISSIONS_KEY = 'required_permissions';
export const Permissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

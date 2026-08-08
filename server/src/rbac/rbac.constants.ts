export const ROLE_CODES = ['user', 'author', 'admin'] as const;
export type SystemRoleCode = (typeof ROLE_CODES)[number];

export const PERMISSION_CODES = [
  'profile.manage-own',
  'library.manage-own',
  'creator.apply',
  'creator.publish',
  'creator.moderate',
  'catalog.manage',
  'users.read',
  'users.manage',
  'rbac.manage',
  'analytics.read',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export const SYSTEM_ROLE_PERMISSIONS: Record<
  SystemRoleCode,
  readonly PermissionCode[]
> = {
  user: ['profile.manage-own', 'library.manage-own', 'creator.apply'],
  author: ['creator.publish'],
  admin: PERMISSION_CODES,
};

export interface AuthenticatedPrincipal {
  sub: number;
  email: string;
  roles: string[];
  permissions: string[];
  mustChangePassword?: boolean;
}

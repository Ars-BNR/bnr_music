export interface RbacPermission {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface RbacRoleSummary {
  id: number;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
}

export interface RbacRole extends RbacRoleSummary {
  permissions: RbacPermission[];
}

export interface RbacUser {
  id: number;
  email: string;
  displayName: string;
  roles: RbacRoleSummary[];
  accountStatus?: "active" | "blocked" | "deleted";
  permissions?: string[];
}

export interface RbacUsersPage {
  items: RbacUser[];
  total: number;
}

export interface RoleDraft {
  code: string;
  name: string;
  description: string;
  permissionIds: number[];
}

export const emptyRoleDraft: RoleDraft = {
  code: "",
  name: "",
  description: "",
  permissionIds: [],
};

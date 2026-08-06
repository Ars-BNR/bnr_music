import $api from "@/entities/http-service";
import type {
  RbacPermission,
  RbacRole,
  RbacUser,
  RbacUsersPage,
  RoleDraft,
} from "../model/admin-access";

export const adminAccessApi = {
  async getPermissions(): Promise<RbacPermission[]> {
    const { data } = await $api.get("/rbac/permissions");
    return data;
  },

  async getRoles(): Promise<RbacRole[]> {
    const { data } = await $api.get("/rbac/roles");
    return data;
  },

  async getUsers(query = "", count = 20, offset = 0): Promise<RbacUsersPage> {
    const { data } = await $api.get("/rbac/users", {
      params: { query: query || undefined, count, offset },
    });
    return data;
  },

  async createRole(values: RoleDraft): Promise<RbacRole> {
    const { data } = await $api.post("/rbac/roles", values);
    return data;
  },

  async updateRole(id: number, values: Omit<RoleDraft, "code">): Promise<RbacRole> {
    const { data } = await $api.patch(`/rbac/roles/${id}`, values);
    return data;
  },

  async replaceUserRoles(userId: number, roleIds: number[]): Promise<RbacUser> {
    const { data } = await $api.put(`/rbac/users/${userId}/roles`, { roleIds });
    return data;
  },
};

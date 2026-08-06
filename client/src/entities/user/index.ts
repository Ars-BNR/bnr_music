import $api from "@/entities/http-service";

export { UserAvatar } from "./ui/UserAvatar";

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  roles: string[];
  permissions: string[];
  isActivated: boolean;
}

export const ROLE_CODES = ["user", "author", "admin"] as const;
export type SystemRoleCode = (typeof ROLE_CODES)[number];

export const PERMISSION_CODES = [
  "profile.manage-own",
  "library.manage-own",
  "creator.apply",
  "creator.publish",
  "creator.moderate",
  "catalog.manage",
  "users.read",
  "rbac.manage",
] as const;
export type PermissionCode = (typeof PERMISSION_CODES)[number];

export interface AccessSubject {
  roles?: readonly string[] | null;
  permissions?: readonly string[] | null;
}

export const hasRole = (subject: AccessSubject | null | undefined, role: string) =>
  subject?.roles?.includes(role) ?? false;

export const hasPermission = (
  subject: AccessSubject | null | undefined,
  permission: PermissionCode,
) => hasRole(subject, "admin") || (subject?.permissions?.includes(permission) ?? false);

export interface CollectionSummary {
  collectionId: number;
  totalPlaylists: number;
  totalAlbums: number;
  totalTracks: number;
}

export const profileApi = {
  async get(): Promise<UserProfile> {
    const { data } = await $api.get("/users/me");
    return data;
  },
  async update(values: Pick<UserProfile, "displayName" | "bio">): Promise<UserProfile> {
    const { data } = await $api.patch("/users/me", values);
    return data;
  },
  async uploadAvatar(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await $api.post("/users/me/avatar", formData);
    return data;
  },
  async removeAvatar(): Promise<UserProfile> {
    const { data } = await $api.delete("/users/me/avatar");
    return data;
  },
  async changeEmail(currentPassword: string, newEmail: string): Promise<void> {
    await $api.post("/users/me/change-email", { currentPassword, newEmail });
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await $api.post("/users/me/change-password", { currentPassword, newPassword });
  },
  async getSummary(): Promise<CollectionSummary> {
    const { data } = await $api.get("/collection/me/summary");
    return data;
  },
};

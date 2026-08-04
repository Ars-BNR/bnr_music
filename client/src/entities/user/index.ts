import $api from "@/entities/http-service";

export { UserAvatar } from "./ui/UserAvatar";

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  role: string;
  isActivated: boolean;
}

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

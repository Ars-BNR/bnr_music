import $api from "@/entities/http-service";
import type { ITrack } from "@/shared/types/track";

export interface FavoriteTracksPage {
  items: ITrack[];
  total: number;
}

export const favoriteTracksApi = {
  async get(count = 20, offset = 0): Promise<FavoriteTracksPage> {
    const { data } = await $api.get("/collection/me/tracks", {
      params: { count, offset },
    });
    return data;
  },

  async status(trackId: number): Promise<{ isFavorite: boolean }> {
    const { data } = await $api.get(
      `/collection/me/tracks/${trackId}/status`,
    );
    return data;
  },

  async add(trackId: number): Promise<{ isFavorite: true }> {
    const { data } = await $api.put(`/collection/me/tracks/${trackId}`);
    return data;
  },

  async remove(trackId: number): Promise<{ isFavorite: false }> {
    const { data } = await $api.delete(`/collection/me/tracks/${trackId}`);
    return data;
  },
};

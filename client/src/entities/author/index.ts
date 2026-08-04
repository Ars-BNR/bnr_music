import $api from "@/entities/http-service";
import type { IAlbum } from "@/shared/types/album";
import type { ITrack } from "@/shared/types/track";

export interface Author {
  id: number;
  name: string;
  bio?: string;
  avatar?: string | null;
}

export const authorApi = {
  async get(id: number): Promise<Author> {
    const { data } = await $api.get(`/authors/${id}`);
    return data;
  },
  async getTracks(id: number, count = 20, offset = 0): Promise<{ tracks: ITrack[]; total: number }> {
    const { data } = await $api.get(`/authors/${id}/tracks`, { params: { count, offset } });
    return data;
  },
  async getAlbums(id: number, count = 12, offset = 0): Promise<{ albums: IAlbum[]; total: number }> {
    const { data } = await $api.get(`/authors/${id}/albums`, { params: { count, offset } });
    return data;
  },
};

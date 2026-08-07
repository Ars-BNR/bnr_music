import $api from "@/entities/http-service";
import type { IAlbum } from "@/shared/types/album";

export interface AlbumCatalogPage {
  items: IAlbum[];
  total: number;
}

export const albumCatalogApi = {
  async get(count = 20, offset = 0, signal?: AbortSignal): Promise<AlbumCatalogPage> {
    const { data } = await $api.get<AlbumCatalogPage>("/albums/catalog", {
      params: { count, offset },
      signal,
    });
    return data;
  },

  async search(query: string, count = 20, offset = 0, signal?: AbortSignal): Promise<AlbumCatalogPage> {
    const { data } = await $api.get<AlbumCatalogPage>("/search/albums", {
      params: { query, count, offset },
      signal,
    });
    return data;
  },
};

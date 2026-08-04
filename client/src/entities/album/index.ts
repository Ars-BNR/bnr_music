import $api from "@/entities/http-service";
import type { IAlbum } from "@/shared/types/album";

export { AlbumCard } from "./ui/AlbumCard";

export interface FavoriteAlbum extends IAlbum {
  favoriteRelationId: number;
}

export interface PaginatedAlbums {
  items: FavoriteAlbum[];
  total: number;
}

export const favoriteAlbumsApi = {
  async get(count = 20, offset = 0): Promise<PaginatedAlbums> {
    const { data } = await $api.get("/collection/me/albums", { params: { count, offset } });
    return data;
  },
  async status(albumId: number): Promise<{ isFavorite: boolean }> {
    const { data } = await $api.get(`/collection/me/albums/${albumId}/status`);
    return data;
  },
  async add(albumId: number): Promise<{ isFavorite: boolean }> {
    const { data } = await $api.put(`/collection/me/albums/${albumId}`);
    return data;
  },
  async remove(albumId: number): Promise<{ isFavorite: boolean }> {
    const { data } = await $api.delete(`/collection/me/albums/${albumId}`);
    return data;
  },
};

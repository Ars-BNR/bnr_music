import { create } from "zustand";
import { CollectionState } from "../types/collection";
import collectionService from "@/entities/collection-service";

interface CollectionStore extends CollectionState {
  getUserAlbums: (
    id: number,
    params?: { limit?: number; offset?: number }
  ) => Promise<void>;
  getUserPlaylists: (
    id: number,
    params?: { limit?: number; offset?: number }
  ) => Promise<void>;
  getUserTracks: (
    id: number,
    params?: { limit?: number; offset?: number }
  ) => Promise<void>;
}

const useCollectionStore = create<CollectionStore>((set) => ({
  userAlbums: [],
  userPlaylist: [],
  userTracks: [],
  error: "",
  loading: false,

  // Метод для получения альбомов пользователя
  getUserAlbums: async (id, params = { limit: 10, offset: 0 }) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getAlbums(id, params);
      set({ userAlbums: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Метод для получения плейлистов пользователя
  getUserPlaylists: async (id, params = { limit: 10, offset: 0 }) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getPlaylists(id, params);
      set({ userPlaylist: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Метод для получения треков пользователя
  getUserTracks: async (id, params = { limit: 10, offset: 0 }) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getTracks(id, params);
      set({ userTracks: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));

export default useCollectionStore;

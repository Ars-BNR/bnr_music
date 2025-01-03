import { create } from "zustand";
import albumService from "@/entities/album-service";
import { AlbumState } from "../types/album";

interface AlbumStore extends AlbumState {
  fetchTopAlbums: (params?: {
    count?: number;
    offset?: number;
  }) => Promise<void>;
  getOneById: (id: number) => void;
}

const useAlbumStore = create<AlbumStore>((set) => ({
  albums: [],
  error: "",
  selectedAlbumTracks: null,
  loading: false,

  fetchTopAlbums: async (params = { count: 5, offset: 0 }) => {
    try {
      set({ loading: true });
      const data = await albumService.getTopAlbums(params);
      console.log("dataAlbums", data);
      set({ albums: data, error: "" });
    } catch {
      set({ error: "Произошла ошибка при загрузке треков" });
    } finally {
      set({ loading: false });
    }
  },

  getOneById: async (id) => {
    try {
      set({ loading: true });
      const data = await albumService.getOne(id);
      console.log("TracksAlbum", data);
      set({ selectedAlbumTracks: data, error: "" });
    } catch (error) {
      set({ error: "Произошла ошибка при загрузке треков из Альбома" });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useAlbumStore;

import { create } from "zustand";
import { CollectionState } from "../types/collection";
import collectionService from "@/entities/collection-service";
import useTrackStore from "./track";

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
  getUserTracksFromPlaylist: (
    idPlaylist: number,
    params?: { limit?: number; offset?: number }
  ) => Promise<void>;
  addTrackToCollection: (
    collectionId: number,
    trackId: number
  ) => Promise<void>;
  removeTrackFromCollection: (
    collectionId: number,
    trackId: number
  ) => Promise<void>;
}

const useCollectionStore = create<CollectionStore>((set) => ({
  userAlbums: [],
  userPlaylist: [],
  userTracks: [],
  userTracksFromPlaylist: null,
  error: "",
  loading: false,

  getUserAlbums: async (id, params = { limit: 10, offset: 0 }) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getAlbums(id, params);
      set({ userAlbums: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getUserPlaylists: async (id, params = { limit: 10, offset: 0 }) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getPlaylists(id, params);
      set({ userPlaylist: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getUserTracks: async (id, params = { limit: 10, offset: 0 }) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getTracks(id, params);
      set({ userTracks: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  getUserTracksFromPlaylist: async (
    idPlaylist,
    params = { limit: 10, offset: 0 }
  ) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getTracksFromPlaylist(
        idPlaylist,
        params
      );
      set({ userTracksFromPlaylist: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addTrackToCollection: async (collectionId, trackId) => {
    set({ loading: true, error: "" });
    try {
      await collectionService.addTrackToCollection(collectionId, trackId);

      const track = useTrackStore
        .getState()
        .tracks.find((t) => t.id === trackId);

      if (!track) {
        throw new Error("Трек не найден");
      }

      // Обновляем локальное состояние, добавляя новый трек
      set((state) => ({
        userTracks: [...state.userTracks, track],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  removeTrackFromCollection: async (collectionId, trackId) => {
    set({ loading: true, error: "" });
    try {
      await collectionService.removeTrackFromCollection(collectionId, trackId);
      set((state) => ({
        userTracks: state.userTracks.filter((track) => track.id !== trackId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));

export default useCollectionStore;

import { create } from "zustand";
import collectionService from "@/entities/collection-service";
import { ITrack } from "@/shared/types/track";
import { CollectionState } from "../types/collection";

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Request failed");

interface CollectionStore extends CollectionState {
  getUserAlbums: (id: number, params?: { limit?: number; offset?: number }) => Promise<void>;
  getUserPlaylists: (id: number, params?: { limit?: number; offset?: number }) => Promise<void>;
  getUserTracks: (id: number, params?: { limit?: number; offset?: number }) => Promise<void>;
  getUserTracksFromPlaylist: (idPlaylist: number, params?: { limit?: number; offset?: number }) => Promise<void>;
  addTrackToCollection: (collectionId: number, track: ITrack) => Promise<void>;
  removeTrackFromCollection: (collectionId: number, trackId: number) => Promise<void>;
}

const useCollectionStore = create<CollectionStore>((set) => ({
  userAlbums: [],
  userPlaylist: [],
  userTracks: [],
  userTracksFromPlaylist: {
    id: 0,
    name: "",
    userId: 0,
    tracks: [],
  },
  error: "",
  loading: false,

  getUserAlbums: async (id, params = { limit: 10, offset: 0 }) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getAlbums(id, params);
      set({ userAlbums: data, loading: false });
    } catch (error: unknown) {
      set({ error: errorMessage(error), loading: false });
    }
  },

  getUserPlaylists: async (id, params = { limit: 10, offset: 0 }) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getPlaylists(id, params);
      set({ userPlaylist: data, loading: false });
    } catch (error: unknown) {
      set({ error: errorMessage(error), loading: false });
    }
  },

  getUserTracks: async (id, params = { limit: 10, offset: 0 }) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getTracks(id, params);
      set({ userTracks: data, loading: false });
    } catch (error: unknown) {
      set({ error: errorMessage(error), loading: false });
    }
  },

  getUserTracksFromPlaylist: async (idPlaylist, params = { limit: 10, offset: 0 }) => {
    set({ loading: true, error: "" });
    try {
      const data = await collectionService.getTracksFromPlaylist(idPlaylist, params);
      set({ userTracksFromPlaylist: data, loading: false });
    } catch (error: unknown) {
      set({ error: errorMessage(error), loading: false });
    }
  },

  addTrackToCollection: async (collectionId, track) => {
    set({ loading: true, error: "" });
    try {
      await collectionService.addTrackToCollection(collectionId, track.id);
      set((state) => ({
        userTracks: state.userTracks.some((userTrack) => userTrack.id === track.id)
          ? state.userTracks
          : [...state.userTracks, track],
        loading: false,
      }));
    } catch (error: unknown) {
      set({ error: errorMessage(error), loading: false });
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
    } catch (error: unknown) {
      set({ error: errorMessage(error), loading: false });
    }
  },
}));

export default useCollectionStore;

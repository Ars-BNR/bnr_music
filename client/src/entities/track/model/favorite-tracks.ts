import { create } from "zustand";
import type { ITrack } from "@/shared/types/track";
import { favoriteTracksApi } from "../api/favorite-tracks";

const PAGE_SIZE = 20;
const loadError = "Не удалось загрузить любимые треки.";
const mutationError = "Не удалось обновить любимые треки.";

interface FavoriteTracksState {
  items: ITrack[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  checkingTrackId: number | null;
  mutatingTrackId: number | null;
  statusById: Record<number, boolean>;
  error: string;
  mutationError: string;
  loadInitial: () => Promise<void>;
  loadMore: () => Promise<void>;
  checkStatus: (trackId: number) => Promise<void>;
  add: (track: ITrack) => Promise<boolean>;
  remove: (trackId: number) => Promise<boolean>;
  clearMutationError: () => void;
}

const appendUnique = (current: ITrack[], incoming: ITrack[]) => [
  ...current,
  ...incoming.filter(
    (track) => !current.some((candidate) => candidate.id === track.id),
  ),
];

export const useFavoriteTracksStore = create<FavoriteTracksState>((set, get) => ({
  items: [],
  total: 0,
  loading: false,
  loadingMore: false,
  checkingTrackId: null,
  mutatingTrackId: null,
  statusById: {},
  error: "",
  mutationError: "",

  loadInitial: async () => {
    set({ loading: true, error: "" });
    try {
      const data = await favoriteTracksApi.get(PAGE_SIZE, 0);
      set((state) => ({
        items: data.items,
        total: data.total,
        error: "",
        statusById: data.items.reduce<Record<number, boolean>>(
          (statuses, track) => ({ ...statuses, [track.id]: true }),
          state.statusById,
        ),
      }));
    } catch {
      set({ error: loadError });
    } finally {
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { items, total, loadingMore } = get();
    if (loadingMore || items.length >= total) return;
    set({ loadingMore: true, error: "" });
    try {
      const data = await favoriteTracksApi.get(PAGE_SIZE, items.length);
      set((state) => ({
        items: appendUnique(state.items, data.items),
        total: data.total,
        error: "",
        statusById: data.items.reduce<Record<number, boolean>>(
          (statuses, track) => ({ ...statuses, [track.id]: true }),
          state.statusById,
        ),
      }));
    } catch {
      set({ error: "Не удалось загрузить следующие любимые треки." });
    } finally {
      set({ loadingMore: false });
    }
  },

  checkStatus: async (trackId) => {
    set({ checkingTrackId: trackId, mutationError: "" });
    try {
      const data = await favoriteTracksApi.status(trackId);
      set((state) => ({
        statusById: { ...state.statusById, [trackId]: data.isFavorite },
      }));
    } catch {
      set({ mutationError: "Не удалось проверить, добавлен ли трек в любимое." });
    } finally {
      set((state) => ({
        checkingTrackId:
          state.checkingTrackId === trackId ? null : state.checkingTrackId,
      }));
    }
  },

  add: async (track) => {
    set({ mutatingTrackId: track.id, mutationError: "" });
    try {
      await favoriteTracksApi.add(track.id);
      set((state) => {
        const wasFavorite = state.statusById[track.id] === true;
        return {
          items: wasFavorite ? state.items : appendUnique(state.items, [track]),
          total: wasFavorite ? state.total : state.total + 1,
          statusById: { ...state.statusById, [track.id]: true },
        };
      });
      return true;
    } catch {
      set({ mutationError });
      return false;
    } finally {
      set({ mutatingTrackId: null });
    }
  },

  remove: async (trackId) => {
    set({ mutatingTrackId: trackId, mutationError: "" });
    try {
      await favoriteTracksApi.remove(trackId);
      set((state) => {
        const wasFavorite = state.statusById[trackId] === true;
        return {
          items: state.items.filter((track) => track.id !== trackId),
          total: wasFavorite ? Math.max(0, state.total - 1) : state.total,
          statusById: { ...state.statusById, [trackId]: false },
        };
      });
      return true;
    } catch {
      set({ mutationError });
      return false;
    } finally {
      set({ mutatingTrackId: null });
    }
  },

  clearMutationError: () => set({ mutationError: "" }),
}));

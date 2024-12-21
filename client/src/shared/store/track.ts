import { create } from "zustand";
import { TrackState } from "@/shared/types/track";
import trackService from "@/entities/track-service";

interface TrackStore extends TrackState {
  fetchTopTracks: (params?: {
    count?: number;
    offset?: number;
  }) => Promise<void>;
  searchTracks: (query: string) => Promise<void>;
}

const useTrackStore = create<TrackStore>((set) => ({
  tracks: [],
  error: "",

  fetchTopTracks: async (params = { count: 5, offset: 0 }) => {
    try {
      const data = await trackService.getTopTracks(params);
      console.log("data", data);
      set({ tracks: data, error: "" });
    } catch {
      set({ error: "Произошла ошибка при загрузке треков" });
    }
  },

  searchTracks: async (query: string) => {
    try {
      const data = await trackService.searchTracks(query);
      set({ tracks: data, error: "" });
    } catch {
      set({ error: "Произошла ошибка при загрузке треков" });
    }
  },
}));

export default useTrackStore;

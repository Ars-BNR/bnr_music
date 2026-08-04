import $api from "@/entities/http-service";
import type { ITrack } from "@/shared/types/track";

export { PlaylistCard } from "./ui/PlaylistCard";

export interface PlaylistSummary {
  id: number;
  name: string;
  userId: number;
  trackCount: number;
}

export interface PlaylistDetail {
  id: number;
  name: string;
  userId: number;
  tracks: ITrack[];
  total: number;
}

export const PLAYLISTS_CHANGED_EVENT = "bnr:playlists-changed";

export const notifyPlaylistsChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PLAYLISTS_CHANGED_EVENT));
  }
};

export const playlistApi = {
  async getMine(count = 20, offset = 0): Promise<{ items: PlaylistSummary[]; total: number }> {
    const { data } = await $api.get("/playlist/mine", { params: { count, offset } });
    return data;
  },
  async get(id: number, count = 20, offset = 0): Promise<PlaylistDetail> {
    const { data } = await $api.get(`/playlist/${id}`, { params: { count, offset } });
    return data;
  },
  async create(name: string): Promise<PlaylistSummary> {
    const { data } = await $api.post("/playlist", { name });
    return data;
  },
  async rename(id: number, name: string): Promise<PlaylistSummary> {
    const { data } = await $api.patch(`/playlist/change/${id}`, { name });
    return data;
  },
  async remove(id: number): Promise<void> {
    await $api.delete(`/playlist/delete/${id}`);
  },
  async addTrack(id: number, trackId: number): Promise<void> {
    await $api.post(`/playlist/${id}/tracks`, { trackId });
  },
  async removeTrack(id: number, trackId: number): Promise<void> {
    await $api.delete(`/playlist/${id}/tracks/${trackId}`);
  },
};

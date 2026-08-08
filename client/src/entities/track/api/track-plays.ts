import $api from "@/entities/http-service";

export const trackPlaysApi = {
  async record(trackId: number, playbackId: string) {
    const { data } = await $api.post<{
      recorded: boolean;
      listens: number;
    }>(`/tracks/${trackId}/plays`, { playbackId });
    return data;
  },
};

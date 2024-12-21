import $api from "./http-service";

const getPopTracksEndpoint = "/tracks/popular";

const trackService = {
  getTopTracks: async (queryParams: object) => {
    const { data } = await $api.get(getPopTracksEndpoint, {
      params: queryParams,
    });
    return data;
  },

  searchTracks: async (query: string) => {
    const { data } = await $api.get(`/search`, {
      params: { query },
    });
    return data;
  },
};

export default trackService;

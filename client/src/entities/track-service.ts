import $api from "./http-service";

const getPopTracksEndpoint = "/tracks/popular";
const getSearchEndpoint = "/tracks/search?";

const trackService = {
  getTopTracks: async (queryParams: object) => {
    const { data } = await $api.get(getPopTracksEndpoint, {
      params: queryParams,
    });
    return data;
  },

  searchTracks: async (query: string) => {
    const { data } = await $api.get(getSearchEndpoint, {
      params: { query },
    });
    return data;
  },
};

export default trackService;

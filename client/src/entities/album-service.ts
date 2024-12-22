import $api from "./http-service";

const getPopAlbumEndpoint = "/albums/popular";

const albumService = {
  getTopAlbums: async (queryParams: object) => {
    const { data } = await $api.get(getPopAlbumEndpoint, {
      params: queryParams,
    });
    return data;
  },
};

export default albumService;

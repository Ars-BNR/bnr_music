import $api from "./http-service";

const getPopAlbumEndpoint = "/albums/popular";
const getAlbumByIdEndpoint = "/albums/";

const albumService = {
  getTopAlbums: async (queryParams: object) => {
    const { data } = await $api.get(getPopAlbumEndpoint, {
      params: queryParams,
    });
    return data;
  },
  getOne: async (id: number) => {
    const { data } = await $api.get(getAlbumByIdEndpoint + id);
    return data;
  },
};

export default albumService;

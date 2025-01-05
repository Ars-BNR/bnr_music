import $api from "./http-service";

const collectionEndpoint = "/collection";

const collectionService = {
  getAll: async (userId: number) => {
    const { data } = await $api.get(`${collectionEndpoint}/user/${userId}`);
    return data;
  },

  getAlbums: async (
    userId: number,
    params?: { limit?: number; offset?: number }
  ) => {
    const { data } = await $api.get(`${collectionEndpoint}_album/${userId}`, {
      params: {
        limit: params?.limit,
        offset: params?.offset,
      },
    });
    return data;
  },

  getPlaylists: async (
    userId: number,
    params?: { limit?: number; offset?: number }
  ) => {
    const { data } = await $api.get(
      `${collectionEndpoint}_playlist/${userId}`,
      {
        params: {
          limit: params?.limit,
          offset: params?.offset,
        },
      }
    );
    return data;
  },

  getTracks: async (
    userId: number,
    params?: { limit?: number; offset?: number }
  ) => {
    const { data } = await $api.get(`${collectionEndpoint}_track/${userId}`, {
      params: {
        limit: params?.limit,
        offset: params?.offset,
      },
    });
    return data;
  },
};

export default collectionService;

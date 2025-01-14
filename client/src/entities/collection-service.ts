import $api from "./http-service";

const collectionEndpoint = "/collection";

const collectionService = {
  getCollectionIdByUserId: async (userId: number) => {
    const { data } = await $api.get(`${collectionEndpoint}/user/${userId}`);
    return data;
  },

  saveCollectionIdToLocalStorage: (collectionId: number) => {
    localStorage.setItem(`collection`, collectionId.toString());
  },

  getCollectionIdFromLocalStorage: () => {
    const collectionId = localStorage.getItem(`collection`);
    return collectionId ? parseInt(collectionId, 10) : null;
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

  addTrackToCollection: async (collectionId: number, trackId: number) => {
    const { data } = await $api.post(`${collectionEndpoint}_track`, {
      collectionId,
      trackId,
    });
    return data;
  },

  removeTrackFromCollection: async (collectionId: number, trackId: number) => {
    const { data } = await $api.delete(`${collectionEndpoint}_track/delete`, {
      data: { collectionId, trackId },
    });
    return data;
  },
  getTracksFromPlaylist: async (idPlaylist: number) => {
    const { data } = await $api.get(`playlist/${idPlaylist}`);
    return data;
  },
};

export default collectionService;

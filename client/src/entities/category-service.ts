import $api from "./http-service";
import type { GenreTracksResponse } from "@/shared/types/category";

const getAllcategoryEndpoint = "/genres";

const categoryService = {
  getAll: async (queryParams: object) => {
    const { data } = await $api.get(getAllcategoryEndpoint, {
      params: queryParams,
    });
    return data;
  },
  getTracks: async (id: number, queryParams: { count: number; offset: number }): Promise<GenreTracksResponse> => {
    const { data } = await $api.get(`/genres/${id}/tracks`, { params: queryParams });
    return data;
  },
};

export default categoryService;

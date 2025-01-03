import $api from "./http-service";

const getAllcategoryEndpoint = "/genres";

const categoryService = {
  getAll: async (queryParams: object) => {
    const { data } = await $api.get(getAllcategoryEndpoint, {
      params: queryParams,
    });
    return data;
  },
};

export default categoryService;

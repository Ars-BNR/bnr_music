import $api from "./http-service";

const getAllAuthorsEndpoint = "/authors";

const authorService = {
  getAll: async (queryParams: object) => {
    const { data } = await $api.get(getAllAuthorsEndpoint, {
      params: queryParams,
    });
    return data;
  },
};

export default authorService;

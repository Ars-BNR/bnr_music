import $api from "@/entities/http-service";
import type {
  SearchEntityMap,
  SearchEntityType,
  SearchPageResult,
  SearchPreview,
} from "../model/catalog-search";

export const catalogSearchApi = {
  async preview(query: string, count = 5, signal?: AbortSignal): Promise<SearchPreview> {
    const { data } = await $api.get<SearchPreview>("/search", {
      params: { query, count },
      signal,
    });
    return data;
  },

  async page<TType extends SearchEntityType>(
    type: TType,
    query: string,
    count = 20,
    offset = 0,
    signal?: AbortSignal,
  ): Promise<SearchPageResult<SearchEntityMap[TType]>> {
    const { data } = await $api.get<SearchPageResult<SearchEntityMap[TType]>>(`/search/${type}`, {
      params: { query, count, offset },
      signal,
    });
    return data;
  },
};

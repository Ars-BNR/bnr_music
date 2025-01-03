import categoryService from "@/entities/category-service";
import { create } from "zustand";
import { CategoryState } from "../types/category";

interface CategoryStore extends CategoryState {
  fetchCategories: (params?: {
    count?: number;
    offset?: number;
  }) => Promise<void>;
}

const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  error: "",
  loading: false,

  fetchCategories: async (params = { count: 5, offset: 0 }) => {
    try {
      set({ loading: true });
      const data = await categoryService.getAll(params);
      console.log("dataAlbums", data);
      set({ categories: data, error: "" });
    } catch {
      set({ error: "Произошла ошибка при загрузке треков" });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useCategoryStore;

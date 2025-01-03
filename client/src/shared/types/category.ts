export interface ICategory {
  id: number;
  name: string;
}

export interface CategoryState {
  categories: ICategory[];
  error: string;
  loading: boolean;
}

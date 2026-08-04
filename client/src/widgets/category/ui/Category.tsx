"use client";

import { CategoryList } from "@/shared/components/common/CategoryList/CategoryList";
import useCategoryStore from "@/shared/store/category";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { SectionHeading } from "@/shared/ui/section-heading";
import { useEffect } from "react";

const Category = () => {
  const { categories, fetchCategories, loading, error } = useCategoryStore();

  useEffect(() => {
    void fetchCategories({ count: 100, offset: 0 });
  }, [fetchCategories]);

  return (
    <section className="mb-16 min-w-0" aria-labelledby="genres-heading">
      <SectionHeading><span id="genres-heading">Жанры</span></SectionHeading>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {!loading && !error && categories.length === 0 ? (
        <Empty className="min-h-[240px]"><EmptyHeader><EmptyTitle>Жанры не найдены</EmptyTitle><EmptyDescription>В каталоге ещё нет жанров.</EmptyDescription></EmptyHeader></Empty>
      ) : <CategoryList categories={categories} loading={loading} variant="grid" />}
    </section>
  );
};

export default Category;

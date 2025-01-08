"use client";

import { CategoryList } from "@/shared/components/common/CategoryList/CategoryList";
import useCategoryStore from "@/shared/store/category";
import React, { useEffect } from "react";

const Category = () => {
  const { categories, fetchCategories, loading } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="bg-black">
      <div className="bg-[#09090B] mb-[70px] overflow-hidden min-h-[72px]">
        <div className="mb-4 flex items-center max-w-[270px] justify-between">
          <span className="text-[16px] text-white">Выберите категорию</span>
        </div>
        <CategoryList categories={categories} loading={loading} />
      </div>
    </div>
  );
};

export default Category;

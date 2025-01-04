"use client";

import { badgeVariants } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import useCategoryStore from "@/shared/store/category";
import Link from "next/link";
import React, { useEffect } from "react";

const Category = () => {
  const { categories, fetchCategories, loading } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="bg-black">
      <div className="mb-4 flex  items-center max-w-[270px] justify-between">
        <span className="text-[16px] text-white">Выберите категорию</span>
      </div>
      <div className="flex flex-wrap gap-[24px] max-w-[894px]">
        {loading
          ? Array(8)
              .fill(0)
              .map((_, index) => (
                <Skeleton key={index} className="h-[32px] w-[57px]" />
              ))
          : categories.map((cat) => (
              <Link
                key={cat.id}
                href={"/"}
                className={badgeVariants({ variant: "default" })}
              >
                {cat.name}
              </Link>
            ))}
      </div>
    </div>
  );
};

export default Category;

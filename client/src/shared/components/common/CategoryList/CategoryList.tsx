"use client";

import { badgeVariants } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import Link from "next/link";
import React from "react";

interface CategoryListProps {
  categories: { id: number; name: string }[];
  loading: boolean;
  className?: string; // Кастомные классы для контейнера
  linkVariant?: "default" | "secondary"; // Варианты стилей для ссылок
}

export const CategoryList = ({
  categories,
  loading,
  className = "",
  linkVariant = "default",
}: CategoryListProps) => {
  return (
    <div className={`flex gap-[24px] flex-wrap max-w-[894px] ${className}`}>
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
              className={badgeVariants({ variant: linkVariant })}
            >
              {cat.name}
            </Link>
          ))}
    </div>
  );
};

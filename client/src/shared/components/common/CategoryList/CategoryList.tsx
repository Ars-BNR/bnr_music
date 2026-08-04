"use client";

import CardItem from "@/shared/components/common/CardItem/CardItem";
import { cn } from "@/shared/components/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

interface CategoryListProps {
  categories: { id: number; name: string }[];
  loading: boolean;
  className?: string;
  variant?: "rail" | "grid";
}

export const CategoryList = ({ categories, loading, className = "", variant = "grid" }: CategoryListProps) => (
  <div
    className={cn(
      variant === "rail"
        ? "flex min-w-max gap-4 pb-1"
        : "grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-4",
      className,
    )}
  >
    {loading
      ? Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className={variant === "rail" ? "h-[72px] w-[148px] shrink-0" : "h-[92px]"} />
        ))
      : categories.map((category) => (
          <CardItem
            key={category.id}
            variant="genre"
            title={category.name}
            href={`/category/${category.id}`}
            ariaLabel={`Открыть жанр ${category.name}`}
            className={variant === "rail" ? "w-[148px] shrink-0" : "min-h-[92px]"}
          />
        ))}
  </div>
);

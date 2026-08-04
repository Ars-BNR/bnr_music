"use client";

import { CategoryList } from "@/shared/components/common/CategoryList/CategoryList";
import useCategoryStore from "@/shared/store/category";
import React, { useCallback, useEffect, useRef } from "react";
const Category = () => {
  const { categories, fetchCategories, loading } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleWheelScroll = useCallback((event: WheelEvent) => {
    const container = scrollContainerRef.current;
    if (!container || container.scrollWidth <= container.clientWidth) return;
    const nextScrollLeft = Math.max(0, Math.min(
      container.scrollLeft + event.deltaY * 1.5,
      container.scrollWidth - container.clientWidth,
    ));
    if (nextScrollLeft === container.scrollLeft) return;
    container.scrollLeft = nextScrollLeft;
    event.preventDefault();
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("wheel", handleWheelScroll, {
        passive: false,
      });
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("wheel", handleWheelScroll);
      }
    };
  }, [handleWheelScroll]);

  return (
    <div className="mb-[70px] min-h-[72px] overflow-hidden bg-background">
      <div className="mb-4 flex  items-center max-w-[270px] justify-between">
        <span className="text-[16px] text-white">Выберите категорию</span>
      </div>
      <div
        ref={scrollContainerRef}
        className="scroll-container flex gap-[24px] overflow-x-auto"
      >
        <CategoryList categories={categories} loading={loading} />
      </div>
    </div>
  );
};

export default Category;

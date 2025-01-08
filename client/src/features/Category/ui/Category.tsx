"use client";

import { CategoryList } from "@/shared/components/common/CategoryList/CategoryList";
import { badgeVariants } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import useCategoryStore from "@/shared/store/category";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
const Category = () => {
  const { categories, fetchCategories, loading } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = () => {
    document.body.style.overflowY = "hidden";
  };

  const handleMouseLeave = () => {
    document.body.style.overflowY = "";
  };

  const handleWheelScroll = (event: WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += event.deltaY * 1.5;
      event.preventDefault();
    }
  };

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
  }, []);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-[#09090B] mb-[70px] overflow-hidden min-h-[72px]"
    >
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

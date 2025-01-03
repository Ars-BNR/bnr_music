"use client";

import { badgeVariants } from "@/shared/components/ui/badge";
import useCategoryStore from "@/shared/store/category";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
const Category = () => {
  const { categories, fetchCategories } = useCategoryStore();
  useEffect(() => {
    fetchCategories();
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Отключение прокрутки на уровне body
  const handleMouseEnter = () => {
    document.body.style.overflowY = "hidden"; // Отключаем вертикальный скролл
  };

  // Возвращение прокрутки
  const handleMouseLeave = () => {
    document.body.style.overflowY = ""; // Возвращаем прокрутку
  };

  // Обработчик для горизонтальной прокрутки
  const handleWheelScroll = (event: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += event.deltaY * 1.5;
      event.preventDefault();
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-[#09090B] mb-[70px] overflow-hidden"
    >
      <div className="mb-4 flex  items-center max-w-[270px] justify-between">
        <span className="text-[16px] text-white">Выберите категорию</span>
      </div>
      <div
        ref={scrollContainerRef}
        className="scroll-container flex gap-[24px] overflow-x-auto"
        onWheel={handleWheelScroll}
      >
        {categories.map((cat) => (
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

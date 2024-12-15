"use client";

import { badgeVariants } from "@/shared/components/ui/badge";
import Link from "next/link";
import React, { useRef } from "react";
import ArrowIcon from "../../../../public/assets/icons/Arrow";
const Category = () => {
  const category = [
    { id: 1, name: "Все" },
    { id: 2, name: "Sad" },
    { id: 3, name: "Party" },
    { id: 4, name: "Фонк" },
    { id: 5, name: "Фонк" },
    { id: 6, name: "Фонк" },
    { id: 7, name: "Фонк" },
    { id: 8, name: "Фонк" },
    { id: 9, name: "Фонк" },
    { id: 10, name: "Фонк" },
    { id: 11, name: "Фонк" },
    { id: 12, name: "Фонк" },
    { id: 13, name: "Фонк" },
    { id: 14, name: "Фонк" },
    { id: 15, name: "Фонк" },
  ];

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
        {category.map((cat) => (
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

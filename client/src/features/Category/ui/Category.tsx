"use client";

import { CategoryList } from "@/shared/components/common/CategoryList/CategoryList";
import useCategoryStore from "@/shared/store/category";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { SectionHeading } from "@/shared/ui/section-heading";
import { useCallback, useEffect, useRef } from "react";

const Category = () => {
  const { categories, fetchCategories, loading, error } = useCategoryStore();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleWheelScroll = useCallback((event: WheelEvent) => {
    const container = scrollContainerRef.current;
    if (!container || container.scrollWidth <= container.clientWidth) return;

    const maxScroll = container.scrollWidth - container.clientWidth;
    const nextScrollLeft = Math.max(0, Math.min(container.scrollLeft + event.deltaY * 1.5, maxScroll));
    if (nextScrollLeft === container.scrollLeft) return;

    container.scrollLeft = nextScrollLeft;
    event.preventDefault();
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    container?.addEventListener("wheel", handleWheelScroll, { passive: false });
    return () => container?.removeEventListener("wheel", handleWheelScroll);
  }, [handleWheelScroll]);

  return (
    <section className="mb-14 min-h-[72px] overflow-hidden" aria-labelledby="home-genres-heading">
      <SectionHeading><span id="home-genres-heading">Выберите жанр</span></SectionHeading>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {!loading && !error && categories.length === 0 ? (
        <Empty className="min-h-[160px]"><EmptyHeader><EmptyTitle>Жанры пока не добавлены</EmptyTitle><EmptyDescription>Зайдите позже — каталог обновляется.</EmptyDescription></EmptyHeader></Empty>
      ) : (
        <div ref={scrollContainerRef} className="scroll-container overflow-x-auto">
          <CategoryList categories={categories} loading={loading} variant="rail" />
        </div>
      )}
    </section>
  );
};

export default Category;

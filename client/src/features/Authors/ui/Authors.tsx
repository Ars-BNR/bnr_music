"use client";

import authorService from "@/entities/author-service";
import CardItem from "@/shared/components/common/CardItem/CardItem";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { SectionHeading } from "@/shared/ui/section-heading";
import { Skeleton } from "@/shared/ui/skeleton";
import { useEffect, useState } from "react";

interface Author { id: number; name: string; }

const Authors = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchAuthors = async () => {
      try {
        setLoading(true);
        const response = await authorService.getAll({ count: 20, offset: 0 });
        if (!cancelled) {
          setAuthors(response);
          setError("");
        }
      } catch {
        if (!cancelled) setError("Не удалось загрузить артистов.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchAuthors();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="mb-16 min-w-0" aria-labelledby="authors-heading">
      <SectionHeading><span id="authors-heading">Артисты</span></SectionHeading>
      {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {!loading && !error && authors.length === 0 ? (
        <Empty className="min-h-[220px]"><EmptyHeader><EmptyTitle>Артисты не найдены</EmptyTitle><EmptyDescription>Список авторов появится после наполнения каталога.</EmptyDescription></EmptyHeader></Empty>
      ) : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="aspect-[4/5]" />)
          : authors.map((author) => <CardItem key={author.id} variant="author" title={author.name} />)}
      </div>}
    </section>
  );
};

export default Authors;

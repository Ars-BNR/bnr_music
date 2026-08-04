import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";

export default function GenreNotFound() {
  return (
    <Empty className="min-h-[360px]">
      <EmptyHeader><EmptyTitle>Жанр не найден</EmptyTitle><EmptyDescription>Проверьте адрес страницы или вернитесь к списку жанров.</EmptyDescription></EmptyHeader>
      <Button asChild variant="brandLink"><Link href="/category">Вернуться к жанрам</Link></Button>
    </Empty>
  );
}

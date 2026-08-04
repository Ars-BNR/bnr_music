import Link from "next/link";
import { ListMusic, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { FleurDeLis } from "@/shared/ui/brand";
import type { PlaylistSummary } from "..";

export function PlaylistCard({ playlist, onRename, onDelete }: { playlist: PlaylistSummary; onRename: () => void; onDelete: () => void }) {
  const count = Number(playlist.trackCount ?? 0);
  return (
    <article className="group relative min-w-0 overflow-hidden border border-bnr-line/60 bg-bnr-surface transition-[border-color,transform] [transition-duration:180ms] hover:-translate-y-0.5 hover:border-bnr-lilac/70 motion-reduce:transform-none">
      <Link href={`/playlist/${playlist.id}`} className="block min-h-[176px] p-4 pr-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac focus-visible:ring-inset" aria-label={`Открыть плейлист ${playlist.name}`}>
        <FleurDeLis aria-hidden="true" className="absolute -right-5 -top-5 size-28 text-bnr-lilac/10" />
        <span className="grid size-12 place-items-center border border-bnr-lilac/35 bg-bnr-violet/10 text-bnr-lilac"><ListMusic aria-hidden="true" className="size-6" /></span>
        <p className="mt-6 line-clamp-2 font-cinzel text-base font-semibold leading-snug text-bnr-bone" title={playlist.name}>{playlist.name}</p>
        <p className="mt-1 text-xs text-bnr-ash">{count} {count === 1 ? "трек" : "треков"}</p>
      </Link>
      <div className="absolute right-2 top-2 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <Button type="button" size="sm" variant="ghost" className="size-8 p-0" aria-label={`Переименовать плейлист ${playlist.name}`} onClick={onRename}><Pencil data-icon="inline-start" /></Button>
        <Button type="button" size="sm" variant="ghost" className="size-8 p-0 text-destructive" aria-label={`Удалить плейлист ${playlist.name}`} onClick={onDelete}><Trash2 data-icon="inline-start" /></Button>
      </div>
    </article>
  );
}

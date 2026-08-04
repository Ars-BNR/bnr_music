"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  notifyPlaylistsChanged,
  playlistApi,
  PlaylistCard,
  type PlaylistSummary,
} from "@/entities/playlist";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { SectionHeading } from "@/shared/ui/section-heading";
import { Skeleton } from "@/shared/ui/skeleton";

const PAGE_SIZE = 20;
const loadError = "Не удалось загрузить плейлисты.";
type DialogState = { kind: "create" } | { kind: "rename" | "delete"; playlist: PlaylistSummary } | null;

export default function PlaylistsCollection() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [name, setName] = useState("");

  const load = useCallback(async (offset = 0) => {
    const data = await playlistApi.getMine(PAGE_SIZE, offset);
    setPlaylists((current) => offset === 0
      ? data.items
      : [...current, ...data.items.filter((item) => !current.some((playlist) => playlist.id === item.id))]);
    setTotal(data.total);
    setError("");
  }, []);

  const loadInitial = useCallback(() => {
    setLoading(true);
    setError("");
    void load()
      .catch(() => setError(loadError))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const open = (next: DialogState) => {
    setDialog(next);
    setName(next?.kind === "rename" ? next.playlist.name : "");
    setError("");
  };
  const close = () => { if (!saving) setDialog(null); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!dialog || !name.trim()) return;
    setSaving(true);
    setError("");
    void (dialog.kind === "create" ? playlistApi.create(name.trim()) : playlistApi.rename(dialog.playlist.id, name.trim()))
      .then((playlist) => {
        setPlaylists((current) => dialog.kind === "create"
          ? [playlist, ...current]
          : current.map((item) => item.id === playlist.id ? { ...item, ...playlist } : item));
        setTotal((current) => dialog.kind === "create" ? current + 1 : current);
        notifyPlaylistsChanged();
        setDialog(null);
      })
      .catch(() => setError("Не удалось сохранить плейлист."))
      .finally(() => setSaving(false));
  };
  const remove = () => {
    if (!dialog || dialog.kind !== "delete") return;
    setSaving(true);
    setError("");
    void playlistApi.remove(dialog.playlist.id)
      .then(() => {
        setPlaylists((current) => current.filter((item) => item.id !== dialog.playlist.id));
        setTotal((current) => Math.max(0, current - 1));
        notifyPlaylistsChanged();
        setDialog(null);
      })
      .catch(() => setError("Не удалось удалить плейлист."))
      .finally(() => setSaving(false));
  };
  const loadMore = () => {
    setLoadingMore(true);
    void load(playlists.length)
      .catch(() => setError("Не удалось загрузить следующие плейлисты."))
      .finally(() => setLoadingMore(false));
  };

  if (loading) return <Skeleton className="min-h-[380px] w-full" />;

  const empty = (
    <Empty className="min-h-[260px]">
      <EmptyHeader>
        <EmptyTitle>Плейлистов пока нет</EmptyTitle>
        <EmptyDescription>Создайте первую подборку и добавьте в неё треки.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
  const retry = (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>{error}</AlertDescription>
      <Button type="button" variant="brandLink" size="sm" onClick={loadInitial}>Повторить</Button>
    </Alert>
  );

  return (
    <section className="mb-16 min-w-0" aria-labelledby="playlists-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <SectionHeading className="mb-0" description="Соберите личные подборки для любого настроения.">
          <span id="playlists-title">Мои плейлисты</span>
        </SectionHeading>
        <Button type="button" variant="brand" onClick={() => open({ kind: "create" })}><Plus data-icon="inline-start" />Создать плейлист</Button>
      </div>
      {error && playlists.length === 0 ? retry : null}
      {!error && playlists.length === 0 ? empty : null}
      {playlists.length > 0 ? (
        <>
          {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {playlists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} onRename={() => open({ kind: "rename", playlist })} onDelete={() => open({ kind: "delete", playlist })} />)}
          </div>
          {playlists.length < total ? <Button type="button" variant="brandLink" className="mt-5 w-full sm:w-auto" disabled={loadingMore} onClick={loadMore}>{loadingMore ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}Показать ещё</Button> : null}
        </>
      ) : null}
      <Dialog open={dialog !== null} onOpenChange={(value) => { if (!value) close(); }}>
        <DialogContent className="border-bnr-line bg-bnr-surface text-bnr-bone">
          <DialogHeader>
            <DialogTitle className="font-cinzel">{dialog?.kind === "create" ? "Создать плейлист" : dialog?.kind === "rename" ? "Переименовать плейлист" : "Удалить плейлист"}</DialogTitle>
            <DialogDescription className="text-bnr-ash">{dialog?.kind === "delete" ? `Плейлист «${dialog.playlist.name}» и его связи будут удалены.` : "Название можно изменить позже."}</DialogDescription>
          </DialogHeader>
          {dialog?.kind === "delete" ? (
            <DialogFooter><Button type="button" variant="ghost" onClick={close} disabled={saving}>Отмена</Button><Button type="button" variant="destructive" onClick={remove} disabled={saving}>{saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}Удалить</Button></DialogFooter>
          ) : (
            <form onSubmit={submit}>
              <Field><FieldLabel htmlFor="playlist-name">Название</FieldLabel><Input id="playlist-name" autoFocus value={name} maxLength={120} onChange={(event) => setName(event.target.value)} className="border-bnr-line bg-bnr-abyss text-bnr-bone" required /></Field>
              <DialogFooter className="mt-6"><Button type="button" variant="ghost" onClick={close} disabled={saving}>Отмена</Button><Button type="submit" variant="brand" disabled={saving || !name.trim()}>{saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}Сохранить</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

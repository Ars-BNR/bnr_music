"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { isAxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  notifyPlaylistsChanged,
  playlistApi,
  type PlaylistDetail,
} from "@/entities/playlist";
import { usePlaybackStore } from "@/entities/playback";
import { TrackRow } from "@/entities/track";
import trackService from "@/entities/track-service";
import type { ITrack } from "@/shared/types/track";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { Field, FieldLabel } from "@/shared/ui/field";
import { FleurDeLis } from "@/shared/ui/brand";
import { HeraldicPanel } from "@/shared/ui/heraldic-panel";
import { Input } from "@/shared/ui/input";
import { SectionHeading } from "@/shared/ui/section-heading";
import { LoadingReveal } from "@/shared/ui/heraldic-loader";
import { Skeleton } from "@/shared/ui/skeleton";

const PAGE_SIZE = 20;
type Modal = "add" | "rename" | "delete" | null;
type InitialLoadFailure = "forbidden" | "not-found" | "unavailable" | null;

export default function Playlist() {
  const params = useParams();
  const router = useRouter();
  const playlistId = Number(params?.id);
  const playFromQueue = usePlaybackStore((state) => state.playFromQueue);
  const replaceQueue = usePlaybackStore((state) => state.replaceQueue);
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ITrack[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadFailure, setLoadFailure] = useState<InitialLoadFailure>(null);
  const requestId = useRef(0);

  const load = useCallback(async (offset = 0) => {
    const data = await playlistApi.get(playlistId, PAGE_SIZE, offset);
    setPlaylist((current) => offset === 0 ? data : { ...data, tracks: [...(current?.tracks ?? []), ...data.tracks.filter((track) => !(current?.tracks ?? []).some((item) => item.id === track.id))] });
    setLoadFailure(null);
  }, [playlistId]);

  const loadInitial = useCallback(() => {
    if (!Number.isInteger(playlistId) || playlistId <= 0) {
      setLoadFailure("not-found");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setLoadFailure(null);
    void load()
      .catch((cause: unknown) => {
        const status = isAxiosError(cause) ? cause.response?.status : undefined;
        setLoadFailure(status === 403 ? "forbidden" : status === 404 ? "not-found" : "unavailable");
      })
      .finally(() => setLoading(false));
  }, [load, playlistId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (playlist) replaceQueue(playlist.tracks, { type: "playlist", id: playlistId });
  }, [playlist, playlistId, replaceQueue]);

  useEffect(() => {
    if (!modal || modal !== "add" || !query.trim()) { setResults([]); return; }
    const nextRequest = ++requestId.current;
    const timer = window.setTimeout(() => {
      void trackService.searchTracks(query).then((tracks: ITrack[]) => {
        if (requestId.current === nextRequest) setResults(tracks);
      }).catch(() => { if (requestId.current === nextRequest) setResults([]); });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [modal, query]);

  const close = () => { if (!busy) { setModal(null); setQuery(""); setResults([]); } };
  const play = (track = playlist?.tracks[0]) => { if (playlist && track) playFromQueue(track, playlist.tracks, { type: "playlist", id: playlist.id }); };
  const addTrack = async (track: ITrack) => { setBusy(true); try { await playlistApi.addTrack(playlistId, track.id); await load(0); setResults((current) => current.filter((item) => item.id !== track.id)); } catch { setError("Не удалось добавить трек. Возможно, он уже есть в плейлисте."); } finally { setBusy(false); } };
  const removeTrack = async (trackId: number) => { setBusy(true); try { await playlistApi.removeTrack(playlistId, trackId); setPlaylist((current) => current ? { ...current, tracks: current.tracks.filter((track) => track.id !== trackId), total: Math.max(0, current.total - 1) } : current); } catch { setError("Не удалось удалить трек из плейлиста."); } finally { setBusy(false); } };
  const submitRename = (event: FormEvent) => { event.preventDefault(); if (!name.trim()) return; setBusy(true); void playlistApi.rename(playlistId, name.trim()).then((data) => { setPlaylist((current) => current ? { ...current, name: data.name } : current); notifyPlaylistsChanged(); setModal(null); }).catch(() => setError("Не удалось переименовать плейлист.")).finally(() => setBusy(false)); };
  const deletePlaylist = () => { setBusy(true); void playlistApi.remove(playlistId).then(() => { notifyPlaylistsChanged(); router.replace("/collection/playlist"); }).catch(() => setError("Не удалось удалить плейлист.")).finally(() => setBusy(false)); };

  if (loading) return <LoadingReveal loading variant="page" label="Открываем плейлист"><Skeleton className="min-h-[520px] w-full" /></LoadingReveal>;
  if (!playlist && loadFailure === "unavailable") return <Alert variant="destructive" className="my-8"><AlertDescription>Не удалось загрузить плейлист. Проверьте подключение и повторите попытку.</AlertDescription><Button type="button" variant="brandLink" size="sm" onClick={loadInitial}>Повторить</Button></Alert>;
  if (!playlist) return <Empty className="min-h-[320px]"><EmptyHeader><EmptyTitle>{loadFailure === "forbidden" ? "Доступ запрещён" : "Плейлист не найден"}</EmptyTitle><EmptyDescription>{loadFailure === "forbidden" ? "У вас нет доступа к этому плейлисту." : "Плейлист с таким идентификатором не существует."}</EmptyDescription></EmptyHeader></Empty>;
  const availableResults = results.filter((track) => !playlist.tracks.some((item) => item.id === track.id));
  return (
    <section className="mb-16 min-w-0" aria-labelledby="playlist-title">
      {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <HeraldicPanel watermark className="mb-7 p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 gap-4"><span className="grid size-16 shrink-0 place-items-center border border-bnr-lilac/45 bg-bnr-violet/10"><FleurDeLis aria-hidden="true" className="size-9 text-bnr-lilac" /></span><div className="min-w-0"><p className="font-cinzel text-[10px] tracking-[0.2em] text-bnr-lilac">ЛИЧНАЯ ПОДБОРКА</p><h1 id="playlist-title" className="mt-2 truncate font-cinzel text-[clamp(2rem,5vw,2.625rem)] font-semibold text-bnr-bone">{playlist.name}</h1><p className="mt-2 text-sm text-bnr-ash">{playlist.total} треков</p></div></div><div className="flex flex-wrap gap-2"><Button type="button" variant="brand" onClick={() => play()} disabled={!playlist.tracks.length}><Play fill="currentColor" data-icon="inline-start" />Слушать</Button><Button type="button" variant="brandLink" onClick={() => { setName(playlist.name); setModal("rename"); }}><Pencil data-icon="inline-start" />Изменить</Button><Button type="button" variant="ghost" className="text-destructive" onClick={() => setModal("delete")}><Trash2 data-icon="inline-start" />Удалить</Button></div></div></HeraldicPanel>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><SectionHeading className="mb-0" description="Добавляйте, убирайте и запускайте треки из этой подборки.">Треки</SectionHeading><Button type="button" variant="brandLink" onClick={() => setModal("add")}><Plus data-icon="inline-start" />Добавить треки</Button></div>
      {playlist.tracks.length ? <div className="space-y-2">{playlist.tracks.map((track, index) => <TrackRow key={track.id} track={track} index={index} onPlay={() => play(track)} onRemove={() => void removeTrack(track.id)} />)}</div> : <Empty className="min-h-[220px]"><EmptyHeader><EmptyTitle>Плейлист пуст</EmptyTitle><EmptyDescription>Добавьте треки через поиск, чтобы начать слушать.</EmptyDescription></EmptyHeader></Empty>}
      {playlist.tracks.length < playlist.total ? <Button type="button" variant="brandLink" className="mt-5 w-full sm:w-auto" disabled={loadingMore} onClick={() => { setLoadingMore(true); void load(playlist.tracks.length).catch(() => setError("Не удалось загрузить ещё треки.")).finally(() => setLoadingMore(false)); }}>{loadingMore ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}Показать ещё</Button> : null}
      <Dialog open={modal !== null} onOpenChange={(value) => { if (!value) close(); }}><DialogContent className="border-bnr-line bg-bnr-surface text-bnr-bone"><DialogHeader><DialogTitle className="font-cinzel">{modal === "add" ? "Добавить треки" : modal === "rename" ? "Переименовать плейлист" : "Удалить плейлист"}</DialogTitle><DialogDescription className="text-bnr-ash">{modal === "add" ? "Ищите треки по названию, автору или альбому." : modal === "delete" ? "Это действие нельзя отменить." : "Новое название увидите только вы."}</DialogDescription></DialogHeader>{modal === "add" ? <div><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти трек" className="border-bnr-line bg-bnr-abyss text-bnr-bone" aria-label="Найти трек для плейлиста" />{query.trim() ? <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{availableResults.length ? availableResults.map((track) => <button type="button" key={track.id} onClick={() => void addTrack(track)} disabled={busy} className="flex w-full min-w-0 items-center justify-between gap-3 border border-bnr-line/60 px-3 py-2 text-left hover:border-bnr-lilac focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{track.name}</span><span className="block truncate text-xs text-bnr-ash">{track.authorName}</span></span><Plus aria-hidden="true" className="size-4 shrink-0 text-bnr-lilac" /></button>) : <p className="p-3 text-sm text-bnr-ash">Новых совпадений нет.</p>}</div> : <p className="mt-3 text-sm text-bnr-ash">Введите минимум один символ.</p>}</div> : modal === "rename" ? <form onSubmit={submitRename}><Field><FieldLabel htmlFor="rename-playlist">Название</FieldLabel><Input id="rename-playlist" autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={120} className="border-bnr-line bg-bnr-abyss text-bnr-bone" /></Field><DialogFooter className="mt-6"><Button type="button" variant="ghost" onClick={close}>Отмена</Button><Button type="submit" variant="brand" disabled={busy || !name.trim()}>Сохранить</Button></DialogFooter></form> : <DialogFooter><Button type="button" variant="ghost" onClick={close}>Отмена</Button><Button type="button" variant="destructive" onClick={deletePlaylist} disabled={busy}>{busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}Удалить</Button></DialogFooter>}</DialogContent></Dialog>
    </section>
  );
}

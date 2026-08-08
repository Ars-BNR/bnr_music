"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { ArrowDown, ArrowUp, Check, ChevronDown, Disc3, FileAudio, ImagePlus, Loader2, Pencil, Plus, Send, ShieldCheck, Trash2, X } from "lucide-react";
import $api from "@/entities/http-service";
import { usePlaybackStore } from "@/entities/playback";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/shared/ui/alert-dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { HeraldicPanel } from "@/shared/ui/heraldic-panel";
import { LoadingReveal } from "@/shared/ui/heraldic-loader";
import { Input } from "@/shared/ui/input";
import { SectionHeading } from "@/shared/ui/section-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { FleurDeLis } from "@/shared/ui/brand";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { AlbumAssignmentDialog, BulkTrackDialog } from "./creator-studio/ui/BulkTrackDialog";
import { DeleteAuthorProfileDialog, EditAuthorProfileDialog, type CreatorAuthorProfile } from "./creator-studio/ui/AuthorProfileActions";
import AuthStore from "@/shared/store/auth";

type Author = { id: number; name: string; avatar?: string | null };
type Studio = { state: "none" } | { state: "pending" | "rejected"; application: { stageName: string; bio: string; avatar: string; reviewNote?: string | null }; author?: CreatorAuthorProfile } | { state: "approved"; author: CreatorAuthorProfile; counts: { tracks: number; albums: number } };
type Item = { id: number; name: string; picture?: string; authorName?: string; text?: string; featuredAuthors?: Author[]; genres?: Genre[]; albums?: Item[]; tracks?: Item[] };
type Genre = { id: number; name: string };

const fileUrl = (path?: string | null) => path ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8340"}/${path}` : null;

const creatorErrorMessage = (error: unknown) => {
  if (!isAxiosError(error)) return "Не удалось сохранить запись. Проверьте обязательные поля и файлы.";
  if (error.response?.status === 404) return "Один из выбранных feat-авторов или связанных разделов больше недоступен.";
  if (error.response?.status === 400) {
    const message = error.response.data && typeof error.response.data === "object" && "message" in error.response.data
      ? error.response.data.message
      : undefined;
    if (message === "Primary author cannot be featured") return "Основного автора нельзя указать как feat-автора.";
    return "Проверьте выбранных feat-авторов и обязательные поля.";
  }
  return "Не удалось сохранить запись. Проверьте подключение и повторите попытку.";
};

function FeaturedAuthors({ value, onChange, primaryAuthorId }: { value: Author[]; onChange: (next: Author[]) => void; primaryAuthorId: number }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const triggerId = useId();
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    const normalizedQuery = query.trim();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void $api.get<Author[]>("/authors", {
        params: { ...(normalizedQuery ? { query: normalizedQuery } : {}), count: 20, offset: 0 },
        signal: controller.signal,
      }).then(({ data }) => {
        if (controller.signal.aborted || currentRequest !== requestId.current) return;
        const selectedIds = new Set(value.map((author) => author.id));
        setResults(data.filter((author) => author.id !== primaryAuthorId && !selectedIds.has(author.id)));
      }).catch(() => {
        if (controller.signal.aborted || currentRequest !== requestId.current) return;
        setResults([]);
        setError("Не удалось загрузить авторов. Попробуйте ещё раз.");
      }).finally(() => {
        if (!controller.signal.aborted && currentRequest === requestId.current) setLoading(false);
      });
    }, normalizedQuery ? 300 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [open, primaryAuthorId, query, retry, value]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      requestId.current += 1;
      setLoading(false);
      setError("");
      setQuery("");
    }
  };

  const selectAuthor = (author: Author) => {
    if (author.id === primaryAuthorId || value.some((selected) => selected.id === author.id)) return;
    onChange([...value, author]);
    setQuery("");
  };

  return <Field>
    <FieldLabel htmlFor={triggerId}>Feat-авторы</FieldLabel>
    <Popover modal open={open} onOpenChange={handleOpenChange}><PopoverTrigger asChild><Button id={triggerId} type="button" variant="brandLink" className="w-full justify-between" aria-label={value.length ? `Выбрано: ${value.length}` : "Добавить feat-автора"} aria-expanded={open} aria-haspopup="listbox" aria-controls={listId}><span aria-live="polite">{value.length ? `Выбрано: ${value.length}` : "Добавить feat-автора"}</span><ChevronDown data-icon="inline-end" /></Button></PopoverTrigger><PopoverContent className="w-[min(22rem,calc(100vw-2rem))] border-bnr-line bg-bnr-surface p-0" align="start" onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus(); }}><Command shouldFilter={false}><CommandInput ref={inputRef} id={inputId} value={query} onValueChange={setQuery} placeholder="Найдите автора" aria-label="Поиск feat-автора" aria-describedby={error ? `${inputId}-error` : undefined} /><CommandList id={listId} aria-busy={loading}>{loading ? <p className="p-3 text-sm text-bnr-ash" role="status" aria-live="polite">Ищем авторов…</p> : error ? <div id={`${inputId}-error`} className="space-y-2 p-3" role="alert"><p className="text-sm text-destructive">{error}</p><Button type="button" variant="brandLink" size="sm" onClick={() => setRetry((current) => current + 1)}>Повторить</Button></div> : <><CommandEmpty>{query.trim() ? "Авторов не найдено." : "Доступных авторов не найдено."}</CommandEmpty><CommandGroup>{results.map((author) => <CommandItem key={author.id} value={String(author.id)} keywords={[author.name]} onSelect={() => selectAuthor(author)}>{author.name}</CommandItem>)}</CommandGroup></>}</CommandList></Command></PopoverContent></Popover>
    {value.length ? <div className="flex flex-wrap gap-2" aria-live="polite">{value.map((author) => <Badge key={author.id} variant="outline" className="gap-1 border-bnr-lilac/50 px-2 py-1 text-bnr-bone">{author.name}<button type="button" aria-label={`Убрать ${author.name}`} onClick={() => onChange(value.filter((item) => item.id !== author.id))}><X className="size-3" /></button></Badge>)}</div> : null}
  </Field>;
}
function GenrePicker({ value, onChange }: { value: Genre[]; onChange: (next: Genre[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [commandValue, setCommandValue] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const triggerId = useId();
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const commandValueRef = useRef("");
  useEffect(() => { void $api.get<Genre[]>("/genres", { params: { count: 100, offset: 0 } }).then(({ data }) => setGenres(data)).catch(() => setGenres([])); }, []);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredGenres = normalizedQuery ? genres.filter((genre) => genre.name.toLocaleLowerCase().includes(normalizedQuery)) : genres;
  const triggerLabel = value.length ? value.map((genre) => genre.name).join(", ") : "Выберите хотя бы один жанр";
  const handleOpenChange = (nextOpen: boolean) => { setOpen(nextOpen); if (!nextOpen) { commandValueRef.current = ""; setQuery(""); setCommandValue(""); } };
  const handleCommandValueChange = (nextValue: string) => { commandValueRef.current = nextValue; setCommandValue(nextValue); };
  const toggleGenre = (genre: Genre) => { const selected = value.some((item) => item.id === genre.id); onChange(selected ? value.filter((item) => item.id !== genre.id) : [...value, genre]); setQuery(""); };
  const handleInputKeyDownCapture = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    const activeValue = commandValueRef.current || commandValue;
    const activeGenre = filteredGenres.find((genre) => String(genre.id) === activeValue);
    if (!activeGenre) return;
    event.preventDefault();
    event.stopPropagation();
    toggleGenre(activeGenre);
  };
  return <Field data-invalid={value.length === 0}><FieldLabel htmlFor={triggerId}>Жанры</FieldLabel><Popover modal open={open} onOpenChange={handleOpenChange}><PopoverTrigger asChild><Button id={triggerId} type="button" variant="brandLink" className="w-full justify-between" aria-label={triggerLabel} aria-expanded={open} aria-haspopup="listbox" aria-controls={listId} aria-invalid={value.length === 0}><span>{triggerLabel}</span><ChevronDown data-icon="inline-end" /></Button></PopoverTrigger><PopoverContent className="w-[min(22rem,calc(100vw-2rem))] border-bnr-line bg-bnr-surface p-0" align="start" onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus(); }}><Command shouldFilter={false} value={commandValue} onValueChange={handleCommandValueChange}><CommandInput ref={inputRef} id={inputId} value={query} onValueChange={setQuery} onKeyDownCapture={handleInputKeyDownCapture} placeholder="Найти жанр" aria-label="Поиск жанра" /><CommandList id={listId}><CommandEmpty>Жанры не найдены.</CommandEmpty><CommandGroup>{filteredGenres.map((genre) => { const selected = value.some((item) => item.id === genre.id); return <CommandItem key={genre.id} value={String(genre.id)} keywords={[genre.name]} onSelect={() => toggleGenre(genre)}><Check className={selected ? "opacity-100" : "opacity-0"} />{genre.name}</CommandItem>; })}</CommandGroup></CommandList></Command></PopoverContent></Popover>{value.length === 0 ? <FieldError>Выберите минимум один жанр.</FieldError> : null}</Field>;
}

export function CreatorStudioPage() {
  const router = useRouter();
  const checkAuth = AuthStore((state) => state.checkAuth);
  const removeAuthorCatalog = usePlaybackStore((state) => state.removeAuthorCatalog);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const load = async () => { setLoading(true); setError(""); try { const { data } = await $api.get<Studio>("/creator/me"); setStudio(data); } catch { setError("Не удалось открыть авторскую студию."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (!avatar) return setPreview(null); const url = URL.createObjectURL(avatar); setPreview(url); return () => URL.revokeObjectURL(url); }, [avatar]);

  const submitApplication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); if (avatar) form.set("avatar", avatar);
    try { await $api.post("/creator/application", form); await $api.get<Studio>("/creator/me").then(({ data }) => setStudio(data)); } catch { setError("Заявка не отправлена. Проверьте поля и файл аватара."); }
  };
  const handleProfileDeleted = async (authorId: number) => {
    removeAuthorCatalog(authorId);
    await checkAuth(router);
    await load();
  };

  return <LoadingReveal loading={loading} variant="page" label="Загружаем авторскую студию">
    <section className="mb-16 min-w-0" aria-labelledby="creator-studio-title">
      {error ? <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {studio?.state === "approved" ? <ApprovedStudio studio={studio} onChanged={load} onProfileDeleted={handleProfileDeleted} /> : <HeraldicPanel watermark className="mx-auto max-w-5xl overflow-hidden p-0">
        <div className="grid min-h-[560px] md:grid-cols-[.9fr_1.1fr]">
          <div className="relative flex flex-col justify-between overflow-hidden border-b border-bnr-line p-7 md:border-b-0 md:border-r md:p-10">
            <FleurDeLis aria-hidden="true" className="absolute -left-20 top-8 size-80 text-bnr-violet/10" />
            <div className="relative"><p className="font-cinzel text-[10px] tracking-[.24em] text-bnr-lilac">УСТАВ ЗВУКОЗАПИСИ</p><h1 id="creator-studio-title" className="mt-4 font-cinzel text-4xl font-semibold text-bnr-bone">Стать автором</h1><p className="mt-4 max-w-sm text-sm leading-6 text-bnr-ash">Откройте собственный архив: после одобрения можно публиковать треки и альбомы, а также приглашать других авторов в feat.</p></div>
            <div className="relative flex items-center gap-3 text-bnr-lilac"><FleurDeLis className="size-9" /><span className="font-cinzel text-xs tracking-[.18em]">BNR CREATOR CHARTER</span></div>
          </div>
          {studio?.state === "pending" ? <StatusPanel title="Заявка на рассмотрении" text="Администратор уже видит ваше досье. Здесь появится доступ к студии после одобрения." icon={<Send />} /> : studio?.state === "rejected" ? <StatusPanel title="Нужна доработка" text={studio.application.reviewNote || "Обновите заявку и отправьте её повторно."} icon={<X />}><ApplicationForm onSubmit={submitApplication} avatar={avatar} setAvatar={setAvatar} preview={preview} initial={studio.application} />{studio.author ? <div className="mt-7 border-t border-bnr-line pt-6"><DeleteAuthorProfileDialog author={studio.author} onDeleted={handleProfileDeleted} /></div> : null}</StatusPanel> : <div className="p-7 md:p-10"><p className="font-cinzel text-[10px] tracking-[.2em] text-bnr-lilac">ЛИЧНЫЙ ДОСТУП</p><h2 className="mt-3 font-cinzel text-3xl font-semibold text-bnr-bone">Подайте заявку</h2><p className="mt-3 text-sm text-bnr-ash">Герб автора, псевдоним и краткая история — всё, что нужно для первого шага.</p><ApplicationForm onSubmit={submitApplication} avatar={avatar} setAvatar={setAvatar} preview={preview} /></div>}
        </div>
      </HeraldicPanel>}
    </section>
  </LoadingReveal>;
}

function ApplicationForm({ onSubmit, avatar, setAvatar, preview, initial }: { onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; avatar: File | null; setAvatar: (file: File | null) => void; preview: string | null; initial?: { stageName: string; bio: string; avatar: string } }) {
  return <form className="mt-7" onSubmit={onSubmit}><FieldGroup>
    <Field><FieldLabel htmlFor="stageName">Псевдоним</FieldLabel><Input id="stageName" name="stageName" defaultValue={initial?.stageName} required maxLength={80} /></Field>
    <Field><FieldLabel htmlFor="bio">О себе</FieldLabel><Textarea id="bio" name="bio" defaultValue={initial?.bio} required minLength={20} maxLength={500} /></Field>
    <Field><FieldLabel htmlFor="creator-avatar">Аватар автора</FieldLabel><div className="flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center overflow-hidden border border-bnr-line bg-bnr-abyss font-cinzel text-bnr-lilac">{preview ? <Image src={preview} alt="Предпросмотр аватара" width={64} height={64} unoptimized className="size-full object-cover" /> : <ImagePlus />}</div><Input id="creator-avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" required={!initial} onChange={(event) => setAvatar(event.target.files?.[0] ?? null)} /></div><FieldError>{!avatar && !initial ? "Выберите JPEG, PNG или WebP до 2 MiB." : null}</FieldError></Field>
    <Button type="submit" variant="brand" size="auth"><Send data-icon="inline-start" />Отправить заявку</Button>
  </FieldGroup></form>;
}

function StatusPanel({ title, text, icon, children }: { title: string; text: string; icon: React.ReactNode; children?: React.ReactNode }) { return <div className="flex flex-col justify-center p-7 md:p-10"><div className="grid size-12 place-items-center border border-bnr-lilac/50 text-bnr-lilac">{icon}</div><h2 className="mt-5 font-cinzel text-3xl font-semibold text-bnr-bone">{title}</h2><p className="mt-3 max-w-md text-sm leading-6 text-bnr-ash">{text}</p>{children}</div>; }

function ApprovedStudio({ studio, onChanged, onProfileDeleted }: { studio: Extract<Studio, { state: "approved" }>; onChanged: () => void | Promise<void>; onProfileDeleted: (authorId: number) => void | Promise<void> }) {
  const [tracks, setTracks] = useState<Item[]>([]); const [albums, setAlbums] = useState<Item[]>([]);
  const refreshCatalog = () => void Promise.all([$api.get<{ items: Item[] }>("/creator/tracks"), $api.get<{ items: Item[] }>("/creator/albums")]).then(([trackData, albumData]) => { setTracks(trackData.data.items); setAlbums(albumData.data.items); });
  useEffect(() => { refreshCatalog(); }, [studio.counts.tracks, studio.counts.albums]);
  return <><HeraldicPanel watermark className="p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><div className="grid size-20 shrink-0 place-items-center overflow-hidden border border-bnr-lilac/50 bg-bnr-abyss font-cinzel text-3xl text-bnr-lilac">{studio.author.avatar ? <Image src={fileUrl(studio.author.avatar)!} alt="" width={80} height={80} className="size-full object-cover" /> : studio.author.name[0]}</div><div className="min-w-0"><Badge variant="outline" className="border-bnr-lilac/50 px-2 py-1 text-[10px] text-bnr-lilac"><ShieldCheck className="mr-1 size-3" />ОДОБРЕНО</Badge><h1 id="creator-studio-title" className="mt-2 truncate font-cinzel text-3xl font-semibold text-bnr-bone">{studio.author.name}</h1><p className="mt-1 text-sm text-bnr-ash">{studio.counts.tracks} треков · {studio.counts.albums} альбомов</p></div></div><div className="flex flex-col items-start gap-3 sm:items-end"><span className="font-cinzel text-[10px] tracking-[.18em] text-bnr-ash">АРХИВ АВТОРА</span><EditAuthorProfileDialog author={studio.author} onUpdated={onChanged} /></div></div></HeraldicPanel>
    <Tabs defaultValue="tracks" className="mt-8"><TabsList className="bg-bnr-surface"><TabsTrigger value="tracks">Треки</TabsTrigger><TabsTrigger value="albums">Альбомы</TabsTrigger></TabsList><TabsContent value="tracks"><StudioList kind="track" title="Ваши треки" items={tracks} albums={albums} tracks={tracks} primaryAuthorId={studio.author.id} onChanged={() => { refreshCatalog(); void onChanged(); }} onDeleted={(ids) => setTracks((current) => current.filter((item) => !ids.includes(item.id)))} icon={<FileAudio />} action={<BulkTrackDialog albums={albums} primaryAuthorId={studio.author.id} onCreated={() => { refreshCatalog(); void onChanged(); }} />} /></TabsContent><TabsContent value="albums"><StudioList kind="album" title="Ваши альбомы" items={albums} albums={albums} tracks={tracks} primaryAuthorId={studio.author.id} onChanged={() => { refreshCatalog(); void onChanged(); }} onDeleted={(ids) => setAlbums((current) => current.filter((item) => !ids.includes(item.id)))} icon={<Disc3 />} action={<div className="flex flex-wrap gap-2"><AlbumDialog primaryAuthorId={studio.author.id} onCreated={() => { refreshCatalog(); void onChanged(); }} /><AlbumAssignmentDialog tracks={tracks} albums={albums} onChanged={refreshCatalog} /></div>} /></TabsContent></Tabs>
    <HeraldicPanel className="mt-10 border-destructive/45 p-6"><p className="font-cinzel text-[10px] tracking-[.18em] text-destructive">ОПАСНАЯ ЗОНА</p><h2 className="mt-2 font-cinzel text-xl text-bnr-bone">Удаление авторского аккаунта</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-bnr-ash">Действие удалит профиль автора и весь опубликованный архив. Пользовательский аккаунт останется доступен.</p><div className="mt-5"><DeleteAuthorProfileDialog author={studio.author} onDeleted={onProfileDeleted} /></div></HeraldicPanel>
  </>;
}

function StudioList({ kind, title, items, albums, tracks, action, icon, primaryAuthorId, onChanged, onDeleted }: { kind: "track" | "album"; title: string; items: Item[]; albums: Item[]; tracks: Item[]; action: React.ReactNode; icon: React.ReactNode; primaryAuthorId: number; onChanged: () => void; onDeleted: (ids: number[]) => void }) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const removePlaybackTracks = usePlaybackStore((state) => state.removeTracks);

  const remove = async (ids: number[]) => {
    setBusy(true);
    setError("");
    try {
      if (ids.length === 1) await $api.delete(`/creator/${kind === "track" ? "tracks" : "albums"}/${ids[0]}`);
      else await $api.post(`/creator/${kind === "track" ? "tracks" : "albums"}/bulk-delete`, { ids });
      if (kind === "track") removePlaybackTracks(ids);
      onDeleted(ids);
      setSelected([]);
      setSelectionMode(false);
      onChanged();
      return true;
    } catch (cause) {
      if (isAxiosError(cause) && cause.response?.status === 404) setError("Один из выбранных релизов больше недоступен или принадлежит другому автору.");
      else if (isAxiosError(cause) && cause.response?.status === 409) setError("Состав архива изменился. Обновите список и повторите попытку.");
      else setError("Удаление не выполнено. Данные и выбранные карточки сохранены.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  return <section className="mt-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><SectionHeading>{title}</SectionHeading><div className="flex flex-wrap gap-2">{items.length ? <Button type="button" variant="outline" onClick={() => { setSelectionMode((current) => !current); setSelected([]); }}>{selectionMode ? "Отменить выбор" : "Выбрать"}</Button> : null}{action}</div></div>
    {error ? <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
    {items.length ? <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{items.map((item) => <article key={item.id} className="relative min-w-0 border border-bnr-line bg-bnr-surface p-4">
      {selectionMode ? <label className="absolute right-3 top-3 grid size-8 cursor-pointer place-items-center border border-bnr-lilac/50 bg-bnr-abyss text-bnr-lilac focus-within:ring-2 focus-within:ring-bnr-lilac"><input type="checkbox" className="size-4 accent-bnr-violet" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} aria-label={`Выбрать ${kind === "track" ? "трек" : "альбом"} ${item.name}`} /></label> : null}
      <div className="flex items-center gap-2 text-bnr-lilac">{icon}<span className="font-cinzel text-[10px] tracking-[.14em]">ОПУБЛИКОВАНО</span></div><h3 className="mt-7 truncate text-sm font-semibold text-bnr-bone">{item.name}</h3><div className="mt-4 flex flex-wrap gap-2"><EditReleaseDialog kind={kind} item={item} albums={albums} primaryAuthorId={primaryAuthorId} onChanged={onChanged} />{kind === "album" ? <CompositionDialog album={item} tracks={tracks} onChanged={onChanged} /> : null}<DeleteReleaseDialog kind={kind} names={[item.name]} busy={busy} onConfirm={() => remove([item.id])} /></div>
    </article>)}</div> : <Empty className="mt-5 border border-bnr-line"><EmptyHeader><EmptyTitle>{title} пока пусты</EmptyTitle><EmptyDescription>Создайте первую запись в архиве.</EmptyDescription></EmptyHeader></Empty>}
    {selectionMode && items.length ? <div className="sticky bottom-4 z-20 mt-5 flex flex-wrap items-center gap-2 border border-bnr-lilac/40 bg-bnr-gunmetal/95 p-3 shadow-xl backdrop-blur"><span className="mr-auto text-sm text-bnr-bone">Выбрано: {selected.length}</span><Button type="button" size="sm" variant="outline" onClick={() => setSelected(items.map((item) => item.id))}>Выбрать все загруженные</Button><Button type="button" size="sm" variant="ghost" disabled={!selected.length} onClick={() => setSelected([])}>Снять выбор</Button><DeleteReleaseDialog kind={kind} names={items.filter((item) => selected.includes(item.id)).map((item) => item.name)} busy={busy} disabled={!selected.length} onConfirm={() => remove(selected)} bulk /></div> : null}
  </section>;
}

function DeleteReleaseDialog({ kind, names, busy, disabled, bulk, onConfirm }: { kind: "track" | "album"; names: string[]; busy: boolean; disabled?: boolean; bulk?: boolean; onConfirm: () => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const noun = kind === "track" ? (names.length === 1 ? "трек" : "треки") : (names.length === 1 ? "альбом" : "альбомы");
  return <AlertDialog open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm" disabled={disabled || busy}><Trash2 />{bulk ? `Удалить (${names.length})` : "Удалить"}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Удалить {noun} безвозвратно?</AlertDialogTitle><AlertDialogDescription>{kind === "track" ? "Будут удалены аудиофайлы, обложки, связи с альбомами и плейлистами, любимое и вся статистика запусков." : "Обложка и связи альбома будут удалены. Входящие треки сохранятся как синглы либо останутся в других альбомах."}</AlertDialogDescription></AlertDialogHeader>{names.length ? <p className="line-clamp-3 text-sm text-bnr-bone">{names.join(", ")}</p> : null}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Отмена</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void onConfirm().then((success) => { if (success) setOpen(false); }); }}>{busy ? <Loader2 className="animate-spin" /> : <Trash2 />}Удалить навсегда</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function EditReleaseDialog({ kind, item, albums, primaryAuthorId, onChanged }: { kind: "track" | "album"; item: Item; albums: Item[]; primaryAuthorId: number; onChanged: () => void }) {
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [detail, setDetail] = useState<Item | null>(null); const [featured, setFeatured] = useState<Author[]>([]); const [genres, setGenres] = useState<Genre[]>([]); const [albumIds, setAlbumIds] = useState<number[]>([]);
  useEffect(() => { if (!open) return; setLoading(true); setError(""); void $api.get<Item>(`/creator/${kind === "track" ? "tracks" : "albums"}/${item.id}`).then(({ data }) => { setDetail(data); setFeatured(data.featuredAuthors ?? []); setGenres(data.genres ?? []); setAlbumIds((data.albums ?? []).map((album) => album.id)); }).catch(() => setError("Не удалось загрузить данные релиза.")).finally(() => setLoading(false)); }, [item.id, kind, open]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (kind === "track" && !genres.length) return; setBusy(true); setError(""); const form = new FormData(event.currentTarget); form.set("featuredAuthorIds", JSON.stringify(featured.map((author) => author.id))); if (kind === "track") { form.set("genreIds", JSON.stringify(genres.map((genre) => genre.id))); form.set("albumIds", JSON.stringify(albumIds)); } try { await $api.patch(`/creator/${kind === "track" ? "tracks" : "albums"}/${item.id}`, form); setOpen(false); onChanged(); } catch (cause) { setError(creatorErrorMessage(cause)); } finally { setBusy(false); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Pencil data-icon="inline-start" />Редактировать</Button></DialogTrigger><DialogContent className="bnr-scrollbar max-h-[90dvh] overflow-y-auto border-bnr-line bg-bnr-surface"><DialogHeader><DialogTitle>Редактировать {kind === "track" ? "трек" : "альбом"}</DialogTitle><DialogDescription>Изменения применяются только к вашему релизу.</DialogDescription></DialogHeader>{error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}{loading || !detail ? <Loader2 className="mx-auto my-10 animate-spin text-bnr-lilac" /> : <form onSubmit={submit}><FieldGroup><Field><FieldLabel htmlFor={`edit-${kind}-${item.id}-name`}>Название</FieldLabel><Input id={`edit-${kind}-${item.id}-name`} name="name" defaultValue={detail.name} required maxLength={255} /></Field>{kind === "track" ? <><Field><FieldLabel htmlFor={`edit-track-${item.id}-text`}>Описание</FieldLabel><Textarea id={`edit-track-${item.id}-text`} name="text" defaultValue={detail.text ?? ""} /></Field><GenrePicker value={genres} onChange={setGenres} /><Field><FieldLabel>Альбомы</FieldLabel><div className="grid gap-2">{albums.map((album) => { const selected = albumIds.includes(album.id); return <Button key={album.id} type="button" variant={selected ? "brand" : "outline"} size="sm" aria-pressed={selected} onClick={() => setAlbumIds((current) => selected ? current.filter((id) => id !== album.id) : [...current, album.id])}>{album.name}</Button>; })}</div></Field></> : null}<FeaturedAuthors value={featured} onChange={setFeatured} primaryAuthorId={primaryAuthorId} /><Field><FieldLabel htmlFor={`edit-${kind}-${item.id}-picture`}>Новая обложка (необязательно)</FieldLabel><Input id={`edit-${kind}-${item.id}-picture`} name="picture" type="file" accept="image/jpeg,image/png,image/webp" /></Field>{kind === "track" ? <Field><FieldLabel htmlFor={`edit-track-${item.id}-audio`}>Новый аудиофайл (необязательно)</FieldLabel><Input id={`edit-track-${item.id}-audio`} name="audio" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg" /></Field> : null}<Button type="submit" variant="brand" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Check />}Сохранить</Button></FieldGroup></form>}</DialogContent></Dialog>;
}

function CompositionDialog({ album, tracks, onChanged }: { album: Item; tracks: Item[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false); const [ordered, setOrdered] = useState<Item[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (!open) return; void $api.get<Item>(`/creator/albums/${album.id}`).then(({ data }) => setOrdered(data.tracks ?? [])).catch(() => setError("Не удалось загрузить состав альбома.")); }, [album.id, open]);
  const move = (index: number, delta: number) => setOrdered((current) => { const next = [...current]; const target = index + delta; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const addable = tracks.filter((track) => !ordered.some((item) => item.id === track.id));
  const save = async () => { setBusy(true); setError(""); try { await $api.put(`/creator/albums/${album.id}/composition`, { trackIds: ordered.map((track) => track.id) }); setOpen(false); onChanged(); } catch { setError("Не удалось сохранить порядок треков."); } finally { setBusy(false); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Disc3 data-icon="inline-start" />Состав</Button></DialogTrigger><DialogContent className="bnr-scrollbar max-h-[90dvh] overflow-y-auto border-bnr-line bg-bnr-surface"><DialogHeader><DialogTitle>Состав альбома «{album.name}»</DialogTitle><DialogDescription>Добавляйте собственные треки и задавайте порядок воспроизведения.</DialogDescription></DialogHeader>{error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}<div className="grid gap-2">{ordered.map((track, index) => <div key={track.id} className="flex items-center gap-2 border border-bnr-line p-2"><span className="min-w-0 flex-1 truncate text-sm">{index + 1}. {track.name}</span><Button type="button" size="icon" variant="ghost" aria-label="Выше" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp /></Button><Button type="button" size="icon" variant="ghost" aria-label="Ниже" disabled={index === ordered.length - 1} onClick={() => move(index, 1)}><ArrowDown /></Button><Button type="button" size="icon" variant="ghost" aria-label="Убрать" onClick={() => setOrdered((current) => current.filter((item) => item.id !== track.id))}><Trash2 /></Button></div>)}</div>{addable.length ? <Field><FieldLabel>Добавить трек</FieldLabel><div className="grid gap-2">{addable.map((track) => <Button key={track.id} type="button" variant="outline" size="sm" onClick={() => setOrdered((current) => [...current, track])}><Plus />{track.name}</Button>)}</div></Field> : null}<Button type="button" variant="brand" disabled={busy} onClick={() => void save()}>{busy ? <Loader2 className="animate-spin" /> : <Check />}Сохранить состав</Button></DialogContent></Dialog>;
}

function AlbumDialog({ primaryAuthorId, onCreated }: { primaryAuthorId: number; onCreated: () => void }) { return <CreationDialog kind="album" primaryAuthorId={primaryAuthorId} onCreated={onCreated} />; }
function CreationDialog({ kind, albums = [], primaryAuthorId, onCreated }: { kind: "track" | "album"; albums?: Item[]; primaryAuthorId: number; onCreated: () => void }) {
  const [open, setOpen] = useState(false); const [featured, setFeatured] = useState<Author[]>([]); const [genres, setGenres] = useState<Genre[]>([]); const [albumId, setAlbumId] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const title = kind === "track" ? "Создать трек" : "Создать альбом";
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (kind === "track" && !genres.length) return; setBusy(true); setError(""); const form = new FormData(event.currentTarget); form.set("featuredAuthorIds", JSON.stringify(featured.map((author) => author.id))); if (kind === "track") { form.set("genreIds", JSON.stringify(genres.map((genre) => genre.id))); if (albumId) form.set("albumId", albumId); } try { await $api.post(`/creator/${kind === "track" ? "tracks" : "albums"}`, form); setOpen(false); setFeatured([]); setGenres([]); setAlbumId(""); onCreated(); } catch (requestError) { setError(creatorErrorMessage(requestError)); } finally { setBusy(false); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" variant="brand"><Plus data-icon="inline-start" />{title}</Button></DialogTrigger><DialogContent className="bnr-scrollbar max-h-[90dvh] overflow-y-auto border-bnr-line bg-bnr-surface"><DialogHeader><DialogTitle className="font-cinzel text-bnr-bone">{title}</DialogTitle><DialogDescription>Основной автор определяется вашей одобренной студией.</DialogDescription></DialogHeader>{error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}<form onSubmit={submit}><FieldGroup><Field><FieldLabel htmlFor={`${kind}-name`}>Название</FieldLabel><Input id={`${kind}-name`} name="name" required disabled={busy} /></Field>{kind === "track" ? <><Field><FieldLabel htmlFor="text">Текст или описание</FieldLabel><Textarea id="text" name="text" disabled={busy} /></Field><GenrePicker value={genres} onChange={setGenres} /><Field><FieldLabel htmlFor="albumId">Альбом</FieldLabel><Select value={albumId} onValueChange={setAlbumId} disabled={busy}><SelectTrigger id="albumId"><SelectValue placeholder="Сингл — без альбома" /></SelectTrigger><SelectContent><SelectGroup>{albums.map((album) => <SelectItem key={album.id} value={String(album.id)}>{album.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field></> : null}<FeaturedAuthors value={featured} onChange={setFeatured} primaryAuthorId={primaryAuthorId} /><Field><FieldLabel htmlFor={`${kind}-picture`}>{kind === "track" ? "Обложка" : "Обложка альбома"}</FieldLabel><Input id={`${kind}-picture`} name="picture" type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} /></Field>{kind === "track" ? <Field><FieldLabel htmlFor="audio">Аудиофайл</FieldLabel><Input id="audio" name="audio" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg" required disabled={busy} /></Field> : null}<Button type="submit" variant="brand" disabled={busy}>{busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}Опубликовать</Button></FieldGroup></form></DialogContent></Dialog>;
}

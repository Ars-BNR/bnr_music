"use client";

import { isAxiosError } from "axios";
import {
  Check,
  ChevronDown,
  FileAudio,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import $api from "@/entities/http-service";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Textarea } from "@/shared/ui/textarea";

interface Option {
  id: number;
  name: string;
}

interface StudioItem extends Option {
  picture?: string;
}

type DraftStatus = "queued" | "uploading" | "success" | "error";

interface TrackDraft {
  key: string;
  requestId: string;
  name: string;
  text: string;
  audio: File | null;
  picture: File | null;
  genreIds: number[];
  featuredAuthorIds: number[];
  albumIds: number[];
  status: DraftStatus;
  error: string;
  trackId?: number;
}

const createKey = () => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createDraft = (): TrackDraft => ({
  key: createKey(),
  requestId: createKey(),
  name: "",
  text: "",
  audio: null,
  picture: null,
  genreIds: [],
  featuredAuthorIds: [],
  albumIds: [],
  status: "queued",
  error: "",
});

const requestError = (error: unknown) => {
  if (!isAxiosError(error)) return "Не удалось опубликовать трек.";
  const message = error.response?.data && typeof error.response.data === "object" && "message" in error.response.data
    ? error.response.data.message
    : null;
  return Array.isArray(message) ? message.join(". ") : typeof message === "string" ? message : "Не удалось опубликовать трек.";
};

function MultiPicker({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  required,
}: {
  label: string;
  options: Option[];
  value: number[];
  onChange: (value: number[]) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerId = useId();
  const selected = options.filter((option) => value.includes(option.id));

  return (
    <Field data-invalid={required && value.length === 0}>
      <FieldLabel htmlFor={triggerId}>{label}</FieldLabel>
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            type="button"
            variant="brandLink"
            className="w-full justify-between"
            disabled={disabled}
            aria-label={label}
            aria-expanded={open}
            aria-invalid={required && value.length === 0}
          >
            <span className="truncate">{selected.length ? `Выбрано: ${selected.length}` : placeholder}</span>
            <ChevronDown data-icon="inline-end" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] border-bnr-line bg-bnr-surface p-0">
          <Command>
            <CommandInput placeholder={`Найти: ${label.toLocaleLowerCase()}`} />
            <CommandList className="bnr-scrollbar bnr-scrollbar-compact">
              <CommandEmpty>Ничего не найдено.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const checked = value.includes(option.id);
                  return (
                    <CommandItem
                      key={option.id}
                      value={`${option.name} ${option.id}`}
                      onSelect={() => onChange(checked ? value.filter((id) => id !== option.id) : [...value, option.id])}
                    >
                      <Check aria-hidden="true" className={checked ? "opacity-100" : "opacity-0"} />
                      {option.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((option) => (
            <Badge key={option.id} variant="outline" className="gap-1 border-bnr-lilac/45 text-bnr-bone">
              {option.name}
              <button type="button" aria-label={`Убрать ${option.name}`} onClick={() => onChange(value.filter((id) => id !== option.id))}>
                <X aria-hidden="true" className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      {required && value.length === 0 ? <FieldError>Выберите хотя бы один вариант.</FieldError> : null}
    </Field>
  );
}

const statusLabel: Record<DraftStatus, string> = {
  queued: "Готов",
  uploading: "Загрузка",
  success: "Опубликован",
  error: "Ошибка",
};

export function BulkTrackDialog({
  albums,
  primaryAuthorId,
  onCreated,
}: {
  albums: StudioItem[];
  primaryAuthorId: number;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<TrackDraft[]>([createDraft()]);
  const [genres, setGenres] = useState<Option[]>([]);
  const [authors, setAuthors] = useState<Option[]>([]);
  const [sharedCover, setSharedCover] = useState<File | null>(null);
  const [createAlbum, setCreateAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumCover, setNewAlbumCover] = useState<File | null>(null);
  const [newAlbumFeaturedIds, setNewAlbumFeaturedIds] = useState<number[]>([]);
  const [createdAlbumId, setCreatedAlbumId] = useState<number | null>(null);
  const [newAlbumRequestId, setNewAlbumRequestId] = useState(createKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setError("");
    void Promise.all([
      $api.get<Option[]>("/genres", { params: { count: 100, offset: 0 }, signal: controller.signal }),
      $api.get<Option[]>("/authors", { params: { count: 100, offset: 0 }, signal: controller.signal }),
    ]).then(([genreResponse, authorResponse]) => {
      setGenres(genreResponse.data);
      setAuthors(authorResponse.data.filter((author) => author.id !== primaryAuthorId));
    }).catch(() => {
      if (!controller.signal.aborted) setError("Не удалось загрузить жанры и feat-авторов.");
    });
    return () => controller.abort();
  }, [open, primaryAuthorId]);

  const updateDraft = (key: string, patch: Partial<TrackDraft>) => {
    setDrafts((current) => current.map((draft) => draft.key === key ? { ...draft, ...patch, status: patch.status ?? "queued", error: patch.error ?? "" } : draft));
  };

  const targetDrafts = (retryOnly: boolean) => drafts.filter((draft) => retryOnly ? draft.status === "error" : draft.status !== "success");

  const validate = (targets: TrackDraft[]) => {
    for (const draft of targets) {
      if (!draft.name.trim()) return `Укажите название для трека ${drafts.indexOf(draft) + 1}.`;
      if (!draft.audio) return `Выберите аудиофайл для трека ${draft.name || drafts.indexOf(draft) + 1}.`;
      if (!draft.picture && !sharedCover && !(createAlbum && newAlbumCover)) return `Выберите обложку для трека ${draft.name}.`;
      if (!draft.genreIds.length) return `Выберите жанр для трека ${draft.name}.`;
    }
    if (createAlbum && !createdAlbumId && (!newAlbumName.trim() || !newAlbumCover)) return "Для нового альбома нужны название и обложка.";
    return "";
  };

  const ensureAlbum = async () => {
    if (!createAlbum) return null;
    if (createdAlbumId) return createdAlbumId;
    const form = new FormData();
    form.set("name", newAlbumName.trim());
    form.set("picture", newAlbumCover!);
    form.set("featuredAuthorIds", JSON.stringify(newAlbumFeaturedIds));
    const { data } = await $api.post<{ id: number }>("/creator/albums", form, {
      headers: { "Idempotency-Key": newAlbumRequestId },
    });
    setCreatedAlbumId(data.id);
    return data.id;
  };

  const publish = async (retryOnly = false) => {
    const targets = targetDrafts(retryOnly);
    if (!targets.length || busy) return;
    const validationError = validate(targets);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const newAlbumId = await ensureAlbum();
      let cursor = 0;
      const uploaded: Array<{ trackId: number; albumIds: number[] }> = [];
      const worker = async () => {
        while (cursor < targets.length) {
          const draft = targets[cursor++];
          updateDraft(draft.key, { status: "uploading" });
          const albumIds = Array.from(new Set([...draft.albumIds, ...(newAlbumId ? [newAlbumId] : [])]));
          const form = new FormData();
          form.set("name", draft.name.trim());
          form.set("text", draft.text.trim());
          form.set("audio", draft.audio!);
          form.set("picture", draft.picture ?? sharedCover ?? newAlbumCover!);
          form.set("genreIds", JSON.stringify(draft.genreIds));
          form.set("featuredAuthorIds", JSON.stringify(draft.featuredAuthorIds));
          form.set("albumIds", JSON.stringify(albumIds));
          try {
            const { data } = await $api.post<{ id: number }>("/creator/tracks", form, {
              headers: { "Idempotency-Key": draft.requestId },
            });
            uploaded.push({ trackId: data.id, albumIds });
            updateDraft(draft.key, { status: "success", trackId: data.id });
          } catch (uploadError) {
            updateDraft(draft.key, { status: "error", error: requestError(uploadError) });
          }
        }
      };
      await Promise.all([worker(), worker()]);

      const assignments = new Map<number, number[]>();
      uploaded.forEach(({ trackId, albumIds }) => {
        albumIds.forEach((albumId) => assignments.set(albumId, [...(assignments.get(albumId) ?? []), trackId]));
      });
      const assignmentResults = await Promise.allSettled(Array.from(assignments, ([albumId, trackIds]) =>
        $api.put(`/creator/albums/${albumId}/tracks`, { trackIds })
      ));
      if (assignmentResults.some((result) => result.status === "rejected")) {
        setError("Треки опубликованы, но часть связей с альбомами не сохранилась. Повторите назначение во вкладке «Альбомы».");
      }
      onCreated();
    } catch (publishError) {
      setError(requestError(publishError));
    } finally {
      setBusy(false);
    }
  };

  const failedCount = drafts.filter((draft) => draft.status === "error").length;
  const successfulCount = drafts.filter((draft) => draft.status === "success").length;

  const handleOpenChange = (nextOpen: boolean) => {
    if (busy) return;
    setOpen(nextOpen);
    if (!nextOpen && drafts.every((draft) => draft.status === "success")) {
      setDrafts([createDraft()]);
      setSharedCover(null);
      setCreateAlbum(false);
      setNewAlbumName("");
      setNewAlbumCover(null);
      setNewAlbumFeaturedIds([]);
      setCreatedAlbumId(null);
      setNewAlbumRequestId(createKey());
      setError("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="brand">
          <UploadCloud data-icon="inline-start" />Загрузить треки
        </Button>
      </DialogTrigger>
      <DialogContent className="bnr-scrollbar max-h-[92dvh] max-w-4xl overflow-y-auto border-bnr-line bg-bnr-surface">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-bnr-bone">Массовая публикация треков</DialogTitle>
          <DialogDescription>Подготовьте от 1 до 10 треков. Одновременно загружаются не более двух файлов.</DialogDescription>
        </DialogHeader>

        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bulk-shared-cover">Общая обложка</FieldLabel>
            <Input id="bulk-shared-cover" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => setSharedCover(event.target.files?.[0] ?? null)} />
            <p className="text-xs text-bnr-ash">Отдельная обложка трека имеет приоритет над общей.</p>
          </Field>

          <Field>
            <FieldLabel>Новый альбом</FieldLabel>
            <Button type="button" variant="brandLink" aria-pressed={createAlbum} disabled={busy || Boolean(createdAlbumId)} onClick={() => setCreateAlbum((value) => !value)}>
              {createAlbum ? <Check data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
              {createdAlbumId ? "Альбом создан" : createAlbum ? "Создать вместе с треками" : "Не создавать"}
            </Button>
          </Field>
          {createAlbum ? (
            <div className="grid gap-4 border border-bnr-line bg-bnr-abyss/45 p-4 sm:grid-cols-2">
              <Field><FieldLabel htmlFor="bulk-album-name">Название альбома</FieldLabel><Input id="bulk-album-name" value={newAlbumName} disabled={busy || Boolean(createdAlbumId)} onChange={(event) => setNewAlbumName(event.target.value)} /></Field>
              <Field><FieldLabel htmlFor="bulk-album-cover">Обложка альбома</FieldLabel><Input id="bulk-album-cover" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || Boolean(createdAlbumId)} onChange={(event) => setNewAlbumCover(event.target.files?.[0] ?? null)} /></Field>
              <div className="sm:col-span-2"><MultiPicker label="Feat-авторы альбома" options={authors} value={newAlbumFeaturedIds} onChange={setNewAlbumFeaturedIds} disabled={busy || Boolean(createdAlbumId)} placeholder="Выбрать авторов" /></div>
            </div>
          ) : null}
        </FieldGroup>

        <div className="flex flex-col gap-4">
          {drafts.map((draft, index) => (
            <article key={draft.key} className="border border-bnr-line bg-bnr-abyss/55 p-4" data-testid={`bulk-track-draft-${index + 1}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileAudio aria-hidden="true" className="text-bnr-lilac" />
                  <h3 className="font-cinzel text-sm text-bnr-bone">Трек {index + 1}</h3>
                  <Badge variant="outline" className="border-bnr-line text-bnr-ash">{statusLabel[draft.status]}</Badge>
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={`Удалить трек ${index + 1}`} disabled={busy || drafts.length === 1 || draft.status === "success"} onClick={() => setDrafts((current) => current.filter((item) => item.key !== draft.key))}>
                  <Trash2 data-icon="inline-start" />
                </Button>
              </div>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field><FieldLabel htmlFor={`bulk-name-${draft.key}`}>Название</FieldLabel><Input id={`bulk-name-${draft.key}`} value={draft.name} disabled={busy || draft.status === "success"} onChange={(event) => updateDraft(draft.key, { name: event.target.value })} /></Field>
                  <Field><FieldLabel htmlFor={`bulk-audio-${draft.key}`}>Аудиофайл</FieldLabel><Input id={`bulk-audio-${draft.key}`} type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg" disabled={busy || draft.status === "success"} onChange={(event) => updateDraft(draft.key, { audio: event.target.files?.[0] ?? null })} /></Field>
                  <Field><FieldLabel htmlFor={`bulk-picture-${draft.key}`}>Своя обложка</FieldLabel><Input id={`bulk-picture-${draft.key}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || draft.status === "success"} onChange={(event) => updateDraft(draft.key, { picture: event.target.files?.[0] ?? null })} /></Field>
                  <Field><FieldLabel htmlFor={`bulk-text-${draft.key}`}>Описание</FieldLabel><Textarea id={`bulk-text-${draft.key}`} value={draft.text} disabled={busy || draft.status === "success"} onChange={(event) => updateDraft(draft.key, { text: event.target.value })} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <MultiPicker label="Жанры" options={genres} value={draft.genreIds} onChange={(genreIds) => updateDraft(draft.key, { genreIds })} disabled={busy || draft.status === "success"} required placeholder="Выберите жанры" />
                  <MultiPicker label="Feat-авторы" options={authors} value={draft.featuredAuthorIds} onChange={(featuredAuthorIds) => updateDraft(draft.key, { featuredAuthorIds })} disabled={busy || draft.status === "success"} placeholder="Выберите авторов" />
                  <MultiPicker label="Альбомы" options={albums} value={draft.albumIds} onChange={(albumIds) => updateDraft(draft.key, { albumIds })} disabled={busy || draft.status === "success"} placeholder="Сингл" />
                </div>
              </FieldGroup>
              {draft.error ? <p role="alert" className="mt-3 text-sm text-destructive">{draft.error}</p> : null}
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="brandLink" disabled={busy || drafts.length >= 10} onClick={() => setDrafts((current) => [...current, createDraft()])}>
            <Plus data-icon="inline-start" />Добавить трек ({drafts.length}/10)
          </Button>
          <div className="flex flex-wrap gap-2">
            {failedCount ? (
              <Button type="button" variant="brandLink" disabled={busy} onClick={() => void publish(true)}>
                <RotateCcw data-icon="inline-start" />Повторить ошибки ({failedCount})
              </Button>
            ) : null}
            <Button type="button" variant="brand" disabled={busy || successfulCount === drafts.length} onClick={() => void publish(false)}>
              {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <UploadCloud data-icon="inline-start" />}
              {busy ? "Публикуем…" : "Опубликовать очередь"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AlbumAssignmentDialog({ tracks, albums, onChanged }: { tracks: StudioItem[]; albums: StudioItem[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [trackIds, setTrackIds] = useState<number[]>([]);
  const [albumIds, setAlbumIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = trackIds.length > 0 && albumIds.length > 0;
  const summary = useMemo(() => `${trackIds.length} треков · ${albumIds.length} альбомов`, [albumIds.length, trackIds.length]);

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError("");
    try {
      await Promise.all(albumIds.map((albumId) => $api.put(`/creator/albums/${albumId}/tracks`, { trackIds })));
      setOpen(false);
      setTrackIds([]);
      setAlbumIds([]);
      onChanged();
    } catch (submitError) {
      setError(requestError(submitError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !busy && setOpen(nextOpen)}>
      <DialogTrigger asChild><Button type="button" variant="brandLink"><Plus data-icon="inline-start" />Добавить треки в альбомы</Button></DialogTrigger>
      <DialogContent className="border-bnr-line bg-bnr-surface">
        <DialogHeader><DialogTitle className="font-cinzel text-bnr-bone">Добавить треки в альбомы</DialogTitle><DialogDescription>Выберите несколько своих треков и один или несколько целевых альбомов.</DialogDescription></DialogHeader>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <FieldGroup>
          <MultiPicker label="Треки" options={tracks} value={trackIds} onChange={setTrackIds} disabled={busy} required placeholder="Выберите треки" />
          <MultiPicker label="Альбомы" options={albums} value={albumIds} onChange={setAlbumIds} disabled={busy} required placeholder="Выберите альбомы" />
          <Button type="button" variant="brand" disabled={!canSubmit || busy} onClick={() => void submit()}>{busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" />}{busy ? "Добавляем…" : summary}</Button>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";
import $api from "@/entities/http-service";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

export type CreatorAuthorProfile = {
  id: number;
  name: string;
  bio: string;
  avatar: string | null;
};

const fileUrl = (path?: string | null) =>
  path ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8340"}/${path}` : null;

const profileError = (cause: unknown) => {
  if (!isAxiosError(cause)) return "Не удалось выполнить действие.";
  if (cause.response?.status === 401) return "Текущий пароль указан неверно.";
  if (cause.response?.status === 400) return "Проверьте псевдоним и заполненные поля.";
  if (cause.response?.status === 404) return "Авторский профиль больше не существует.";
  if (cause.response?.status === 409) return "Архив изменился. Обновите страницу и повторите попытку.";
  return "Сервер недоступен. Данные не были изменены.";
};

export function EditAuthorProfileDialog({ author, onUpdated }: { author: CreatorAuthorProfile; onUpdated: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!avatar) return setPreview(null);
    const url = URL.createObjectURL(avatar);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    if (avatar) form.set("avatar", avatar);
    try {
      await $api.patch("/creator/me", form);
      await onUpdated();
      setAvatar(null);
      setOpen(false);
    } catch (cause) {
      setError(profileError(cause));
    } finally {
      setBusy(false);
    }
  };

  return <Dialog open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}>
    <DialogTrigger asChild><Button type="button" variant="outline"><Pencil data-icon="inline-start" />Редактировать профиль</Button></DialogTrigger>
    <DialogContent className="bnr-scrollbar max-h-[90dvh] overflow-y-auto border-bnr-line bg-bnr-surface">
      <DialogHeader><DialogTitle>Редактировать профиль автора</DialogTitle><DialogDescription>Изменения сразу появятся в публичном каталоге.</DialogDescription></DialogHeader>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <form onSubmit={submit}><FieldGroup>
        <Field><FieldLabel htmlFor="creator-profile-name">Псевдоним</FieldLabel><Input id="creator-profile-name" name="stageName" defaultValue={author.name} minLength={2} maxLength={80} required disabled={busy} /></Field>
        <Field><FieldLabel htmlFor="creator-profile-bio">Bio</FieldLabel><Textarea id="creator-profile-bio" name="bio" defaultValue={author.bio} minLength={20} maxLength={500} required disabled={busy} /></Field>
        <Field><FieldLabel htmlFor="creator-profile-avatar">Новый аватар</FieldLabel><div className="flex items-center gap-4"><div className="grid size-20 shrink-0 place-items-center overflow-hidden border border-bnr-line bg-bnr-abyss text-bnr-lilac">{preview || author.avatar ? <Image src={preview ?? fileUrl(author.avatar)!} alt="Предпросмотр аватара автора" width={80} height={80} unoptimized={Boolean(preview)} className="size-full object-cover" /> : <ImagePlus />}</div><Input id="creator-profile-avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => setAvatar(event.target.files?.[0] ?? null)} /></div></Field>
        <Button type="submit" variant="brand" disabled={busy}>{busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Pencil data-icon="inline-start" />}Сохранить профиль</Button>
      </FieldGroup></form>
    </DialogContent>
  </Dialog>;
}

export function DeleteAuthorProfileDialog({ author, onDeleted }: { author: CreatorAuthorProfile; onDeleted: (authorId: number) => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [stageName, setStageName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = password.length > 0 && stageName === author.name;

  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      await $api.delete("/creator/me", {
        data: { currentPassword: password, stageName },
        skipAuthRefresh: true,
      });
      await onDeleted(author.id);
      setOpen(false);
      setPassword("");
      setStageName("");
    } catch (cause) {
      setError(profileError(cause));
    } finally {
      setBusy(false);
    }
  };

  return <AlertDialog open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); if (!next) setError(""); } }}>
    <AlertDialogTrigger asChild><Button type="button" variant="destructive"><Trash2 data-icon="inline-start" />Удалить авторский аккаунт</Button></AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>Удалить весь авторский архив?</AlertDialogTitle><AlertDialogDescription>Безвозвратно удалятся профиль автора, заявка, все собственные треки, альбомы, файлы, связи и статистика. Обычный пользовательский аккаунт останется.</AlertDialogDescription></AlertDialogHeader>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <FieldGroup>
        <Field><FieldLabel htmlFor="delete-creator-name">Введите псевдоним «{author.name}»</FieldLabel><Input id="delete-creator-name" value={stageName} onChange={(event) => setStageName(event.target.value)} autoComplete="off" disabled={busy} /></Field>
        <Field><FieldLabel htmlFor="delete-creator-password">Текущий пароль</FieldLabel><Input id="delete-creator-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" disabled={busy} /></Field>
      </FieldGroup>
      <AlertDialogFooter><AlertDialogCancel disabled={busy}>Отмена</AlertDialogCancel><AlertDialogAction disabled={!canSubmit || busy} onClick={(event) => { event.preventDefault(); void remove(); }}>{busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}Удалить безвозвратно</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}

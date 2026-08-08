"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import $api from "@/entities/http-service";
import { hasPermission } from "@/entities/user";
import AuthStore from "@/shared/store/auth";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { HeraldicPanel } from "@/shared/ui/heraldic-panel";
import { LoadingReveal } from "@/shared/ui/heraldic-loader";
import { Textarea } from "@/shared/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

type Status = "pending" | "approved" | "rejected";
type Application = { id: number; stageName: string; bio: string; avatar: string; status: Status; reviewNote?: string | null; user?: { email: string; displayName: string } };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8340";

export function CreatorModerationPage() {
  const router = useRouter();
  const principal = AuthStore((state) => state.profiles?.user);
  const canModerate = hasPermission(principal, "creator.moderate");
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const { data } = await $api.get<{ items: Application[] }>("/creator/applications", { params: { count: 100 } }); setItems(data.items); }
    catch { setError("Не удалось загрузить заявки авторов."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (principal && !canModerate) router.replace("/"); }, [canModerate, principal, router]);
  useEffect(() => { if (canModerate) void load(); }, [canModerate, load]);
  const decide = async (id: number, decision: "approve" | "reject", reviewNote?: string) => {
    setError("");
    try { await $api.patch(`/creator/applications/${id}/${decision}`, reviewNote ? { reviewNote } : undefined); await load(); }
    catch { setError("Не удалось сохранить решение. Возможно, заявка уже изменена другим модератором."); }
  };
  if (!canModerate) return <LoadingReveal loading variant="page" label="Проверяем доступ"><div className="min-h-[420px]" /></LoadingReveal>;
  return <LoadingReveal loading={loading} variant="page" label="Загружаем очередь модерации"><section className="mb-16"><HeraldicPanel watermark className="p-6 sm:p-8"><p className="font-cinzel text-[10px] tracking-[.2em] text-bnr-lilac">ADMIN ARCHIVE</p><h1 className="mt-3 font-cinzel text-4xl text-bnr-bone">Модерация авторов</h1><p className="mt-3 text-sm text-bnr-ash">Управляйте доступом авторов, не удаляя их опубликованный каталог.</p></HeraldicPanel>{error ? <Alert variant="destructive" className="mt-5"><AlertDescription>{error}</AlertDescription></Alert> : null}<Tabs defaultValue="pending" className="mt-7"><TabsList className="bg-bnr-surface"><TabsTrigger value="pending">Ожидают</TabsTrigger><TabsTrigger value="approved">Одобрены</TabsTrigger><TabsTrigger value="rejected">Отклонены</TabsTrigger></TabsList>{(["pending", "approved", "rejected"] as const).map((status) => <TabsContent key={status} value={status}><ApplicationList items={items.filter((item) => item.status === status)} status={status} onDecide={decide} /></TabsContent>)}</Tabs></section></LoadingReveal>;
}

function ApplicationList({ items, status, onDecide }: { items: Application[]; status: Status; onDecide: (id: number, decision: "approve" | "reject", note?: string) => Promise<void> }) {
  if (!items.length) return <Empty className="mt-5 border border-bnr-line"><EmptyHeader><EmptyTitle>Заявок нет</EmptyTitle><EmptyDescription>В этой части архива пока пусто.</EmptyDescription></EmptyHeader></Empty>;
  return <div className="mt-5 grid gap-4">{items.map((item) => <article key={item.id} className="grid gap-4 border border-bnr-line bg-bnr-surface p-4 sm:grid-cols-[72px_1fr_auto]"><div className="relative size-[72px] overflow-hidden border border-bnr-line bg-bnr-abyss">{item.avatar ? <Image src={`${apiUrl}/${item.avatar}`} alt="" fill unoptimized className="object-cover" /> : null}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-cinzel text-xl text-bnr-bone">{item.stageName}</h2><Badge variant="outline" className="border-bnr-lilac/45 text-bnr-lilac">{item.status}</Badge></div><p className="mt-1 text-xs text-bnr-ash">{item.user?.displayName} · {item.user?.email}</p><p className="mt-3 text-sm leading-6 text-bnr-bone/85">{item.bio}</p>{item.reviewNote ? <p className="mt-3 text-xs text-bnr-ash">Причина: {item.reviewNote}</p> : null}</div><div className="flex flex-wrap content-start gap-2">{status !== "approved" ? <Button type="button" variant="brand" size="sm" onClick={() => void onDecide(item.id, "approve")}><Check data-icon="inline-start" />{status === "rejected" ? "Восстановить" : "Одобрить"}</Button> : null}{status !== "rejected" ? <RejectDialog label={status === "approved" ? "Приостановить" : "Отклонить"} onReject={(note) => onDecide(item.id, "reject", note)} /> : <ShieldCheck className="text-bnr-lilac" />}</div></article>)}</div>;
}

function RejectDialog({ onReject, label }: { onReject: (note: string) => Promise<void>; label: string }) {
  const [open, setOpen] = useState(false); const [note, setNote] = useState(""); const [saving, setSaving] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" variant="outline" size="sm"><X data-icon="inline-start" />{label}</Button></DialogTrigger><DialogContent className="border-bnr-line bg-bnr-surface"><DialogHeader><DialogTitle>Причина решения</DialogTitle></DialogHeader><form onSubmit={(event) => { event.preventDefault(); setSaving(true); void onReject(note).then(() => { setOpen(false); setNote(""); }).finally(() => setSaving(false)); }}><FieldGroup><Field><FieldLabel htmlFor={`review-note-${label}`}>Сообщение автору</FieldLabel><Textarea id={`review-note-${label}`} value={note} onChange={(event) => setNote(event.target.value)} minLength={5} required /></Field><Button variant="destructive" type="submit" disabled={saving}>Сохранить решение</Button></FieldGroup></form></DialogContent></Dialog>;
}

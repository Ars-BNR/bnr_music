"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import $api from "@/entities/http-service";
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

type Application = { id: number; stageName: string; bio: string; avatar: string; status: "pending" | "approved" | "rejected"; reviewNote?: string | null; user?: { email: string; displayName: string } };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8340";

export function CreatorModerationPage() {
  const [items, setItems] = useState<Application[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = () => { setLoading(true); setError(""); void $api.get<{ items: Application[] }>("/creator/applications", { params: { count: 50 } }).then(({ data }) => setItems(data.items)).catch(() => setError("Не удалось загрузить заявки. Доступен только администратору.")).finally(() => setLoading(false)); };
  useEffect(load, []);
  const decide = async (id: number, decision: "approve" | "reject", reviewNote?: string) => { try { await $api.patch(`/creator/applications/${id}/${decision}`, reviewNote ? { reviewNote } : undefined); load(); } catch { setError("Не удалось сохранить решение."); } };
  const byStatus = (status: Application["status"]) => items.filter((item) => item.status === status);
  return <LoadingReveal loading={loading} variant="page" label="Загружаем очередь модерации"><section className="mb-16" aria-labelledby="moderation-title"><HeraldicPanel watermark className="p-6 sm:p-8"><p className="font-cinzel text-[10px] tracking-[.2em] text-bnr-lilac">ADMIN ARCHIVE</p><h1 id="moderation-title" className="mt-3 font-cinzel text-4xl font-semibold text-bnr-bone">Модерация авторов</h1><p className="mt-3 text-sm text-bnr-ash">Проверьте заявку, затем одобрите доступ к авторской студии или укажите причину доработки.</p></HeraldicPanel>{error ? <Alert variant="destructive" className="mt-5"><AlertDescription>{error}</AlertDescription></Alert> : null}<Tabs defaultValue="pending" className="mt-7"><TabsList className="bg-bnr-surface"><TabsTrigger value="pending">Ожидают</TabsTrigger><TabsTrigger value="approved">Одобрены</TabsTrigger><TabsTrigger value="rejected">Отклонены</TabsTrigger></TabsList>{(["pending", "approved", "rejected"] as const).map((status) => <TabsContent key={status} value={status}><ApplicationList items={byStatus(status)} pending={status === "pending"} onDecide={decide} /></TabsContent>)}</Tabs></section></LoadingReveal>;
}

function ApplicationList({ items, pending, onDecide }: { items: Application[]; pending: boolean; onDecide: (id: number, decision: "approve" | "reject", note?: string) => Promise<void> }) { if (!items.length) return <Empty className="mt-5 border border-bnr-line"><EmptyHeader><EmptyTitle>Заявок нет</EmptyTitle><EmptyDescription>В этой части архива пока пусто.</EmptyDescription></EmptyHeader></Empty>; return <div className="mt-5 grid gap-4">{items.map((item) => <article key={item.id} className="grid gap-4 border border-bnr-line bg-bnr-surface p-4 sm:grid-cols-[72px_1fr_auto]"><div className="relative size-[72px] overflow-hidden border border-bnr-line bg-bnr-abyss">{item.avatar ? <Image src={`${apiUrl}/${item.avatar}`} alt="" fill unoptimized className="object-cover" /> : null}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-cinzel text-xl text-bnr-bone">{item.stageName}</h2><Badge variant="outline" className="border-bnr-lilac/45 px-2 py-1 text-[10px] text-bnr-lilac">{item.status}</Badge></div><p className="mt-1 text-xs text-bnr-ash">{item.user?.displayName} · {item.user?.email}</p><p className="mt-3 text-sm leading-6 text-bnr-bone/85">{item.bio}</p>{item.reviewNote ? <p className="mt-3 text-xs text-bnr-ash">Причина: {item.reviewNote}</p> : null}</div>{pending ? <div className="flex flex-wrap content-start gap-2"><Button type="button" variant="brand" size="sm" onClick={() => void onDecide(item.id, "approve")}><Check data-icon="inline-start" />Одобрить</Button><RejectDialog onReject={(note) => onDecide(item.id, "reject", note)} /></div> : <ShieldCheck className="text-bnr-lilac" />}</article>)}</div>; }
function RejectDialog({ onReject }: { onReject: (note: string) => Promise<void> }) { const [open, setOpen] = useState(false); const [note, setNote] = useState(""); return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" variant="outline" size="sm"><X data-icon="inline-start" />Отклонить</Button></DialogTrigger><DialogContent className="border-bnr-line bg-bnr-surface"><DialogHeader><DialogTitle>Причина доработки</DialogTitle></DialogHeader><form onSubmit={(event) => { event.preventDefault(); void onReject(note).then(() => setOpen(false)); }}><FieldGroup><Field><FieldLabel htmlFor="review-note">Сообщение автору</FieldLabel><Textarea id="review-note" value={note} onChange={(event) => setNote(event.target.value)} minLength={5} required /></Field><Button variant="destructive" type="submit">Сохранить отказ</Button></FieldGroup></form></DialogContent></Dialog>; }

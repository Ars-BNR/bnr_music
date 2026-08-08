"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AxiosError } from "axios";
import { AuthShell } from "@/shared/ui/auth-shell";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import $api from "@/entities/http-service";

export function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return setError("Ссылка для сброса пароля недействительна.");
    if (password.length < 8 || password !== confirm) return setError("Введите совпадающие пароли длиной не менее 8 символов.");
    setSaving(true); setError("");
    try { await $api.post("/password-reset/confirm", { token, password }); router.replace("/login"); }
    catch (cause) { const message = cause instanceof AxiosError ? cause.response?.data?.message : null; setError(Array.isArray(message) ? message.join(". ") : typeof message === "string" ? message : "Не удалось сменить пароль."); }
    finally { setSaving(false); }
  };
  return <AuthShell title="Новый пароль" description="Укажите новый пароль для вашей печати BNR.">
    <form onSubmit={submit}><FieldGroup>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <Field data-invalid={Boolean(error)}><FieldLabel htmlFor="new-password">Новый пароль</FieldLabel><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(error)} disabled={saving} /></Field>
      <Field><FieldLabel htmlFor="confirm-password">Повторите пароль</FieldLabel><Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} disabled={saving} /></Field>
      <Button type="submit" variant="brand" size="auth" disabled={saving}>Сохранить пароль</Button>
    </FieldGroup></form>
  </AuthShell>;
}

"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Camera, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthStore from "@/shared/store/auth";
import { profileApi, type UserProfile, UserAvatar } from "@/entities/user";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { SectionHeading } from "@/shared/ui/section-heading";
import { LoadingReveal } from "@/shared/ui/heraldic-loader";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

const fieldClass = "border-bnr-line bg-bnr-abyss text-bnr-bone placeholder:text-bnr-ash focus-visible:ring-bnr-lilac";

export function SettingsPage() {
  const router = useRouter();
  const logout = AuthStore((state) => state.logout);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    void profileApi.get().then((data) => {
      if (!cancelled) {
        setProfile(data);
        setDisplayName(data.displayName);
        setBio(data.bio);
      }
    }).catch(() => { if (!cancelled) setError("Не удалось загрузить настройки профиля."); });
    return () => { cancelled = true; };
  }, []);

  const run = async (work: () => Promise<void>) => {
    setSaving(true); setError(""); setMessage("");
    try { await work(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить изменения."); } finally { setSaving(false); }
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const next = await profileApi.update({ displayName, bio });
      setProfile(next); setMessage("Профиль сохранён.");
    });
  };

  const uploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Выберите JPEG, PNG или WebP размером не более 2 MiB.");
      event.target.value = "";
      return;
    }
    void run(async () => { const next = await profileApi.uploadAvatar(file); setProfile(next); setMessage("Аватар обновлён."); });
  };

  const changeEmail = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await profileApi.changeEmail(currentPassword, email);
      await logout(router);
    });
  };

  const changePassword = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await profileApi.changePassword(currentPassword, newPassword);
      await logout(router);
    });
  };

  if (!profile) return <LoadingReveal loading={!error} variant="page" label="Открываем настройки"><Skeleton className="min-h-[460px] w-full" /></LoadingReveal>;

  return (
    <section className="mb-16 min-w-0" aria-labelledby="settings-title">
      <SectionHeading description="Управляйте личными данными и безопасностью аккаунта."><span id="settings-title">Настройки профиля</span></SectionHeading>
      {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {message ? <Alert className="mb-4 border-bnr-lilac/45 bg-bnr-violet/10 text-bnr-bone"><AlertDescription>{message}</AlertDescription></Alert> : null}
      <Tabs defaultValue="profile" className="min-w-0">
        <TabsList className="h-auto max-w-full rounded-none border border-bnr-line bg-bnr-surface p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-bnr-violet data-[state=active]:text-bnr-bone">Профиль</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-bnr-violet data-[state=active]:text-bnr-bone">Безопасность</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <form onSubmit={saveProfile} className="border border-bnr-line/70 bg-bnr-surface p-5 sm:p-6">
            <div className="mb-7 flex flex-wrap items-center gap-4">
              <UserAvatar profile={profile} className="size-20" />
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 border border-bnr-lilac/45 px-3 text-sm font-medium text-bnr-bone transition-colors hover:bg-bnr-lilac/10 focus-within:ring-2 focus-within:ring-bnr-lilac"><Camera className="size-4" />Загрузить аватар<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} disabled={saving} /></label>
                {profile.avatar ? <Button type="button" variant="ghost" size="sm" className="text-destructive" disabled={saving} onClick={() => void run(async () => { const next = await profileApi.removeAvatar(); setProfile(next); setMessage("Аватар удалён."); })}><Trash2 data-icon="inline-start" />Удалить</Button> : null}
              </div>
            </div>
            <FieldGroup>
              <Field data-invalid={!displayName}>
                <FieldLabel htmlFor="displayName">Имя</FieldLabel>
                <Input id="displayName" value={displayName} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} className={fieldClass} aria-invalid={!displayName} />
                <FieldError>{!displayName ? "Укажите отображаемое имя." : null}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="bio">О себе</FieldLabel>
                <Textarea id="bio" value={bio} maxLength={280} onChange={(event) => setBio(event.target.value)} className={`${fieldClass} min-h-28`} />
                <p className="text-right text-xs text-bnr-ash">{bio.length}/280</p>
              </Field>
              <Button type="submit" variant="brand" className="w-full sm:w-auto" disabled={saving || !displayName}>{saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}Сохранить профиль</Button>
            </FieldGroup>
          </form>
        </TabsContent>
        <TabsContent value="security" className="mt-4 space-y-4">
          <form onSubmit={changeEmail} className="border border-bnr-line/70 bg-bnr-surface p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3"><ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-bnr-lilac" /><div><h2 className="font-cinzel text-lg text-bnr-bone">Сменить email</h2><p className="mt-1 text-sm text-bnr-ash">После сохранения потребуется активировать новый адрес и войти заново.</p></div></div>
            <FieldGroup>
              <Field><FieldLabel htmlFor="newEmail">Новый email</FieldLabel><Input id="newEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} required /></Field>
              <Field><FieldLabel htmlFor="emailCurrentPassword">Текущий пароль</FieldLabel><Input id="emailCurrentPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={fieldClass} required /></Field>
              <Button type="submit" variant="brandLink" className="w-full sm:w-auto" disabled={saving}>Изменить email</Button>
            </FieldGroup>
          </form>
          <form onSubmit={changePassword} className="border border-bnr-line/70 bg-bnr-surface p-5 sm:p-6">
            <div className="mb-5"><h2 className="font-cinzel text-lg text-bnr-bone">Сменить пароль</h2><p className="mt-1 text-sm text-bnr-ash">Все refresh-сессии будут завершены, включая текущую.</p></div>
            <FieldGroup>
              <Field><FieldLabel htmlFor="passwordCurrent">Текущий пароль</FieldLabel><Input id="passwordCurrent" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={fieldClass} required /></Field>
              <Field><FieldLabel htmlFor="newPassword">Новый пароль</FieldLabel><Input id="newPassword" type="password" minLength={4} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={fieldClass} required /></Field>
              <Button type="submit" variant="brandLink" className="w-full sm:w-auto" disabled={saving}>Сменить пароль</Button>
            </FieldGroup>
          </form>
        </TabsContent>
      </Tabs>
    </section>
  );
}

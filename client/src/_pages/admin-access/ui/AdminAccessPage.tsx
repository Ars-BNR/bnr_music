"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { Check, KeyRound, Loader2, Pencil, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/entities/user";
import AuthStore from "@/shared/store/auth";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { LoadingReveal } from "@/shared/ui/heraldic-loader";
import { HeraldicPanel } from "@/shared/ui/heraldic-panel";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { cn } from "@/shared/components/lib/utils";
import { adminAccessApi } from "../api/admin-access";
import {
  emptyRoleDraft,
  type RbacPermission,
  type RbacRole,
  type RbacUser,
  type RoleDraft,
} from "../model/admin-access";

const PAGE_SIZE = 20;
const roleCodePattern = /^[a-z][a-z0-9._-]{1,63}$/;
const fieldClass = "border-bnr-line bg-bnr-abyss text-bnr-bone placeholder:text-bnr-ash focus-visible:ring-bnr-lilac";

const getErrorMessage = (cause: unknown, fallback: string) => {
  if (cause instanceof AxiosError) {
    const message = cause.response?.data?.message;
    if (Array.isArray(message)) return message.join(". ");
    if (typeof message === "string" && message) return message;
  }
  return fallback;
};

export function AdminAccessPage() {
  const router = useRouter();
  const principal = AuthStore((state) => state.profiles?.user);
  const canManage = hasPermission(principal, "rbac.manage");
  const [permissions, setPermissions] = useState<RbacPermission[]>([]);
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [users, setUsers] = useState<RbacUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [definitionsLoading, setDefinitionsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [definitionsError, setDefinitionsError] = useState("");
  const [usersError, setUsersError] = useState("");
  const usersRequestId = useRef(0);

  useEffect(() => {
    if (principal && !canManage) router.replace("/");
  }, [canManage, principal, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const loadDefinitions = useCallback(async () => {
    setDefinitionsLoading(true);
    try {
      const [nextPermissions, nextRoles] = await Promise.all([
        adminAccessApi.getPermissions(),
        adminAccessApi.getRoles(),
      ]);
      setPermissions(nextPermissions);
      setRoles(nextRoles);
      setDefinitionsError("");
    } catch (cause) {
      setDefinitionsError(getErrorMessage(cause, "Не удалось загрузить роли и разрешения."));
    } finally {
      setDefinitionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;
    void loadDefinitions();
  }, [canManage, loadDefinitions]);

  const loadUsers = useCallback(async (search: string, offset = 0, append = false) => {
    const requestId = ++usersRequestId.current;
    if (append) setLoadingMore(true);
    else setUsersLoading(true);
    try {
      const page = await adminAccessApi.getUsers(search, PAGE_SIZE, offset);
      if (requestId !== usersRequestId.current) return;
      setUsers((current) => append ? [
          ...current,
          ...page.items.filter((candidate) => !current.some((item) => item.id === candidate.id)),
        ] : page.items);
      setTotalUsers(page.total);
      setUsersError("");
    } catch (cause) {
      if (requestId === usersRequestId.current) {
        setUsersError(getErrorMessage(cause, append ? "Не удалось загрузить следующую страницу пользователей." : "Не удалось загрузить пользователей."));
      }
    } finally {
      if (requestId === usersRequestId.current) {
        if (append) setLoadingMore(false);
        else {
          setUsersLoading(false);
          setHasLoadedUsers(true);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;
    void loadUsers(debouncedQuery);
  }, [canManage, debouncedQuery, loadUsers]);

  const reloadRoles = async () => {
    const nextRoles = await adminAccessApi.getRoles();
    setRoles(nextRoles);
  };

  const updateUser = (nextUser: RbacUser) => {
    setUsers((current) => current.map((item) => (item.id === nextUser.id ? nextUser : item)));
  };

  if (!canManage) {
    return <LoadingReveal loading variant="page" label="Проверяем административный доступ"><Skeleton className="min-h-[420px] w-full" /></LoadingReveal>;
  }

  const initialLoading = definitionsLoading || (!hasLoadedUsers && usersLoading);
  const error = definitionsError || usersError;
  return (
    <LoadingReveal loading={initialLoading} variant="page" label="Открываем архив ролей и доступа">
      <section className="mb-16 min-w-0" aria-labelledby="admin-access-title">
        <HeraldicPanel watermark className="mb-6 p-6 sm:p-8">
          <p className="font-cinzel text-[10px] tracking-[0.2em] text-bnr-lilac">ADMINISTRATIVE SEAL</p>
          <h1 id="admin-access-title" className="mt-3 font-cinzel text-[clamp(2rem,5vw,2.625rem)] font-semibold text-bnr-bone">Роли и доступ</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-bnr-ash">Назначайте пользователям несколько ролей и собирайте права из единого каталога разрешений.</p>
        </HeraldicPanel>

        {error ? (
          <Alert variant="destructive" className="mb-5">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => { void loadDefinitions(); void loadUsers(debouncedQuery); }}>Повторить</Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs defaultValue="users" className="min-w-0">
          <TabsList className="h-auto max-w-full rounded-none border border-bnr-line bg-bnr-surface p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-bnr-violet data-[state=active]:text-bnr-bone"><UsersRound data-icon="inline-start" />Пользователи</TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-bnr-violet data-[state=active]:text-bnr-bone"><KeyRound data-icon="inline-start" />Роли</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-5">
            <Field className="mb-5 max-w-xl">
              <FieldLabel htmlFor="rbac-user-search">Поиск пользователей</FieldLabel>
              <Input id="rbac-user-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя или email" className={fieldClass} />
            </Field>
            {usersLoading ? <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-44" /><Skeleton className="h-44" /></div> : null}
            {!usersLoading && users.length === 0 ? (
              <Empty className="min-h-64 border border-bnr-line">
                <EmptyHeader><EmptyTitle>Пользователи не найдены</EmptyTitle><EmptyDescription>Измените поисковый запрос или очистите строку поиска.</EmptyDescription></EmptyHeader>
              </Empty>
            ) : null}
            {!usersLoading && users.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {users.map((user) => (
                  <UserAccessCard key={user.id} user={user} roles={roles} actorId={principal?.sub ?? 0} onSaved={updateUser} />
                ))}
              </div>
            ) : null}
            {users.length < totalUsers ? (
              <div className="mt-5 flex justify-center">
                <Button type="button" variant="outline" disabled={loadingMore} onClick={() => void loadUsers(debouncedQuery, users.length, true)}>
                  {loadingMore ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
                  Показать ещё
                </Button>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="roles" className="mt-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-bnr-ash">Системные роли защищены от изменения. Пользовательские роли можно настраивать.</p>
              <RoleDialog permissions={permissions} onSaved={reloadRoles} />
            </div>
            {roles.length === 0 ? (
              <Empty className="min-h-64 border border-bnr-line"><EmptyHeader><EmptyTitle>Роли не настроены</EmptyTitle><EmptyDescription>Создайте первую роль и назначьте ей разрешения.</EmptyDescription></EmptyHeader></Empty>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {roles.map((role) => <RoleCard key={role.id} role={role} permissions={permissions} onSaved={reloadRoles} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </LoadingReveal>
  );
}

function UserAccessCard({ user, roles, actorId, onSaved }: { user: RbacUser; roles: RbacRole[]; actorId: number; onSaved: (user: RbacUser) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const accountAction = async (action: "block" | "unblock" | "restore" | "delete" | "reset") => {
    if (!window.confirm(action === "reset" ? "Отправить ссылку на сброс пароля?" : "Подтвердить изменение статуса аккаунта?")) return;
    setPending(true); setError(""); setMessage("");
    try { if (action === "reset") { const result = await adminAccessApi.sendPasswordReset(user.id); if (result.mode === "temporary-password") setTemporaryPassword(result.temporaryPassword); else setMessage("Ссылка для сброса пароля отправлена пользователю."); } else { await adminAccessApi.setAccountStatus(user.id, action); window.location.reload(); } }
    catch (cause) { setError(getErrorMessage(cause, "Не удалось изменить аккаунт.")); }
    finally { setPending(false); }
  };
  return (
    <Card className="rounded-none border-bnr-line/70 bg-bnr-surface">
      <CardHeader>
        <CardTitle className="truncate font-cinzel text-xl text-bnr-bone">{user.displayName}</CardTitle>
        <CardDescription className="truncate text-bnr-ash">{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant="outline" className="border-bnr-lilac/40 text-bnr-lilac">{user.accountStatus ?? "active"}</Badge>
        {user.roles.map((role) => <Badge key={role.id} variant="outline" className="border-bnr-lilac/40 text-bnr-lilac">{role.name}</Badge>)}
        {user.permissions?.map((permission) => <Badge key={permission} variant="outline" className="border-bnr-line text-bnr-ash">{permission}</Badge>)}
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {message ? <Alert><AlertDescription>{message}</AlertDescription></Alert> : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <AssignRolesDialog user={user} roles={roles} actorId={actorId} onSaved={onSaved} />
        <Button type="button" size="sm" variant="outline" disabled={pending || user.id === actorId} onClick={() => void accountAction("reset")}>Сбросить пароль</Button>
        {user.accountStatus === "blocked" || user.accountStatus === "deleted" ? <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void accountAction(user.accountStatus === "deleted" ? "restore" : "unblock")}>Восстановить</Button> : <><Button type="button" size="sm" variant="outline" disabled={pending || user.id === actorId} onClick={() => void accountAction("block")}>Заблокировать</Button><Button type="button" size="sm" variant="destructive" disabled={pending || user.id === actorId} onClick={() => void accountAction("delete")}>Удалить</Button></>}
      </CardFooter>
      <Dialog open={Boolean(temporaryPassword)} onOpenChange={(open) => { if (!open) setTemporaryPassword(""); }}><DialogContent className="border-bnr-line bg-bnr-surface"><DialogHeader><DialogTitle className="font-cinzel">Временный пароль seed-автора</DialogTitle><DialogDescription>Пароль показывается один раз. Передайте его пользователю безопасным способом; после входа потребуется обязательная смена.</DialogDescription></DialogHeader><div className="break-all border border-bnr-lilac/50 bg-bnr-abyss p-4 font-mono text-bnr-bone" data-testid="temporary-password">{temporaryPassword}</div><Button type="button" variant="brand" onClick={() => void navigator.clipboard.writeText(temporaryPassword)}>Копировать пароль</Button></DialogContent></Dialog>
    </Card>
  );
}

function AssignRolesDialog({ user, roles, actorId, onSaved }: { user: RbacUser; roles: RbacRole[]; actorId: number; onSaved: (user: RbacUser) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedIds(user.roles.map((role) => role.id));
      setError("");
    }
  }, [open, user.roles]);

  const toggleRole = (role: RbacRole) => {
    const locked = role.code === "user" || (user.id === actorId && role.code === "admin");
    if (locked) return;
    setSelectedIds((current) => current.includes(role.id) ? current.filter((id) => id !== role.id) : [...current, role.id]);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await adminAccessApi.replaceUserRoles(user.id, selectedIds);
      onSaved(updated);
      setOpen(false);
    } catch (cause) {
      setError(getErrorMessage(cause, "Не удалось назначить роли пользователю."));
    } finally {
      setSaving(false);
    }
  };

  const userLabel = user.displayName || user.email;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" aria-label={`Назначить роли пользователю ${userLabel}`}><ShieldCheck data-icon="inline-start" />Назначить роли</Button>
      </DialogTrigger>
      <DialogContent className="border-bnr-line bg-bnr-surface">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-bnr-bone">Назначить роли</DialogTitle>
          <DialogDescription>{userLabel} · базовая роль user обязательна.</DialogDescription>
        </DialogHeader>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <Field>
          <FieldLabel>Роли пользователя</FieldLabel>
          <Command className="rounded-none border border-bnr-line bg-bnr-abyss">
            <CommandInput aria-label="Поиск ролей" placeholder="Найти роль" />
            <CommandList>
              <CommandEmpty>Роли не найдены.</CommandEmpty>
              <CommandGroup heading="Доступные роли">
                {roles.map((role) => {
                  const selected = selectedIds.includes(role.id);
                  const locked = role.code === "user" || (user.id === actorId && role.code === "admin");
                  return (
                    <CommandItem
                      key={role.id}
                      value={`${role.code} ${role.name}`}
                      aria-label={role.name}
                      aria-selected={selected}
                      aria-checked={selected}
                      data-checked={selected}
                      disabled={locked || saving}
                      onSelect={() => toggleRole(role)}
                    >
                      <Check aria-hidden="true" className={cn("shrink-0", selected ? "opacity-100" : "opacity-0")} />
                      <span className="min-w-0 flex-1"><span className="block text-bnr-bone">{role.name}</span><span className="block font-mono text-[11px] text-bnr-ash">{role.code}{locked ? " · обязательная" : ""}</span></span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </Field>
        <DialogFooter>
          <Button type="button" variant="brand" disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
            Сохранить роли
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoleCard({ role, permissions, onSaved }: { role: RbacRole; permissions: RbacPermission[]; onSaved: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    if (!window.confirm(`Удалить роль «${role.name}»? Назначения будут сняты.`)) return;
    setDeleting(true);
    try { await adminAccessApi.deleteRole(role.id); await onSaved(); }
    finally { setDeleting(false); }
  };
  return (
    <Card className="rounded-none border-bnr-line/70 bg-bnr-surface">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate font-cinzel text-xl text-bnr-bone">{role.name}</CardTitle>
            <CardDescription className="mt-1 font-mono text-xs text-bnr-lilac">{role.code}</CardDescription>
          </div>
          <Badge variant={role.isSystem ? "secondary" : "outline"}>{role.isSystem ? "Системная" : "Пользовательская"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 min-h-10 text-sm leading-5 text-bnr-ash">{role.description || "Без описания"}</p>
        <div className="flex flex-wrap gap-2">
          {role.permissions.map((permission) => <Badge key={permission.id} variant="outline" className="border-bnr-lilac/30 text-[11px] text-bnr-bone">{permission.code}</Badge>)}
        </div>
      </CardContent>
      <CardFooter>
        {role.isSystem ? <p className="text-xs text-bnr-ash">Защищена политикой BNR</p> : <><RoleDialog role={role} permissions={permissions} onSaved={onSaved} /><Button type="button" size="sm" variant="destructive" disabled={deleting} onClick={() => void remove()}>Удалить</Button></>}
      </CardFooter>
    </Card>
  );
}

function RoleDialog({ role, permissions, onSaved }: { role?: RbacRole; permissions: RbacPermission[]; onSaved: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const initialDraft = useMemo<RoleDraft>(() => role ? {
    code: role.code,
    name: role.name,
    description: role.description,
    permissionIds: role.permissions.map((permission) => permission.id),
  } : emptyRoleDraft, [role]);
  const [draft, setDraft] = useState<RoleDraft>(initialDraft);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(initialDraft);
      setSubmitted(false);
      setError("");
    }
  }, [initialDraft, open]);

  const codeInvalid = !role && !roleCodePattern.test(draft.code);
  const nameInvalid = draft.name.trim().length < 2;
  const valid = !codeInvalid && !nameInvalid;

  const togglePermission = (permissionId: number) => {
    setDraft((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((id) => id !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    setSaving(true);
    setError("");
    try {
      if (role) {
        await adminAccessApi.updateRole(role.id, {
          name: draft.name.trim(),
          description: draft.description.trim(),
          permissionIds: draft.permissionIds,
        });
      } else {
        await adminAccessApi.createRole({
          ...draft,
          code: draft.code.trim(),
          name: draft.name.trim(),
          description: draft.description.trim(),
        });
      }
      await onSaved();
      setOpen(false);
    } catch (cause) {
      setError(getErrorMessage(cause, role ? "Не удалось обновить роль." : "Не удалось создать роль."));
    } finally {
      setSaving(false);
    }
  };

  const title = role ? "Редактировать роль" : "Создать роль";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={role ? "outline" : "brand"}>
          {role ? <Pencil data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="bnr-scrollbar max-h-[90dvh] overflow-y-auto border-bnr-line bg-bnr-surface">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-bnr-bone">{title}</DialogTitle>
          <DialogDescription>{role ? "Код роли остаётся неизменным." : "Создайте код и выберите разрешения для новой роли."}</DialogDescription>
        </DialogHeader>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <form onSubmit={submit}>
          <FieldGroup>
            <Field data-invalid={submitted && codeInvalid} data-disabled={Boolean(role)}>
              <FieldLabel htmlFor={`role-code-${role?.id ?? "new"}`}>Код роли</FieldLabel>
              <Input id={`role-code-${role?.id ?? "new"}`} value={draft.code} disabled={Boolean(role) || saving} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} aria-invalid={submitted && codeInvalid} className={fieldClass} />
              <FieldError>{submitted && codeInvalid ? "Используйте 2–64 строчных латинских символа, цифры, точку, дефис или подчёркивание." : null}</FieldError>
            </Field>
            <Field data-invalid={submitted && nameInvalid}>
              <FieldLabel htmlFor={`role-name-${role?.id ?? "new"}`}>Название роли</FieldLabel>
              <Input id={`role-name-${role?.id ?? "new"}`} value={draft.name} maxLength={120} disabled={saving} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} aria-invalid={submitted && nameInvalid} className={fieldClass} />
              <FieldError>{submitted && nameInvalid ? "Название должно содержать не менее двух символов." : null}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor={`role-description-${role?.id ?? "new"}`}>Описание роли</FieldLabel>
              <Textarea id={`role-description-${role?.id ?? "new"}`} value={draft.description} maxLength={280} disabled={saving} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className={cn(fieldClass, "min-h-24")} />
            </Field>
            <Field>
              <FieldLabel>Разрешения</FieldLabel>
              <Command className="rounded-none border border-bnr-line bg-bnr-abyss">
                <CommandInput aria-label="Поиск разрешений" placeholder="Найти разрешение" />
                <CommandList>
                  <CommandEmpty>Разрешения не найдены.</CommandEmpty>
                  <CommandGroup heading="Разрешения">
                    {permissions.map((permission) => {
                      const selected = draft.permissionIds.includes(permission.id);
                      return (
                        <CommandItem
                          key={permission.id}
                          value={`${permission.code} ${permission.name}`}
                          aria-label={`${permission.code}: ${permission.name}`}
                          aria-selected={selected}
                          aria-checked={selected}
                          data-checked={selected}
                          onSelect={() => togglePermission(permission.id)}
                        >
                          <Check aria-hidden="true" className={cn("shrink-0", selected ? "opacity-100" : "opacity-0")} />
                          <span className="min-w-0"><span className="block font-mono text-xs text-bnr-lilac">{permission.code}</span><span className="block truncate text-xs text-bnr-ash">{permission.name}</span></span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </Field>
            <Button type="submit" variant="brand" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
              {role ? "Сохранить роль" : "Создать роль"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import Link from "next/link";
import { Heart, MicVocal, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AuthStore from "@/shared/store/auth";
import { Button } from "@/shared/ui/button";
import { hasPermission, profileApi, type UserProfile, UserAvatar } from "@/entities/user";

const isCurrent = (pathname: string, href: string) => pathname === href;

export default function Profiles() {
  const pathname = usePathname();
  const sessionUser = AuthStore((state) => state.profiles?.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    void profileApi.get().then((data) => {
      if (!cancelled) setProfile(data);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const fallback: UserProfile = profile ?? {
    id: sessionUser?.sub ?? 0,
    displayName: sessionUser?.email?.split("@")[0] || "BNR",
    email: sessionUser?.email ?? "",
    bio: "",
    avatar: null,
    roles: sessionUser?.roles ?? ["user"],
    permissions: sessionUser?.permissions ?? [],
    isActivated: true,
  };
  const hasStudio = hasPermission(fallback, "creator.publish");

  return (
    <nav aria-label="Панель профиля" className="flex h-[58px] w-full min-w-0 items-center gap-1 border border-bnr-line/75 bg-bnr-surface p-2 shadow-[inset_0_0_0_1px_hsl(var(--bnr-abyss)/0.65)] sm:w-auto sm:max-w-[360px]">
      <Link href="/profile" aria-current={isCurrent(pathname, "/profile") ? "page" : undefined} aria-label="Открыть профиль" className="group flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac">
        <UserAvatar profile={fallback} className="size-9" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-sm font-semibold text-bnr-bone">{fallback.displayName}</span>
          <span className="block truncate text-[11px] text-bnr-ash">{fallback.email}</span>
        </span>
      </Link>
      <Button asChild size="sm" variant="ghost" className="size-9 shrink-0 p-0 text-bnr-ash hover:bg-bnr-violet/10 hover:text-bnr-lilac" aria-current={isCurrent(pathname, "/collection/albums") ? "page" : undefined}>
        <Link href="/collection/albums" aria-label="Любимые альбомы"><Heart data-icon="inline-start" /></Link>
      </Button>
      <Button asChild size="sm" variant="ghost" className="size-9 shrink-0 p-0 text-bnr-ash hover:bg-bnr-violet/10 hover:text-bnr-lilac" aria-current={isCurrent(pathname, "/studio") ? "page" : undefined}>
        <Link href="/studio" aria-label={hasStudio ? "Авторская студия" : "Стать автором"}><MicVocal data-icon="inline-start" /></Link>
      </Button>
      <Button asChild size="sm" variant="ghost" className="size-9 shrink-0 p-0 text-bnr-ash hover:bg-bnr-violet/10 hover:text-bnr-lilac" aria-current={isCurrent(pathname, "/settings") ? "page" : undefined}>
        <Link href="/settings" aria-label="Настройки профиля"><Settings data-icon="inline-start" /></Link>
      </Button>
    </nav>
  );
}

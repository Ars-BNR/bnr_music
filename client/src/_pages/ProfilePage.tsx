"use client";

import Link from "next/link";
import { Album, Disc3, ListMusic, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { profileApi, type CollectionSummary, type UserProfile, UserAvatar } from "@/entities/user";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { FleurDeLis } from "@/shared/ui/brand";
import { HeraldicPanel } from "@/shared/ui/heraldic-panel";
import { SectionHeading } from "@/shared/ui/section-heading";
import { LoadingReveal } from "@/shared/ui/heraldic-loader";
import { Skeleton } from "@/shared/ui/skeleton";

const libraryLinks = [
  { key: "tracks", href: "/collection/tracks", icon: Disc3, title: "Любимые треки", summaryKey: "totalTracks" as const },
  { key: "albums", href: "/collection/albums", icon: Album, title: "Любимые альбомы", summaryKey: "totalAlbums" as const },
  { key: "playlists", href: "/collection/playlist", icon: ListMusic, title: "Плейлисты", summaryKey: "totalPlaylists" as const },
];

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([profileApi.get(), profileApi.getSummary()])
      .then(([nextProfile, nextSummary]) => {
        if (!cancelled) {
          setProfile(nextProfile);
          setSummary(nextSummary);
          setError("");
        }
      })
      .catch(() => { if (!cancelled) setError("Не удалось загрузить личное досье."); });
    return () => { cancelled = true; };
  }, []);

  if (!profile && !error) return <LoadingReveal loading variant="page" label="Открываем личное досье"><Skeleton className="min-h-[420px] w-full" /></LoadingReveal>;
  if (!profile) return <Empty className="min-h-[320px]"><EmptyHeader><EmptyTitle>Профиль недоступен</EmptyTitle><EmptyDescription>{error}</EmptyDescription></EmptyHeader></Empty>;

  return (
    <section className="mb-16 min-w-0" aria-labelledby="profile-title">
      {error ? <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <HeraldicPanel watermark className="mb-6 min-h-[250px] p-5 sm:p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0 border border-bnr-lilac/55 p-1.5 shadow-[0_0_0_5px_hsl(var(--bnr-abyss)/0.65)]">
            <UserAvatar profile={profile} className="size-28" />
            <FleurDeLis aria-hidden="true" className="absolute -bottom-4 -right-4 size-10 text-bnr-lilac" />
          </div>
          <div className="min-w-0">
            <p className="font-cinzel text-[10px] tracking-[0.2em] text-bnr-lilac">ЛИЧНОЕ ДОСЬЕ</p>
            <h1 id="profile-title" className="mt-2 truncate font-cinzel text-[clamp(2rem,5vw,2.625rem)] font-semibold tracking-wide text-bnr-bone">{profile.displayName}</h1>
            <p className="mt-2 truncate text-sm text-bnr-ash">{profile.email}</p>
            {profile.bio ? <p className="mt-4 max-w-xl text-sm leading-relaxed text-bnr-bone/80">{profile.bio}</p> : <p className="mt-4 text-sm text-bnr-ash">Добавьте короткое описание в настройках профиля.</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <Badge key={role} className="border border-bnr-lilac/35 bg-bnr-violet/10 text-bnr-lilac">{role}</Badge>
              ))}
              <Badge className="border border-bnr-ash/25 bg-bnr-abyss/55 text-bnr-ash">{profile.isActivated ? "Аккаунт активирован" : "Ожидается активация"}</Badge>
              <Button asChild variant="brandLink" size="sm"><Link href="/settings"><Settings data-icon="inline-start" />Настроить профиль</Link></Button>
            </div>
          </div>
        </div>
      </HeraldicPanel>

      <SectionHeading description="Быстрый доступ к вашей личной библиотеке">Коллекция</SectionHeading>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {libraryLinks.map(({ key, href, icon: Icon, title, summaryKey }) => (
          <Link key={key} href={href} className="group relative overflow-hidden border border-bnr-line/60 bg-bnr-surface p-5 transition-[border-color,transform] [transition-duration:180ms] hover:-translate-y-0.5 hover:border-bnr-lilac/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac motion-reduce:transform-none">
            <Icon aria-hidden="true" className="size-6 text-bnr-lilac" />
            <p className="mt-8 font-cinzel text-lg text-bnr-bone">{title}</p>
            <p className="mt-1 text-sm text-bnr-ash">{summary?.[summaryKey] ?? 0}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { BASE_URL } from "@/shared/config/config";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import type { UserProfile } from "..";

export function UserAvatar({ profile, className = "size-10" }: { profile: Pick<UserProfile, "displayName" | "avatar">; className?: string }) {
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || "B";
  return (
    <Avatar className={`${className} border border-bnr-lilac/50 bg-bnr-abyss`}>
      {profile.avatar ? <Image src={`${BASE_URL}${profile.avatar}`} alt="" fill sizes="112px" unoptimized className="object-cover" /> : null}
      <AvatarFallback className="bg-bnr-gunmetal font-cinzel text-bnr-lilac">{initial}</AvatarFallback>
    </Avatar>
  );
}

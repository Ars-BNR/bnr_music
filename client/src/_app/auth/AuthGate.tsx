"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthStore from "@/shared/store/auth";
import { Skeleton } from "@/shared/ui/skeleton";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const checkAuth = AuthStore((state) => state.checkAuth);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void checkAuth(router).finally(() => setChecked(true));
  }, [checkAuth, router]);

  if (!checked) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Skeleton className="h-8 w-40" /></div>;
  }
  return <>{children}</>;
}

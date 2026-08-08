"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthStore from "@/shared/store/auth";
import { HeraldicLoader } from "@/shared/ui/heraldic-loader";

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const checkAuth = AuthStore((state) => state.checkAuth);
  const isAuth = AuthStore((state) => state.isAuth);
  const principal = AuthStore((state) => state.profiles?.user);
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    void checkAuth(router).finally(() => {
      if (active) setChecked(true);
    });
    return () => { active = false; };
  }, [checkAuth, router]);

  useEffect(() => {
    if (checked && isAuth && principal?.mustChangePassword && pathname !== "/settings") {
      router.replace("/settings?tab=security&forced=1");
    }
  }, [checked, isAuth, pathname, principal?.mustChangePassword, router]);

  // Keep the protected layout covered while `checkAuth` redirects to /login.
  // Rendering children after a failed refresh would briefly expose private UI.
  if (!checked || !isAuth || (principal?.mustChangePassword && pathname !== "/settings")) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><HeraldicLoader variant="page" label="Проверяем доступ" /></div>;
  }
  return <>{children}</>;
}

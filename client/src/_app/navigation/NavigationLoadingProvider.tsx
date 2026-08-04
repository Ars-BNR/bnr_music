"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { HeraldicLoader } from "@/shared/ui/heraldic-loader";

const FAILSAFE_DELAY = 10_000;
const EXIT_DELAY = 240;

function RouteCompletion({ onRouteChange }: { onRouteChange: (routeKey: string) => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onRouteChange(`${pathname}?${searchParams.toString()}`);
  }, [onRouteChange, pathname, searchParams]);

  return null;
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const routeKey = useRef<string | null>(null);
  const failsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completion = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(false);

  const clearTimers = useCallback(() => {
    if (failsafe.current) clearTimeout(failsafe.current);
    if (completion.current) clearTimeout(completion.current);
    failsafe.current = null;
    completion.current = null;
  }, []);

  const begin = useCallback(() => {
    clearTimers();
    setPending(true);
    failsafe.current = setTimeout(() => setPending(false), FAILSAFE_DELAY);
  }, [clearTimers]);

  const complete = useCallback((nextRouteKey: string) => {
    const previous = routeKey.current;
    routeKey.current = nextRouteKey;
    if (previous === null || previous === nextRouteKey) return;

    if (failsafe.current) clearTimeout(failsafe.current);
    completion.current = setTimeout(() => setPending(false), EXIT_DELAY);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target || link.hasAttribute("download")) return;

      const next = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      if (next.origin !== current.origin || (next.pathname === current.pathname && next.search === current.search)) return;
      begin();
    };

    const onPopState = () => begin();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [begin]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <>
      <Suspense fallback={null}>
        <RouteCompletion onRouteChange={complete} />
      </Suspense>
      {children}
      {pending ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-background/80 transition-opacity [transition-duration:240ms] motion-reduce:transition-none" aria-busy="true">
          <HeraldicLoader variant="page" label="Открываем архив" />
        </div>
      ) : null}
    </>
  );
}

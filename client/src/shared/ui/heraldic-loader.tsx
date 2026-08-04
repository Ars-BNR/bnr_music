"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/components/lib/utils";
import { FleurDeLis } from "@/shared/ui/brand";

type LoaderVariant = "page" | "section" | "inline";

const sizes: Record<LoaderVariant, string> = {
  page: "size-[76px]",
  section: "size-[52px]",
  inline: "size-6",
};

export function HeraldicLoader({ variant = "section", label = "Загружаем архив", className }: { variant?: LoaderVariant; label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className={cn("flex flex-col items-center gap-3 text-bnr-lilac", className)}>
      <span className={cn("heraldic-loader relative grid place-items-center", sizes[variant])} aria-hidden="true">
        <span className="heraldic-loader__seal absolute inset-0" />
        <FleurDeLis className="heraldic-loader__echo absolute inset-1 text-bnr-violet/25" />
        <FleurDeLis className="heraldic-loader__echo heraldic-loader__echo--late absolute inset-1 text-bnr-lilac/20" />
        <FleurDeLis className="relative z-10 size-[56%] text-bnr-lilac" />
      </span>
      {variant !== "inline" ? <span className="font-cinzel text-[10px] tracking-[0.18em] text-bnr-ash">{label}</span> : <span className="sr-only">{label}</span>}
    </div>
  );
}

export function LoadingReveal({ loading, children, label, variant = "section", className }: { loading: boolean; children: React.ReactNode; label?: string; variant?: LoaderVariant; className?: string }) {
  const [phase, setPhase] = useState<"hidden" | "visible" | "exiting">("hidden");
  const [reducedMotion, setReducedMotion] = useState(false);
  const visibleAt = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
  }, []);

  const changePhase = useCallback((next: "hidden" | "visible" | "exiting") => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    clearTimers();

    if (loading) {
      if (phaseRef.current === "exiting") {
        changePhase("visible");
      } else if (phaseRef.current === "hidden") {
        const show = setTimeout(() => {
          visibleAt.current = Date.now();
          changePhase("visible");
        }, 120);
        timers.current.push(show);
      }
      return clearTimers;
    }

    if (phaseRef.current === "visible") {
      const elapsed = visibleAt.current === null ? 0 : Date.now() - visibleAt.current;
      const wait = reducedMotion ? 0 : Math.max(0, 420 - elapsed);
      const exit = setTimeout(() => {
        if (reducedMotion) {
          visibleAt.current = null;
          changePhase("hidden");
          return;
        }
        changePhase("exiting");
        const hide = setTimeout(() => {
          visibleAt.current = null;
          changePhase("hidden");
        }, 240);
        timers.current.push(hide);
      }, wait);
      timers.current.push(exit);
    }

    return clearTimers;
  }, [changePhase, clearTimers, loading, reducedMotion]);

  const isVisible = phase !== "hidden";

  return <div aria-busy={loading || isVisible} className={cn("relative min-w-0", className)}>
    <div className={cn("transition-opacity [transition-duration:280ms] motion-reduce:transition-none", loading || isVisible ? "pointer-events-none opacity-0" : "opacity-100")}>{children}</div>
    {isVisible ? <div className={cn("absolute inset-0 grid min-h-40 place-items-center bg-background/85 transition-opacity [transition-duration:240ms] motion-reduce:transition-none", phase === "exiting" && "opacity-0")}><HeraldicLoader variant={variant} label={label} /></div> : null}
  </div>;
}

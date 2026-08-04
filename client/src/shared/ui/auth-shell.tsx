import { FleurDeLis } from "@/shared/ui/brand";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-bnr-abyss px-3 py-6 text-bnr-bone sm:px-6 sm:py-10">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--bnr-violet)/0.19),transparent_30%),radial-gradient(circle_at_85%_85%,hsl(var(--bnr-lilac)/0.1),transparent_28%)]" />
      <section className="relative grid w-full max-w-[1120px] overflow-hidden border border-bnr-lilac/40 bg-bnr-gunmetal shadow-[0_24px_70px_hsl(var(--bnr-abyss)/0.65)] md:grid-cols-[52fr_48fr]" aria-labelledby="auth-heading">
        <div aria-hidden="true" className="absolute inset-1 border border-bnr-ash/25 pointer-events-none" />
        <div className="relative hidden min-h-[620px] overflow-hidden border-r border-bnr-lilac/25 px-10 py-12 md:flex md:flex-col md:justify-between">
          <FleurDeLis className="absolute -left-24 -top-16 size-[430px] text-bnr-lilac/[0.07]" />
          <div className="relative flex items-center gap-3 text-bnr-lilac">
            <FleurDeLis className="size-9" />
            <span className="font-cinzel text-xs font-semibold uppercase tracking-[0.32em]">Be Natural Rare</span>
          </div>
          <div className="relative max-w-sm">
            <p className="font-cinzel text-5xl font-semibold tracking-[0.18em] text-bnr-bone">BNR</p>
            <div className="my-5 flex items-center gap-3 text-bnr-lilac"><span className="h-px flex-1 bg-current/45" /><FleurDeLis className="size-5" /><span className="h-px flex-1 bg-current/45" /></div>
            <p className="text-[15px] leading-7 text-bnr-ash">Музыкальная коллекция с характером. Ваши треки, плейлисты и история звучания — в одном месте.</p>
          </div>
          <p className="relative font-cinzel text-[10px] uppercase tracking-[0.26em] text-bnr-ash">The Third Sound Collection</p>
        </div>

        <div className="relative flex min-h-[min(640px,calc(100dvh-48px))] items-center px-5 py-10 sm:px-10 md:px-12">
          <FleurDeLis aria-hidden="true" className="absolute -right-10 -top-8 size-40 text-bnr-lilac/[0.07] md:hidden" />
          <div className="relative mx-auto w-full max-w-[440px]">
            <div className="mb-8 md:hidden">
              <div className="mb-4 flex items-center gap-2 text-bnr-lilac"><FleurDeLis className="size-6" /><span className="font-cinzel text-[11px] uppercase tracking-[0.26em]">BNR</span></div>
            </div>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-bnr-lilac"><FleurDeLis aria-hidden="true" className="size-3.5" /> Личный доступ</p>
            <h1 id="auth-heading" className="font-cinzel text-[32px] font-semibold leading-tight tracking-wide text-bnr-bone md:text-[40px]">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-bnr-ash md:text-[15px]">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}

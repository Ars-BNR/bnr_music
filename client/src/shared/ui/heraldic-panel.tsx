import { cn } from "@/shared/components/lib/utils";
import { FleurDeLis } from "@/shared/ui/brand";

export function HeraldicPanel({
  children,
  className,
  watermark = false,
}: {
  children: React.ReactNode;
  className?: string;
  watermark?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border border-bnr-line/70 bg-bnr-surface shadow-[inset_0_0_0_1px_hsl(var(--bnr-abyss)/0.65),0_16px_44px_hsl(var(--bnr-abyss)/0.28)] before:absolute before:inset-1 before:pointer-events-none before:border before:border-bnr-lilac/10 after:absolute after:bottom-0 after:left-0 after:h-12 after:w-1 after:bg-bnr-violet",
        className,
      )}
    >
      {watermark ? <FleurDeLis aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 size-44 text-bnr-lilac/10" /> : null}
      <div className="relative">{children}</div>
    </section>
  );
}

import { cn } from "@/shared/components/lib/utils";
import { FleurDeLis } from "@/shared/ui/brand";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  description?: string;
}

export function SectionHeading({ children, className, description }: SectionHeadingProps) {
  return (
    <header className={cn("mb-4 flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-2 text-bnr-bone">
        <FleurDeLis aria-hidden="true" className="size-4 text-bnr-lilac" />
        <h2 className="font-cinzel text-xl font-semibold tracking-wide sm:text-[22px]">{children}</h2>
        <span aria-hidden="true" className="h-px min-w-8 flex-1 bg-gradient-to-r from-bnr-lilac/55 to-transparent" />
      </div>
      {description ? <p className="text-sm text-bnr-ash">{description}</p> : null}
    </header>
  );
}

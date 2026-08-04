import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/shared/components/lib/utils";
import { FleurDeLis } from "@/shared/ui/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

interface CardItemProps {
  variant?: "track" | "author" | "genre" | "collection";
  imageUrl?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  active?: boolean;
  onAction?: () => void;
  href?: string;
  ariaLabel?: string;
  className?: string;
}

const CardItem = ({
  variant = "collection",
  imageUrl,
  title,
  subtitle,
  icon,
  active = false,
  onAction,
  href,
  ariaLabel,
  className = "",
}: CardItemProps) => {
  const isTrack = variant === "track";
  const isAuthor = variant === "author";
  const isGenre = variant === "genre";
  const interactive = Boolean(onAction || href);

  const visual = (
    <Card
      className={cn(
        "group relative h-full overflow-hidden border-bnr-ash/20 bg-bnr-gunmetal text-bnr-bone transition-[border-color,transform,box-shadow] [transition-duration:180ms] ease-out motion-reduce:transition-none",
        interactive && "group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5 group-hover:border-bnr-lilac/65 group-focus-visible:border-bnr-lilac/65 group-hover:shadow-[0_12px_28px_hsl(var(--bnr-abyss)/0.42)] group-focus-visible:shadow-[0_12px_28px_hsl(var(--bnr-abyss)/0.42)] motion-reduce:transform-none",
        active && "border-bnr-violet bg-bnr-violet/15 shadow-[inset_3px_0_0_hsl(var(--bnr-violet))]",
        isGenre && "min-h-[72px] bg-gradient-to-br from-bnr-gunmetal to-bnr-abyss",
        isAuthor && "aspect-[4/5] min-h-[196px]",
        className,
      )}
    >
      {isTrack && (
        <div className="relative aspect-square overflow-hidden bg-bnr-abyss">
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 172px" unoptimized className="object-cover" />
          ) : null}
          <span className="absolute inset-0 grid place-items-center bg-bnr-abyss/55 opacity-0 transition-opacity [transition-duration:180ms] group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
            <Play aria-hidden="true" className="size-8 fill-current text-bnr-bone" />
          </span>
        </div>
      )}

      {isAuthor && (
        <div className="relative flex min-h-[136px] flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-bnr-violet/30 via-bnr-gunmetal to-bnr-abyss">
          <FleurDeLis aria-hidden="true" className="absolute -right-5 -top-5 size-36 text-bnr-lilac/15" />
          <span className="relative grid size-16 place-items-center rounded-full border border-bnr-lilac/45 bg-bnr-abyss/75 font-cinzel text-3xl text-bnr-lilac">
            {title.trim().charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {isGenre && (
        <CardContent className="flex min-h-[72px] items-center gap-3 p-4">
          <span className="grid size-9 shrink-0 place-items-center border border-bnr-lilac/35 bg-bnr-violet/10 text-bnr-lilac">
            <FleurDeLis aria-hidden="true" className="size-5" />
          </span>
          <CardTitle className="line-clamp-2 font-cinzel text-[15px] font-semibold leading-snug tracking-wide" title={title}>
            {title}
          </CardTitle>
        </CardContent>
      )}

      {!isGenre && (
        <CardHeader className={cn("min-w-0 p-3", isAuthor && "mt-auto text-center", variant === "collection" && "items-center text-center")}>
          {variant === "collection" && (
            <div className="mb-1 flex min-h-28 items-center justify-center text-bnr-lilac">{icon ?? <FleurDeLis className="size-14" aria-hidden="true" />}</div>
          )}
          <CardTitle className="line-clamp-2 text-[14px] font-semibold leading-snug" title={title}>{title}</CardTitle>
          {subtitle ? <CardDescription className="line-clamp-1 text-[12px] text-bnr-ash" title={subtitle}>{subtitle}</CardDescription> : null}
        </CardHeader>
      )}
    </Card>
  );

  if (href) {
    return <Link href={href} aria-label={ariaLabel ?? title} className="group block min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac focus-visible:ring-offset-2 focus-visible:ring-offset-bnr-abyss">{visual}</Link>;
  }

  if (onAction) {
    return <button type="button" onClick={onAction} aria-label={ariaLabel} aria-pressed={isTrack ? active : undefined} className="group block min-w-0 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac focus-visible:ring-offset-2 focus-visible:ring-offset-bnr-abyss">{visual}</button>;
  }

  return <article className="min-w-0">{visual}</article>;
};

export default CardItem;

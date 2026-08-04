import { cn } from "@/shared/components/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-bnr-gunmetal", className)}
      {...props}
    />
  );
}

export { Skeleton };

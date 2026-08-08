"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/shared/components/lib/utils";

export type ChartConfig = Record<
  string,
  { label?: React.ReactNode; color?: string }
>;

const ChartContext = React.createContext<ChartConfig>({});

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ className, config, children, ...props }, ref) => (
  <ChartContext.Provider value={config}>
    <div
      ref={ref}
      className={cn(
        "flex justify-center text-xs [&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none",
        className,
      )}
      {...props}
    >
      <RechartsPrimitive.ResponsiveContainer>
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  </ChartContext.Provider>
));
ChartContainer.displayName = "Chart";

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  className,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
  className?: string;
}) {
  const config = React.useContext(ChartContext);
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const source = item.payload as { fullLabel?: string } | undefined;
  return (
    <div
      className={cn(
        "grid min-w-36 gap-1 rounded-md border border-bnr-line bg-bnr-abyss/95 px-3 py-2 text-bnr-bone shadow-xl",
        className,
      )}
    >
      <span className="max-w-72 text-xs text-bnr-ash">
        {source?.fullLabel ?? item.name}
      </span>
      <span className="font-semibold tabular-nums text-bnr-lilac">
        {config.listens?.label ?? "Запуски"}: {Number(item.value).toLocaleString("ru-RU")}
      </span>
    </div>
  );
}

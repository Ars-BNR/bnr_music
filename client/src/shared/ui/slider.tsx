"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/shared/components/lib/utils";

type SliderProps = Omit<
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
  "onChange"
> & {
  onChange?: (value: number[]) => void;
  variant?: "default" | "player";
};

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, onChange, variant = "default", "aria-label": ariaLabel, ...props }, ref) => {
  const handleValueChange = (value: number[]) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center data-[orientation=vertical]:w-5 data-[orientation=vertical]:flex-col",
        className
      )}
      onValueChange={handleValueChange}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5">
        <SliderPrimitive.Range className="absolute h-full bg-primary data-[orientation=vertical]:w-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        className={cn(
          "block h-3 w-3 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "player" && "border-player-accent bg-player-accent"
        )}
      />
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };

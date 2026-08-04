import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/components/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border px-3 py-2 text-base text-bnr-bone ring-offset-background transition-colors placeholder:text-bnr-ash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac focus-visible:ring-offset-2 focus-visible:ring-offset-bnr-abyss disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "h-10 border-input bg-secondary/70",
        auth: "h-12 border-bnr-ash/55 bg-bnr-abyss/70 hover:border-bnr-lilac/70 focus-visible:border-bnr-lilac",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & VariantProps<typeof inputVariants>
>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant, className }),
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

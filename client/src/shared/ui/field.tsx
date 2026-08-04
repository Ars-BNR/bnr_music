"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/components/lib/utils";

export function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn("flex w-full flex-col gap-6", className)} {...props} />;
}

const fieldVariants = cva("group/field flex w-full gap-3 data-[invalid=true]:text-destructive", {
  variants: { orientation: { vertical: "flex-col", horizontal: "flex-row items-center" } },
  defaultVariants: { orientation: "vertical" },
});

export function Field({ className, orientation, ...props }: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return <div role="group" data-slot="field" data-orientation={orientation} className={cn(fieldVariants({ orientation }), className)} {...props} />;
}

export function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" className={cn("w-fit text-sm font-medium leading-snug", className)} {...props} />;
}

export function FieldError({ className, children, ...props }: React.ComponentProps<"div">) {
  if (!children) return null;
  return <div role="alert" data-slot="field-error" className={cn("text-sm text-destructive", className)} {...props}>{children}</div>;
}

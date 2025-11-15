import React from "react";
import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Shimmer({
  className,
  width = "w-full",
  height = "h-4",
}: ShimmerProps) {
  return (
    <div
      className={cn(
        "rounded bg-gradient-to-r from-muted via-muted/60 to-muted",
        width,
        height,
        className
      )}
      style={{
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

export function ShimmerText({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Shimmer width="w-32" />
      <Shimmer width="w-24" />
      <Shimmer width="w-16" />
    </div>
  );
}

"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Loader({ className, ...props }: LoaderProps) {
  return (
    <div {...props} className={cn("animate-spin", className)}>
      <Loader2 />
    </div>
  );
}

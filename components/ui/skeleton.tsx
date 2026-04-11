import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circle" | "text";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-surface-2 relative overflow-hidden",
        "before:absolute before:inset-0 before:shimmer-bg",
        variant === "circle" && "rounded-full",
        variant === "default" && "rounded-xl",
        variant === "text" && "rounded-md h-4",
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
      <Skeleton className="h-40 w-full" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonScriptCard() {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <Skeleton className="h-64 w-full rounded-none rounded-t-2xl" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-4/5 h-5" />
        <Skeleton variant="text" className="w-2/3 h-4" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonScriptCard };

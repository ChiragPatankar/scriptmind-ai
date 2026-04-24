"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-surface-2 ${className ?? ""}`} />;
}

export function AnalyseDashboardSkeleton() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-7 border-b border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Improvement tracker */}
      <Pulse className="h-24" />

      {/* Emotional timeline */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Pulse className="w-9 h-9 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <Pulse className="h-[320px]" />
      </div>

      {/* Emotion distribution */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Pulse className="w-9 h-9 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
        <Pulse className="h-[520px]" />
      </div>

      {/* Character analysis */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Pulse className="w-9 h-9 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Pulse className="h-64" />
            <Pulse className="h-64" />
          </div>
          <Pulse className="h-72" />
        </div>
      </div>

      {/* Dialogue + Insights */}
      <Pulse className="h-32" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => <Pulse key={i} className="h-40" />)}
      </div>

      {/* Best scene */}
      <Pulse className="h-28" />

      {/* Utilities */}
      <Pulse className="h-20" />
    </div>
  );
}

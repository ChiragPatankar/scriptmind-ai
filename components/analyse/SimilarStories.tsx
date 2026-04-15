"use client";

import React from "react";
import { Film } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SimilarStories({ titles }: { titles: string[] }) {
  return (
    <Card variant="default" className="border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center">
            <Film className="w-4 h-4 text-secondary" />
          </span>
          Similar stories
        </CardTitle>
        <p className="text-xs text-text-muted font-normal mt-1">
          Tone / structure neighbours in the model&apos;s reference space — not plagiarism checks.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {titles.map((t) => (
            <Badge
              key={t}
              variant="default"
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-surface-2 border border-border hover:border-accent/40 hover:bg-surface-3 transition-colors cursor-default"
            >
              {t}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import React from "react";
import { Lightbulb, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InsightsSection({
  insights,
  bestScene,
}: {
  insights: string[];
  bestScene: string;
}) {
  return (
    <section id="script-insights" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card variant="default" className="border-border/80 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-gold" />
            </span>
            Improvements needed
          </CardTitle>
          <p className="text-xs text-text-muted font-normal mt-1">
            AI-generated revision notes — prioritize what moves the needle for your draft.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {insights.map((line, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-text-secondary leading-relaxed"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card
        variant="default"
        className="border-accent/25 bg-gradient-to-br from-accent/10 via-transparent to-secondary/5 lg:col-span-1"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
              <Star className="w-4 h-4 text-gold" />
            </span>
            Most impactful scene
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-accent/30 bg-surface/80 px-5 py-6 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-wider text-secondary mb-2">
              Highlight
            </p>
            <p className="text-base font-semibold text-text-primary leading-relaxed">
              {bestScene}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

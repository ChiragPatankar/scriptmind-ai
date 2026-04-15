"use client";

import React, { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FileDown, Languages, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { exportAnalyseReportPDF } from "@/lib/exportAnalysePDF";
import type { AnalyseScriptReport } from "@/lib/mock/analyse-script";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "hinglish", label: "Hinglish" },
  { id: "ta", label: "Tamil" },
  { id: "te", label: "Telugu" },
] as const;

export function AnalyseUtilities({ report }: { report: AnalyseScriptReport }) {
  const [lang, setLang] = useState<(typeof LANGUAGES)[number]>(LANGUAGES[0]);
  const [exporting, setExporting] = useState(false);

  const handlePdf = async () => {
    setExporting(true);
    try {
      await exportAnalyseReportPDF(report, lang.label);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card variant="default" className="border-border/80">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary">Utilities</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Export for producers or switch report language for localized notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-medium",
                  "bg-surface-2 border border-border text-text-primary",
                  "hover:bg-surface-3 hover:border-accent/30 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                )}
              >
                <Languages className="w-4 h-4 text-secondary" />
                {lang.label}
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] rounded-xl border border-border bg-surface p-1.5 shadow-xl z-[200]"
                sideOffset={6}
                align="end"
              >
                {LANGUAGES.map((l) => (
                  <DropdownMenu.Item
                    key={l.id}
                    className={cn(
                      "flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer",
                      "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                    )}
                    onSelect={() => setLang(l)}
                  >
                    {l.label}
                    {lang.id === l.id && (
                      <Check className="w-4 h-4 text-accent" />
                    )}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <Button
            variant="default"
            loading={exporting}
            leftIcon={<FileDown className="w-4 h-4" />}
            onClick={handlePdf}
          >
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

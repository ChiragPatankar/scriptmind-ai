import Image from "next/image";
import { cn } from "@/lib/utils";

const presets = {
  sm: { wrap: "w-9 h-9 rounded-xl p-1", imgW: 32, imgH: 32 },
  md: { wrap: "w-8 h-8 rounded-lg p-1", imgW: 28, imgH: 28 },
  /** Taller box: `logo.png` is a vertical lockup (mark + wordmark), not a square icon. */
  lg: { wrap: "h-24 w-28 max-w-[min(100%,7rem)] rounded-2xl p-2", imgW: 112, imgH: 88 },
} as const;

export type ScriptMindLogoMarkSize = keyof typeof presets;

type ScriptMindLogoMarkProps = {
  size?: ScriptMindLogoMarkSize;
  className?: string;
  priority?: boolean;
};

/** White “pill” behind mark so full-colour logos read clearly on dark UI. */
export function ScriptMindLogoMark({
  size = "sm",
  className,
  priority = false,
}: ScriptMindLogoMarkProps) {
  const p = presets[size];
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white flex items-center justify-center flex-shrink-0",
        "shadow-[0_0_16px_rgba(29,119,197,0.35)] group-hover:shadow-[0_0_24px_rgba(29,119,197,0.55)] transition-shadow duration-300",
        p.wrap,
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="ScriptMind AI"
        width={p.imgW}
        height={p.imgH}
        className="object-contain max-h-full max-w-full h-auto w-auto"
        /* Avoid `/_next/image` — on Cloudflare Workers that path can fail while the shell still renders. */
        unoptimized
        priority={priority}
      />
    </div>
  );
}

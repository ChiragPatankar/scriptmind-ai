import type { Metadata } from "next";
import Link from "next/link";
import {
  Clapperboard,
  Film,
  Globe,
  HeartHandshake,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScriptMindLogoMark } from "@/components/brand/ScriptMindLogoMark";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "ScriptMind AI helps filmmakers and writers worldwide go from idea to screen — with AI-assisted scripts, dialogue, analysis, and finance tools built for any market or language.",
};

const pillars = [
  {
    icon: Film,
    title: "Built for how films get made",
    body: "Theatrical, streaming, web, or festival — wherever you work, the workflow follows real production rhythms, not generic document templates.",
  },
  {
    icon: Sparkles,
    title: "AI as a co-writer",
    body: "We use AI to sharpen drafts, suggest structure, and speed up iteration — you stay in control of voice, tone, and creative choices.",
  },
  {
    icon: Target,
    title: "From script to strategy",
    body: "Beyond words on a page, ScriptMind connects creative work with planning — credits, usage, and tools that scale whether you are indie or in a global studio chain.",
  },
];

const values = [
  {
    icon: HeartHandshake,
    title: "Respect for writers",
    body: "Your scripts are yours. We design flows so outputs support your process — not replace it.",
  },
  {
    icon: Lightbulb,
    title: "Clarity over hype",
    body: "We prefer honest product copy, transparent limits, and interfaces that stay readable under deadline pressure.",
  },
  {
    icon: Globe,
    title: "Stories without borders",
    body: "We design for multilingual dialogue, regional formats, and different box-office and streaming models — so writers and producers anywhere can work in their own context.",
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-[-20%] left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent/12 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[420px] w-[520px] rounded-full bg-secondary/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        {/* Hero */}
        <header className="mx-auto mb-20 max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <ScriptMindLogoMark size="lg" />
          </div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            About ScriptMind AI
          </p>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            <span className="text-gradient-white">Where stories meet</span>
            <br />
            <span className="text-gradient">structure &amp; scale</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-text-secondary">
            We are building an all-in-one workspace for filmmakers and writers around the world —
            blending script development, AI dialogue, analysis, and financial planning so your next
            project moves from spark to schedule with less friction, in any language or market.
          </p>
        </header>

        {/* Stats strip */}
        <section
          className="mb-20 grid gap-4 rounded-2xl border border-white/[0.08] bg-surface/40 p-6 backdrop-blur-md sm:grid-cols-3"
          aria-label="Highlights"
        >
          {[
            { k: "Focus", v: "Script → screen", d: "One connected workflow worldwide" },
            { k: "Reach", v: "Global by design", d: "Markets, languages & release models" },
            { k: "Approach", v: "Human-led AI", d: "Tools that amplify, not replace" },
          ].map((item) => (
            <div key={item.k} className="text-center sm:text-left">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{item.k}</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{item.v}</p>
              <p className="mt-0.5 text-sm text-text-secondary">{item.d}</p>
            </div>
          ))}
        </section>

        {/* Pillars */}
        <section className="mb-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Why we exist</h2>
            <p className="mt-3 text-text-secondary">
              Film development is fragmented everywhere — notes in docs, budgets in sheets, feedback
              in chats. ScriptMind brings the creative core into one calm, fast surface for teams
              in any time zone.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface/50 p-6 shadow-card transition-colors duration-300 hover:border-accent/25"
              >
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-accent/20 to-secondary/10 p-3 text-accent ring-1 ring-white/10">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-text-primary">{title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{body}</p>
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl transition-opacity group-hover:opacity-100" />
              </article>
            ))}
          </div>
        </section>

        {/* Values — bento */}
        <section className="mb-20">
          <h2 className="mb-10 text-2xl font-bold text-text-primary sm:text-3xl">What we care about</h2>
          <div className="grid gap-4 md:grid-cols-12">
            <article className="md:col-span-7 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-surface/80 to-surface-2/50 p-8 lg:p-10">
              <div className="mb-6 flex items-center gap-3">
                <Clapperboard className="h-8 w-8 text-secondary" aria-hidden />
                <span className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                  Our mission
                </span>
              </div>
              <p className="text-xl font-semibold leading-snug text-text-primary sm:text-2xl">
                Give every serious storyteller, anywhere on the map, access to the same calibre of
                tooling major studios rely on — without losing the soul of the draft.
              </p>
            </article>
            <div className="grid gap-4 md:col-span-5">
              {values.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="flex flex-1 flex-col justify-center rounded-2xl border border-white/[0.06] bg-surface/40 p-6 backdrop-blur-sm"
                >
                  <Icon className="mb-3 h-6 w-6 text-accent" aria-hidden />
                  <h3 className="mb-1 font-bold text-text-primary">{title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/15 via-surface/60 to-secondary/10 px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,119,197,0.25),transparent_55%)]" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-black text-text-primary sm:text-3xl">
              Ready to work on your next draft?
            </h2>
            <p className="mt-4 text-text-secondary">
              Start free, explore AI dialogue and script analysis, and invite your team when you are
              ready.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link href="/signup">
                <Button size="lg" className="min-w-[200px] glow-accent">
                  Get started free
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="glass" size="lg" className="min-w-[160px] border-white/10 bg-white/5">
                  Talk to us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

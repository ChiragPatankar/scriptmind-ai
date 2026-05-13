"use client";

import React from "react";

/**
 * Renders Scripty's replies with clickable links.
 * Handles, in order:
 *   1. Markdown links   [label](/path)  or  [label](https://...)  or  [label](mailto:...)
 *   2. Bare full URLs   https://example.com/x
 *   3. Bare email addrs someone@example.com
 *   4. Bare app routes  /analyse, /pricing, /settings, ...
 */

const KNOWN_ROUTES = [
  "/analyse",
  "/dialogue",
  "/create-story",
  "/visualize",
  "/poster",
  "/financial",
  "/projects",
  "/download-scripts",
  "/tutorial",
  "/settings",
  "/pricing",
  "/login",
  "/signup",
  "/forgot-password",
  "/onboarding",
  "/api-docs",
  "/about",
  "/support",
  "/privacy",
  "/terms",
  "/refunds",
  "/cookies",
  "/dmca",
];

const routePattern = KNOWN_ROUTES.map((r) => r.replace(/\//g, "\\/")).join("|");

const LINK_REGEX = new RegExp(
  [
    String.raw`\[([^\]]+)\]\(([^)\s]+)\)`,
    String.raw`https?:\/\/[^\s<>()]+[^\s<>().,;:!?]`,
    String.raw`[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`,
    String.raw`(?<![A-Za-z0-9_])(?:${routePattern})\b`,
  ].join("|"),
  "g"
);

export function RichText({ text }: { text: string }): React.ReactElement {
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  // Reset regex state — it's module-level so multiple calls would share lastIndex.
  LINK_REGEX.lastIndex = 0;

  while ((match = LINK_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push(text.slice(lastIndex, match.index));
    }

    const [whole, mdLabel, mdTarget] = match;
    let label = whole;
    let href = whole;
    let isExternal = false;

    if (mdLabel && mdTarget) {
      label = mdLabel;
      href = mdTarget;
    }

    if (/^https?:\/\//i.test(href)) {
      isExternal = true;
    } else if (/^mailto:/i.test(href)) {
      isExternal = false;
    } else if (href.includes("@") && !href.startsWith("/")) {
      href = `mailto:${href}`;
    } else if (!href.startsWith("/") && !href.startsWith("mailto:")) {
      href = `/${href.replace(/^\/+/, "")}`;
    }

    out.push(
      <a
        key={`lnk-${key++}`}
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-accent underline underline-offset-2 decoration-accent/50 hover:decoration-accent transition-colors"
      >
        {label}
      </a>
    );

    lastIndex = match.index + whole.length;
  }

  if (lastIndex < text.length) {
    out.push(text.slice(lastIndex));
  }

  return <>{out}</>;
}

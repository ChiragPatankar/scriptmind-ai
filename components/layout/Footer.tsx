"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Code2, Globe, PlaySquare } from "lucide-react";

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Home", href: "/" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Analyse script", href: "/analyse" },
      { label: "AI dialogue", href: "/dialogue" },
      { label: "Create story", href: "/create-story" },
      { label: "Visualize scene", href: "/visualize" },
      { label: "Poster generator", href: "/poster" },
      { label: "Finance studio", href: "/financial" },
    ],
  },
  {
    title: "Terms",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "DMCA Policy", href: "/dmca" },
      { label: "Refund Policy", href: "/refunds" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Documentation", href: "/api-docs" },
      { label: "Support center", href: "/support" },
      { label: "Tutorials", href: "/tutorial" },
    ],
  },
];

const socialLinks = [
  { icon: X, href: "https://twitter.com", label: "Twitter / X" },
  { icon: Code2, href: "https://github.com", label: "GitHub" },
  { icon: Globe, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: PlaySquare, href: "https://youtube.com", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="relative bg-surface border-t border-border overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 pb-12 border-b border-border">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white flex items-center justify-center p-0.5">
                <Image
                  src="/logo.png"
                  alt="ScriptMind AI"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <span className="text-base font-bold text-text-primary">
                ScriptMind <span className="text-gradient">AI</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed mb-5 max-w-[220px]">
              AI-powered tools for screenwriters and producers worldwide — scripts, dialogue,
              analysis, and planning in one place.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/10 transition-all duration-200"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-text-primary mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted hover:text-text-secondary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} ScriptMind AI. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-text-muted text-center">
            <span>Made with</span>
            <span className="text-red-400">♥</span>
            <span>for storytellers everywhere</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs text-text-muted">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

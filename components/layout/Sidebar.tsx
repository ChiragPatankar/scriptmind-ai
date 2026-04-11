"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  MessageSquare,
  PenTool,
  Home,
  BookOpen,
  IndianRupee,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store";

const navItems = [
  {
    section: "Main",
    items: [
      { label: "Dashboard",   href: "/projects",          icon: Home       },
      { label: "My Projects", href: "/projects",          icon: FolderOpen, badge: "3" },
    ],
  },
  {
    section: "Tools",
    items: [
      { label: "Analyse Script",   href: "/analyse",           icon: BarChart3    },
      { label: "AI Dialogue",      href: "/dialogue",          icon: MessageSquare },
      { label: "Create Story",     href: "/create-story",      icon: PenTool      },
      { label: "Finance Studio",   href: "/financial",         icon: IndianRupee  },
      { label: "Download Scripts", href: "/download-scripts",  icon: Download     },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Tutorial & Help", href: "/tutorial", icon: BookOpen  },
      { label: "Settings",        href: "/settings", icon: Settings  },
    ],
  },
];

// Sidebar widths (must match DashboardNavbar / layout offsets)
const EXPANDED_W  = 240;
const COLLAPSED_W = 68;

const easing = [0.22, 1, 0.36, 1] as const;

export default function Sidebar() {
  const pathname          = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  // Auto-collapse on small screens, auto-expand on large screens
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      const store = useUIStore.getState();
      if (e.matches && !store.sidebarCollapsed) store.toggleSidebar();
      if (!e.matches && store.sidebarCollapsed)  store.toggleSidebar();
    };
    handle(mq);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768 && !sidebarCollapsed) toggleSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isMobileOpen = !sidebarCollapsed;

  return (
    <>
      {/* ── Mobile backdrop overlay ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 bg-black/60 md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar panel ─────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? COLLAPSED_W : EXPANDED_W }}
        transition={{ duration: 0.3, ease: easing }}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-30 flex flex-col bg-surface border-r border-border overflow-hidden",
          // On mobile: slide fully off-screen when collapsed
          "max-md:transition-transform max-md:duration-300",
          sidebarCollapsed ? "max-md:-translate-x-full" : "max-md:translate-x-0"
        )}
      >
        {/* ── Logo ── */}
        <div className="flex items-center h-16 px-4 border-b border-border flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            {/* Logo icon — white pill preserves the logo's own colours */}
            <div className="w-8 h-8 rounded-lg flex-shrink-0 bg-white flex items-center justify-center p-1
                            shadow-[0_0_14px_rgba(29,119,197,0.35)] overflow-hidden">
              <Image
                src="/logo.png"
                alt="ScriptMind AI"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>

            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-base font-bold text-text-primary whitespace-nowrap overflow-hidden"
                >
                  ScriptMind{" "}
                  <span className="text-gradient">AI</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4">
          {navItems.map((section) => (
            <div key={section.section} className="mb-6">
              {/* Section label */}
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-4 mb-2"
                  >
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">
                      {section.section}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Items */}
              <div className="space-y-0.5 px-2">
                {section.items.map((item) => {
                  const Icon     = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                        isActive
                          ? "bg-accent/15 text-accent"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full"
                        />
                      )}

                      <Icon className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-accent"
                          : "text-text-muted group-hover:text-text-secondary"
                      )} />

                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-between flex-1 overflow-hidden"
                          >
                            <span className="text-sm font-medium whitespace-nowrap">
                              {item.label}
                            </span>
                            {"badge" in item && item.badge && (
                              <span className="ml-auto flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
                                {item.badge}
                              </span>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Upgrade banner ── */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-3 mb-4 p-3.5 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 overflow-hidden"
            >
              <p className="text-xs font-semibold text-text-primary mb-1">Upgrade to Pro</p>
              <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
                Unlock unlimited scripts &amp; AI features
              </p>
              <Link
                href="/pricing"
                className="block text-center text-xs font-semibold py-2 rounded-lg bg-gradient-accent text-white hover:shadow-glow-sm transition-shadow duration-200"
              >
                View Plans
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* ── Desktop toggle button ── */}
      <motion.button
        onClick={toggleSidebar}
        animate={{ left: sidebarCollapsed ? COLLAPSED_W - 12 : EXPANDED_W - 12 }}
        transition={{ duration: 0.3, ease: easing }}
        className={cn(
          "fixed top-[72px] z-40",
          "w-6 h-6 rounded-full",
          "hidden md:flex items-center justify-center",
          "bg-surface border border-border shadow-card",
          "text-text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/8",
          "transition-colors duration-200"
        )}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed
          ? <ChevronRight className="w-3.5 h-3.5" />
          : <ChevronLeft  className="w-3.5 h-3.5" />
        }
      </motion.button>

      {/* ── Mobile close button (inside expanded sidebar) ── */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed top-4 right-4 z-40 md:hidden w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text-primary"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

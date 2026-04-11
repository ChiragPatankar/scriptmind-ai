"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, ChevronRight, User, LogOut, Settings, HelpCircle, Menu } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";

const routeLabels: Record<string, string> = {
  "/projects": "My Projects",
  "/analyse": "Analyse Script",
  "/dialogue": "AI Dialogue",
  "/create-story": "Create Story",
  "/download-scripts": "Download Scripts",
  "/settings": "Settings",
  "/tutorial": "Tutorial & Help",
};

export default function DashboardNavbar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const pageTitle = routeLabels[pathname] || "Dashboard";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-20 h-16 border-b border-border",
        "glass-strong transition-all duration-300",
        // Mobile: full width (sidebar is off-screen)
        "left-0",
        // Desktop: offset by sidebar width
        sidebarCollapsed ? "md:left-[68px]" : "md:left-[240px]"
      )}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6 gap-2">
        {/* Mobile hamburger + Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {/* Hamburger — mobile only */}
          <button
            onClick={toggleSidebar}
            className="md:hidden flex-shrink-0 w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent/30 transition-all duration-200"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <Link href="/" className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0 hidden sm:block">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0 hidden sm:block" />
            <span className="text-text-primary font-medium truncate">{pageTitle}</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Search — hidden on xs */}
          <button className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg bg-surface-2 border border-border text-text-muted hover:text-text-secondary hover:border-accent/30 transition-all duration-200 text-sm">
            <Search className="w-4 h-4" />
            <span className="hidden md:block">Search...</span>
            <kbd className="hidden md:block text-[10px] px-1.5 py-0.5 rounded bg-surface-3 border border-border font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button className="relative w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent/30 transition-all duration-200">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
          </button>

          {/* User Menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2.5 pl-2 pr-3 h-9 rounded-lg bg-surface-2 border border-border hover:border-accent/30 transition-all duration-200 group">
                <div className="w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-white">A</span>
                </div>
                <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary hidden sm:block transition-colors">
                  Arjun
                </span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] bg-surface border border-border rounded-xl shadow-glass p-1.5 mt-1"
                align="end"
                sideOffset={5}
              >
                {[
                  { icon: User, label: "Profile", href: "/settings" },
                  { icon: Settings, label: "Settings", href: "/settings" },
                  { icon: HelpCircle, label: "Help & Support", href: "/tutorial" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenu.Item key={item.label} asChild>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer outline-none"
                      >
                        <Icon className="w-4 h-4 text-text-muted" />
                        {item.label}
                      </Link>
                    </DropdownMenu.Item>
                  );
                })}
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer outline-none">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}

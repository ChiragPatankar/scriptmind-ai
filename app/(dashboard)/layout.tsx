"use client";

import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <DashboardNavbar />
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          // Mobile: no sidebar padding (sidebar slides off-screen)
          // Desktop: match sidebar width
          "pl-0",
          "md:pl-[68px]",
          !sidebarCollapsed && "md:pl-[240px]"
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}

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
          "pl-0",
          "md:pl-[68px]",
          !sidebarCollapsed && "md:pl-[240px]"
        )}
      >
        <div className="mx-auto max-w-[1400px] p-4 pb-12 sm:p-6 sm:pb-14 lg:p-8 lg:pb-16">{children}</div>
      </main>
    </div>
  );
}

"use client";

import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import SubscriptionExpiredBanner from "@/components/SubscriptionExpiredBanner";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Sidebar />
      <DashboardNavbar />
      <div
        className={cn(
          "fixed top-16 left-0 right-0 z-40 transition-all duration-300",
          "md:left-[68px]",
          !sidebarCollapsed && "md:left-[240px]"
        )}
      >
        <SubscriptionExpiredBanner />
      </div>
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300 overflow-x-hidden",
          "pl-0",
          "md:pl-[68px]",
          !sidebarCollapsed && "md:pl-[240px]"
        )}
      >
        <div className="w-full max-w-[1400px] mx-auto p-4 pb-12 sm:p-6 sm:pb-14 lg:p-8 lg:pb-16 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

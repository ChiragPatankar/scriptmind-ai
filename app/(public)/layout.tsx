import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* "dark" class here forces the cinematic dark theme for all public
       pages regardless of the user's dashboard theme preference.
       CSS custom properties cascade, so every component inside
       inherits the dark-mode design tokens from globals.css. */
    <div className="dark min-h-screen" style={{ colorScheme: "dark" }}>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

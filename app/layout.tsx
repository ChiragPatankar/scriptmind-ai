import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";

export const metadata: Metadata = {
  title: {
    default: "ScriptMind AI — Bollywood Script Hub",
    template: "%s | ScriptMind AI",
  },
  description:
    "The ultimate AI-powered platform for Bollywood scripts, stories, dialogues, and analysis. Trusted by 50,000+ storytellers.",
  keywords: [
    "Bollywood scripts",
    "AI screenplay",
    "Hindi dialogue generator",
    "script analysis",
    "ScriptMind AI",
    "Bollywood screenplay",
  ],
  authors: [{ name: "ScriptMind AI" }],
  creator: "ScriptMind AI",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://scriptmind.ai",
    title: "ScriptMind AI — Bollywood Script Hub",
    description:
      "Stream, analyse, and create Bollywood scripts powered by AI.",
    siteName: "ScriptMind AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScriptMind AI",
    description: "Bollywood scripts, stories & AI dialogues — all in one platform.",
    creator: "@ScriptMindAI",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <MotionProvider>
            <QueryProvider>{children}</QueryProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

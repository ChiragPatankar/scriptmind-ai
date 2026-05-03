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
      <head>
        {/*
          Polyfill for esbuild's __name helper.
          Some pre-bundled npm packages (e.g. framer-motion) reference __name
          as a global when keepNames is enabled. This must run before any
          module script so the identifier is always defined.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(typeof __name==='undefined'){__name=function(t){return t}}",
          }}
        />
        {/* Intercept fetch globally to detect X-Credits-Remaining header and fire credits-changed event */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var _fetch = window.fetch;
  window.fetch = function() {
    return _fetch.apply(this, arguments).then(function(res) {
      var h = res.headers.get('x-credits-remaining');
      if (h !== null) window.dispatchEvent(new CustomEvent('credits-changed', { detail: { remaining: parseInt(h, 10) } }));
      return res;
    });
  };
})();`,
          }}
        />
      </head>
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

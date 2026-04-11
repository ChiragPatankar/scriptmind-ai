import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background flex" style={{ colorScheme: "dark" }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-sm text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">
              ScriptMind <span className="text-gradient">AI</span>
            </span>
          </Link>

          <h2 className="text-4xl font-black text-text-primary mb-4 leading-tight">
            The Bollywood <span className="text-gradient">Script Universe</span>
          </h2>
          <p className="text-text-secondary leading-relaxed mb-10">
            Analyse, generate, and create Bollywood screenplays with the power of AI. Trusted by 50,000+ storytellers.
          </p>

          <div className="flex flex-col gap-3">
            {[
              "10,000+ Bollywood scripts to explore",
              "AI dialogue in Hindi, Hinglish & English",
              "Complete story outline in minutes",
              "Script analysis with instant insights",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm text-text-secondary text-left">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-text-primary">
              ScriptMind <span className="text-gradient">AI</span>
            </span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScriptMindLogoMark } from "@/components/brand/ScriptMindLogoMark";

const benefits = [
  "Free forever plan available",
  "No credit card required",
  "AI dialogue & story tools",
  "Finance Studio built-in",
];

export default function CTASection() {
  return (
    <section className="relative py-24 lg:py-36 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-secondary/8 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Brand mark — same asset as site header */}
          <div className="mb-8 mx-auto flex justify-center">
            <ScriptMindLogoMark size="lg" />
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            <span className="text-gradient-white">Your Film Starts</span>
            <br />
            <span className="text-gradient">Right Here, Right Now</span>
          </h2>

          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
            ScriptMind AI gives filmmakers, writers, and producers the tools to develop scripts, plan budgets, and take their film from idea to box office.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-10">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                <span className="text-sm text-text-secondary">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="xl"
                className="glow-accent group min-w-[220px]"
                rightIcon={
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                }
              >
                Get Started Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="xl" className="min-w-[160px]">
                View Pricing
              </Button>
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  );
}

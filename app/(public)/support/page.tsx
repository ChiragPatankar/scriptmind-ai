"use client";

import { ChatPanel } from "@/components/support/ChatPanel";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mail, X as TwitterX } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-black text-text-primary mb-4">
            How can we <span className="text-gradient">help?</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            Chat with Scripty — our AI support assistant trained on ScriptMind AI.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card variant="glass" hover={false} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[min(640px,calc(100vh-14rem))]">
                <ChatPanel />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 text-xs text-text-muted">
            <span>Still need a human?</span>
            <a
              href="mailto:support@scriptmindai.in"
              className="inline-flex items-center gap-1.5 hover:text-text-primary transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> support@scriptmindai.in
            </a>
            <span className="hidden sm:inline">·</span>
            <a
              href="https://twitter.com/ScriptMindAI"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-text-primary transition-colors"
            >
              <TwitterX className="w-3.5 h-3.5" /> @ScriptMindAI
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

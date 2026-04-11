"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Code2, Terminal, Zap, Lock, Globe, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const endpoints = [
  {
    method: "GET",
    path: "/scripts/search",
    description: "Search the Bollywood script database",
    params: ["q (string)", "genre (string)", "year (number)", "language (string)"],
    methodColor: "text-secondary bg-secondary/15",
  },
  {
    method: "POST",
    path: "/scripts/upload",
    description: "Upload a new script for analysis",
    params: ["file (multipart)", "title (string)", "genre (string)"],
    methodColor: "text-gold bg-gold/15",
  },
  {
    method: "POST",
    path: "/ai/generate-dialogue",
    description: "Generate AI-powered dialogue",
    params: ["characters (array)", "scene (string)", "mood (string)", "language (string)"],
    methodColor: "text-gold bg-gold/15",
  },
  {
    method: "POST",
    path: "/ai/analyse-script",
    description: "Analyse a script with AI insights",
    params: ["script_id (string) or file (multipart)"],
    methodColor: "text-gold bg-gold/15",
  },
  {
    method: "POST",
    path: "/ai/create-story",
    description: "Generate a story outline from a premise",
    params: ["title (string)", "premise (string)", "genre (string)", "tone (string)"],
    methodColor: "text-gold bg-gold/15",
  },
  {
    method: "GET",
    path: "/scripts/{id}/download",
    description: "Download a script in specified format",
    params: ["format (pdf|fdx|txt)"],
    methodColor: "text-secondary bg-secondary/15",
  },
];

const codeExample = `// ScriptMind AI — Quick Start
const response = await fetch('https://api.scriptmind.ai/v1/ai/generate-dialogue', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    characters: ['ARJUN', 'PRIYA'],
    scene: 'Rooftop at midnight, Mumbai',
    mood: 'Romantic',
    language: 'Hinglish',
    style: 'Poetic'
  }),
});

const { dialogue } = await response.json();
console.log(dialogue);
// [
//   { character: 'ARJUN', text: 'Aaj ki raat kuch alag hai...', emotion: 'Romantic' },
//   { character: 'PRIYA', text: 'Haan... jaise waqt ruk gaya ho.', emotion: 'Dreamy' },
// ]`;

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-accent mb-4 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            API Documentation
          </span>
          <h1 className="text-5xl sm:text-6xl font-black text-text-primary mb-4">
            ScriptMind <span className="text-gradient">API</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mb-6">
            Integrate Bollywood script intelligence into your own products. RESTful API with JSON responses.
          </p>
          <div className="flex items-center gap-3">
            <Badge variant="success">v1.0 Stable</Badge>
            <Badge variant="secondary">REST API</Badge>
            <Badge variant="default">JSON</Badge>
          </div>
        </motion.div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-48 flex-shrink-0">
            <div className="sticky top-24 space-y-0.5">
              {["overview", "authentication", "endpoints", "examples", "errors"].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                    activeSection === section
                      ? "bg-accent/15 text-accent"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
                  )}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 min-w-0 space-y-8"
          >
            {/* Base URL */}
            <Card variant="default" hover={false}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-accent" />
                  <span className="text-sm font-semibold text-text-primary">Base URL</span>
                </div>
                <code className="text-sm font-mono text-secondary bg-surface-2 px-3 py-2 rounded-lg block">
                  https://api.scriptmind.ai/v1
                </code>
              </CardContent>
            </Card>

            {/* Auth */}
            <Card variant="default" hover={false}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gold" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-muted mb-4 leading-relaxed">
                  Include your API key in the <code className="bg-surface-2 px-1.5 py-0.5 rounded text-accent">Authorization</code> header as a Bearer token.
                </p>
                <pre className="bg-surface-2 border border-border rounded-xl p-4 text-sm font-mono text-text-secondary overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.scriptmind.ai/v1/scripts/search?q=Sholay`}
                </pre>
              </CardContent>
            </Card>

            {/* Endpoints */}
            <Card variant="default" hover={false}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-accent" />
                  Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {endpoints.map((ep, i) => (
                    <div key={i} className="p-4 rounded-xl bg-surface-2 border border-border hover:border-accent/30 transition-all cursor-pointer group">
                      <div className="flex items-start gap-3">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5", ep.methodColor)}>
                          {ep.method}
                        </span>
                        <div className="flex-1 min-w-0">
                          <code className="text-sm font-mono text-text-primary">{ep.path}</code>
                          <p className="text-xs text-text-muted mt-1">{ep.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {ep.params.map((p) => (
                              <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-3 border border-border font-mono text-text-muted">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0 mt-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Code Example */}
            <Card variant="default" hover={false}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-secondary" />
                  Quick Start Example
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-[#0D0D14] border border-border rounded-xl p-5 text-sm font-mono text-text-secondary overflow-x-auto leading-relaxed">
                  <code>{codeExample}</code>
                </pre>
              </CardContent>
            </Card>

            {/* Rate Limits */}
            <Card variant="default" hover={false}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-gold" />
                  Rate Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { plan: "Free", limit: "100 req/day", color: "text-text-muted" },
                    { plan: "Pro", limit: "1,000 req/day", color: "text-accent" },
                    { plan: "Enterprise", limit: "Unlimited", color: "text-gold" },
                  ].map((tier) => (
                    <div key={tier.plan} className="p-4 rounded-xl bg-surface-2 border border-border text-center">
                      <div className={`text-sm font-bold ${tier.color} mb-1`}>{tier.plan}</div>
                      <div className="text-xs text-text-muted">{tier.limit}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

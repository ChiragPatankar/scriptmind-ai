"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, PlayCircle, ChevronRight, CheckCircle2, Clock, MessageCircle, Mail, FileQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tutorials = [
  {
    id: "1",
    title: "Getting Started with ScriptMind AI",
    description: "Learn the basics of the platform and set up your first project in under 10 minutes.",
    duration: "8 min",
    category: "Beginner",
    completed: true,
    icon: "🎬",
  },
  {
    id: "2",
    title: "How to Analyse a Bollywood Script",
    description: "Deep dive into the script analysis feature — upload, interpret results, and use insights.",
    duration: "12 min",
    category: "Intermediate",
    completed: true,
    icon: "🔍",
  },
  {
    id: "3",
    title: "Generating Authentic Hindi Dialogues",
    description: "Master the dialogue generator with character voice, mood, and language customisation.",
    duration: "15 min",
    category: "Intermediate",
    completed: false,
    icon: "💬",
  },
  {
    id: "4",
    title: "Creating a Full Screenplay Outline",
    description: "Use the story creator to build a 3-act structure with compelling characters and plot.",
    duration: "20 min",
    category: "Advanced",
    completed: false,
    icon: "✍️",
  },
  {
    id: "5",
    title: "Using the ScriptMind API",
    description: "Integrate ScriptMind AI into your own app using our REST API — authentication, endpoints, and best practices.",
    duration: "25 min",
    category: "Developer",
    completed: false,
    icon: "⚡",
  },
];

const faqs = [
  { q: "What script formats can I upload?", a: "We support PDF, Final Draft (.fdx), plain text (.txt), and Word documents (.docx)." },
  { q: "How many scripts can I download for free?", a: "Free plan users can download up to 100 scripts per month. Pro users have unlimited access." },
  { q: "Can the AI write in pure Hindi or Urdu?", a: "Yes! Choose 'Hindi' as the language in the Dialogue Generator for pure Devanagari-script output, or 'Hinglish' for mixed style." },
  { q: "Is my uploaded script kept private?", a: "Absolutely. Your uploads are encrypted and never shared. You can delete them at any time from Settings." },
  { q: "How accurate is the script analysis?", a: "Our analysis model achieves ~98% accuracy for character identification and ~92% for sentiment analysis, benchmarked against human experts." },
];

const categoryColors: Record<string, string> = {
  Beginner: "text-secondary",
  Intermediate: "text-gold",
  Advanced: "text-accent",
  Developer: "text-blue-400",
};

export default function TutorialPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const completed = tutorials.filter((t) => t.completed).length;

  return (
    <div className="max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black text-text-primary mb-1">Tutorial & Help</h1>
        <p className="text-text-muted">Learn everything about ScriptMind AI at your own pace.</p>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card variant="glow" hover={false}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">Your Learning Progress</p>
              <p className="text-text-muted text-xs">{completed} of {tutorials.length} tutorials completed</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-2 bg-surface-3 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completed / tutorials.length) * 100}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-accent to-secondary"
                />
              </div>
              <span className="text-sm font-bold text-text-primary">{Math.round((completed / tutorials.length) * 100)}%</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tutorials */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-10"
      >
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent" />
          Video Tutorials
        </h2>
        <div className="space-y-3">
          {tutorials.map((tutorial, i) => (
            <motion.div
              key={tutorial.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 + 0.2 }}
            >
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border hover:border-accent/30 transition-all duration-200 cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-lg flex-shrink-0">
                  {tutorial.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                      {tutorial.title}
                    </h3>
                    {tutorial.completed && (
                      <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">{tutorial.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-semibold ${categoryColors[tutorial.category]}`}>
                    {tutorial.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    {tutorial.duration}
                  </div>
                  <PlayCircle className="w-8 h-8 text-text-muted group-hover:text-accent transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-10"
      >
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <FileQuestion className="w-5 h-5 text-gold" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-border overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-2 transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              >
                <span className="text-sm font-medium text-text-primary">{faq.q}</span>
                <ChevronRight
                  className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform duration-200 ${
                    expandedFaq === i ? "rotate-90" : ""
                  }`}
                />
              </button>
              {expandedFaq === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4 text-sm text-text-muted bg-surface-2 leading-relaxed"
                >
                  {faq.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-bold text-text-primary mb-4">Still Need Help?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card variant="glass" hover={true}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1">Live Chat</h3>
                <p className="text-xs text-text-muted mb-3 leading-relaxed">Get instant help from our support team. Available Mon–Fri, 9am–6pm IST.</p>
                <Button size="sm" variant="outline">Start Chat</Button>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass" hover={true}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1">Email Support</h3>
                <p className="text-xs text-text-muted mb-3 leading-relaxed">Send us a detailed query and we&apos;ll respond within 24 hours.</p>
                <Button size="sm" variant="secondary">Send Email</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

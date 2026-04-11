"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Mail, X as TwitterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  { id: "account", label: "Account & Billing" },
  { id: "scripts", label: "Script Downloads" },
  { id: "ai", label: "AI Features" },
  { id: "technical", label: "Technical Issues" },
  { id: "api", label: "API & Integrations" },
  { id: "other", label: "Other" },
];

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("ai");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <h1 className="text-5xl font-black text-text-primary mb-4">
            How can we <span className="text-gradient">help?</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            Our team is here to help you create amazing Bollywood stories.
          </p>
        </motion.div>

        {/* Contact Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
          {[
            {
              icon: MessageCircle,
              title: "Live Chat",
              desc: "Get instant help during business hours.",
              cta: "Start Chat",
              color: "text-accent",
              bg: "bg-accent/10",
            },
            {
              icon: Mail,
              title: "Email Support",
              desc: "We respond within 24 hours on weekdays.",
              cta: "Send Email",
              color: "text-secondary",
              bg: "bg-secondary/10",
            },
            {
              icon: TwitterX,
              title: "Twitter / X",
              desc: "Tweet us @ScriptMindAI for quick updates.",
              cta: "Tweet Us",
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
          ].map((channel, i) => {
            const Icon = channel.icon;
            return (
              <motion.div
                key={channel.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
              >
                <Card variant="glass" className="text-center p-6">
                  <CardContent className="p-0">
                    <div className={`w-12 h-12 rounded-2xl ${channel.bg} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-6 h-6 ${channel.color}`} />
                    </div>
                    <h3 className="text-base font-bold text-text-primary mb-2">{channel.title}</h3>
                    <p className="text-sm text-text-muted mb-4 leading-relaxed">{channel.desc}</p>
                    <Button variant="secondary" size="sm">{channel.cta}</Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          {!submitted ? (
            <Card variant="default" hover={false}>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-text-primary mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Arjun Sharma"
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="arjun@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary block mb-1.5">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            category === cat.id
                              ? "bg-accent text-white"
                              : "bg-surface-2 border border-border text-text-muted hover:border-accent/30"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary block mb-1.5">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      required
                      placeholder="Describe your issue in detail..."
                      className="w-full rounded-xl px-4 py-3 bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-3">Message Sent!</h3>
              <p className="text-text-muted mb-6">
                We&apos;ll get back to you at <strong className="text-text-secondary">{email}</strong> within 24 hours.
              </p>
              <Button variant="secondary" onClick={() => setSubmitted(false)}>
                Send Another Message
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
